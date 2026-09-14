"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/supabase/roles";
import type { ProfileRole } from "@/lib/supabase/types";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export interface LoginState {
  error: string | null;
}

// Single login (coach, athlete, or admin). There's no self-signup — an
// account only exists if the /admin panel created it. Runs on the server
// (Server Action) so the per-IP rate limit is real, not something a
// malicious client can bypass.
export async function signIn(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const expectedRole = String(formData.get("expected_role") ?? "");

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const ip = getClientIp(await headers());
  const { success } = await checkRateLimit("login", ip);
  if (!success) {
    return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente de novo." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "E-mail ou senha inválidos." };
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", data.user.id)
    .single();
  // The table generic via @supabase/ssr doesn't propagate the column type
  // here; the shape is known (profiles.role/active) so the assertion is safe.
  const profile = profileData as { role: ProfileRole; active: boolean } | null;

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Esta conta não tem acesso ao site." };
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    return { error: "Esta conta está suspensa. Fale com seu treinador." };
  }

  // Admin can log in from either tab — the toggle is just a convenience
  // for coach/athlete, not a real gate for someone with access to everything.
  if (expectedRole && profile.role !== expectedRole && profile.role !== "admin") {
    await supabase.auth.signOut();
    const correct = profile.role === "coach" ? "treinador" : "aluno";
    return { error: `Essa conta é de ${correct}. Selecione a opção "Sou ${correct}" acima.` };
  }

  redirect(next && next.startsWith("/") ? next : homePathForRole(profile.role));
}
