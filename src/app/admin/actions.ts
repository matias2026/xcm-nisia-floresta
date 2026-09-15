"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/lib/supabase/types";

export interface CreateAccountState {
  error: string | null;
  success: string | null;
}

const initialState: CreateAccountState = { error: null, success: null };

async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data } = await supabase.from("profiles").select("role, active").eq("id", user.id).single();
  // The table generic via @supabase/ssr doesn't propagate the column type
  // here; the shape is known (profiles.role/active) so the assertion is safe.
  const profile = data as { role: ProfileRole; active: boolean } | null;
  if (profile?.role !== "admin" || !profile.active) throw new Error("Acesso restrito ao administrador.");
  return user.id;
}

const roleLabel: Record<ProfileRole, string> = { coach: "treinador", athlete: "aluno", admin: "administrador" };

interface CreateAccountInput {
  email: string;
  password: string;
  fullName: string;
  role: ProfileRole;
  age?: number | null;
  weightKg?: number | null;
  medicalNotes?: string;
}

// Logic shared by "Create account" (direct form) and "Approve"
// (access request). The 50-athlete cap is enforced twice: here
// (pre-check, so we don't create an orphaned Auth user for nothing) and
// in the database (the enforce_athlete_cap trigger, which really holds
// even if someone bypasses this function and inserts directly via SQL/service role).
async function createAccountCore({
  email,
  password: rawPassword,
  fullName,
  role,
  age,
  weightKg,
  medicalNotes,
}: CreateAccountInput): Promise<string | null> {
  const password = rawPassword.trim();
  if (!email || !password || !fullName) return "Preencha nome, e-mail e senha.";
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!["coach", "athlete", "admin"].includes(role)) return "Papel inválido.";

  const admin = createAdminClient();

  if (role === "athlete") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "athlete");
    if (count != null && count >= 50) return "Limite de 50 atletas cadastrados atingido.";
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) return createError?.message ?? "Falha ao criar usuário.";

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: created.user.id, role, full_name: fullName });

  if (profileError) {
    // Rolls back the Auth user so we don't leave an orphaned login without a profile.
    await admin.auth.admin.deleteUser(created.user.id);
    return profileError.message.includes("Limite de 50 atletas")
      ? "Limite de 50 atletas cadastrados atingido."
      : profileError.message;
  }

  // Aluno: já cria a ficha básica (idade, peso, anamnese) com o que foi
  // coletado na hora da conta — o treinador completa o resto (modalidade,
  // FTP, FC, cadência etc.) depois pelo Cockpit.
  if (role === "athlete") {
    const { error: alunoError } = await admin.from("alunos").insert({
      user_id: created.user.id,
      nome: fullName,
      age: age ?? null,
      peso: weightKg ?? null,
      medical_notes: medicalNotes?.trim() ?? "",
    });

    if (alunoError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return alunoError.message;
    }
  }

  return null;
}

// Creates a coach or student login directly. There's no self-signup on
// the site — this is one of two entry points for a new account (the
// other is approving a request in /solicitar-acesso), both behind the admin login.
export async function createAccount(
  _prevState: CreateAccountState,
  formData: FormData
): Promise<CreateAccountState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as ProfileRole;
  const ageRaw = String(formData.get("age") ?? "").trim();
  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const medicalNotes = String(formData.get("medical_notes") ?? "").trim();

  const error = await createAccountCore({
    email,
    password,
    fullName,
    role,
    age: ageRaw ? Number(ageRaw) : null,
    weightKg: weightRaw ? Number(weightRaw) : null,
    medicalNotes,
  });
  if (error) return { ...initialState, error };

  revalidatePath("/admin");
  return { error: null, success: `Conta de ${roleLabel[role]} criada.` };
}

// Suspends/reactivates an account. Suspended: login is now refused
// (checked in the login Server Actions) and RLS cuts off access even for
// someone with an already-open session. An admin can't suspend their own
// account (avoids locking themselves out of the panel).
export async function toggleActive(profileId: string, active: boolean): Promise<void> {
  const adminId = await requireAdmin();

  if (profileId === adminId) {
    throw new Error("Você não pode suspender a própria conta.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ active }).eq("id", profileId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export interface ApproveRequestResult {
  error: string | null;
  password: string | null;
}

// Approves a /solicitar-acesso request: creates the real account (same
// logic as "Create account") with a temporary password generated here —
// there's no email sending in the app, so the password comes back only
// once in this response for the admin to pass along another way (WhatsApp etc).
export async function approveRequest(requestId: string): Promise<ApproveRequestResult> {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { data: reqRow } = await admin
    .from("access_requests")
    .select("id, full_name, email, role_requested, status")
    .eq("id", requestId)
    .single();

  if (!reqRow || reqRow.status !== "pending") {
    return { error: "Pedido não encontrado ou já processado.", password: null };
  }

  const password = randomBytes(9).toString("base64url");

  const error = await createAccountCore({
    email: reqRow.email,
    password,
    fullName: reqRow.full_name,
    role: reqRow.role_requested,
  });

  if (error) return { error, password: null };

  await admin
    .from("access_requests")
    .update({ status: "approved", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath("/admin");
  return { error: null, password };
}

// Denies a request — just marks it as denied, doesn't create anything.
// Nobody is notified automatically (no email in the app); it's up to the admin whether to respond.
export async function denyRequest(requestId: string): Promise<{ error: string | null }> {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("access_requests")
    .update({ status: "denied", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}
