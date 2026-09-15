"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createAccount, type CreateAccountState } from "./actions";

const initialState: CreateAccountState = { error: null, success: null };

const inputClass = "rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring";

export function CreateAccountForm() {
  const [state, formAction, pending] = useActionState(createAccount, initialState);
  const [role, setRole] = useState("athlete");

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">Nome completo</span>
          <input name="full_name" required className={inputClass} />
        </label>

        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">Papel</span>
          <select
            name="role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          >
            <option value="athlete">Aluno</option>
            <option value="coach">Treinador</option>
            <option value="admin">Administrador</option>
          </select>
        </label>

        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">E-mail</span>
          <input type="email" name="email" required className={inputClass} />
        </label>

        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">Senha provisória</span>
          <input
            type="text"
            name="password"
            required
            minLength={8}
            placeholder="mín. 8 caracteres"
            className={inputClass}
          />
        </label>
      </div>

      {/* Ficha básica do aluno — dados mais precisos (modalidade, FTP,
          FC, cadência...) o treinador completa depois pelo Cockpit. */}
      {role === "athlete" && (
        <div className="rounded-xl border border-g4-border bg-g4-surface-alt/40 p-4">
          <p className="text-xs font-semibold text-g4-muted">Ficha básica do aluno (opcional agora)</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-4 text-sm">
              <span className="font-medium text-g4-ink">Idade</span>
              <input type="number" name="age" min={0} className={inputClass} />
            </label>

            <label className="flex flex-col gap-4 text-sm">
              <span className="font-medium text-g4-ink">Peso (kg)</span>
              <input type="number" name="weight_kg" min={0} step={0.1} className={inputClass} />
            </label>

            <label className="flex flex-col gap-4 text-sm sm:col-span-2">
              <span className="font-medium text-g4-ink">Anamnese — doenças ou dores crônicas</span>
              <textarea
                name="medical_notes"
                rows={2}
                placeholder="Ex.: hipertensão controlada, dor crônica no joelho direito..."
                className={inputClass}
              />
            </label>
          </div>
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-lime-deep">{state.success}</p>}

      <Button type="submit" variant="primary" className="self-start px-5" disabled={pending}>
        {pending ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
