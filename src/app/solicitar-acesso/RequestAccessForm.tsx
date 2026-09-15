"use client";

import { useState } from "react";
import { useActionState } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calculateAge, estimateMaxHeartRate } from "@/lib/workout-metrics";
import { submitAccessRequest, type RequestAccessState } from "./actions";

const initialState: RequestAccessState = { error: null, success: false };

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

type RequestRole = "athlete" | "coach";

// Anamnese por checkbox — mais rápido pra preencher no celular do que
// digitar. "Nenhuma" e "Outra" são mutuamente exclusivas com a lista;
// "Outra" libera um campo curto só pra quando não cabe nas opções.
const NONE_OPTION = "Nenhuma dessas";
const OTHER_OPTION = "Outra";
const MEDICAL_CONDITIONS = [
  "Hipertensão",
  "Diabetes",
  "Problema cardíaco",
  "Asma / problema respiratório",
  "Dor crônica no joelho",
  "Dor crônica na coluna/lombar",
  "Dor crônica no ombro",
  "Dor crônica no quadril ou tornozelo",
];

export function RequestAccessForm() {
  const [state, formAction, pending] = useActionState(submitAccessRequest, initialState);
  const [role, setRole] = useState<RequestRole>("athlete");
  const [birthDate, setBirthDate] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  const estimatedHrMax =
    birthDate && !Number.isNaN(Date.parse(birthDate)) ? estimateMaxHeartRate(calculateAge(birthDate)) : null;

  function toggleCondition(option: string) {
    setConditions((prev) => {
      if (option === NONE_OPTION) return prev.includes(NONE_OPTION) ? [] : [NONE_OPTION];
      const withoutNone = prev.filter((c) => c !== NONE_OPTION);
      return withoutNone.includes(option) ? withoutNone.filter((c) => c !== option) : [...withoutNone, option];
    });
  }

  const medicalNotes = conditions.includes(NONE_OPTION)
    ? ""
    : conditions
        .map((c) => (c === OTHER_OPTION ? (otherText.trim() ? `Outra: ${otherText.trim()}` : null) : c))
        .filter((c): c is string => c !== null)
        .join("; ");

  if (state.success) {
    return (
      <Card className="w-full max-w-sm p-6 text-center">
        <h1 className="text-lg font-bold text-g4-ink">Pedido enviado!</h1>
        <p className="mt-2 text-sm text-g4-muted">
          O treinador vai revisar seu pedido e te avisar por fora (WhatsApp/e-mail) quando sua conta estiver pronta —
          já com a senha que você acabou de criar.
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm p-6">
      {SITE_KEY && <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />}

      <h1 className="text-lg font-bold text-g4-ink">Pedir acesso</h1>
      <p className="mt-1 text-sm text-g4-muted">
        Preencha seus dados — o treinador revisa e libera seu login.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-g4-surface-alt p-1">
        <button
          type="button"
          onClick={() => setRole("athlete")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-ring",
            role === "athlete" ? "bg-lime text-g4-ink" : "text-g4-muted hover:text-g4-ink"
          )}
        >
          Sou aluno
        </button>
        <button
          type="button"
          onClick={() => setRole("coach")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-ring",
            role === "coach" ? "bg-lime text-g4-ink" : "text-g4-muted hover:text-g4-ink"
          )}
        >
          Sou treinador
        </button>
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="role_requested" value={role} />

        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">Nome completo</span>
          <input
            name="full_name"
            required
            className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
          />
        </label>

        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">E-mail</span>
          <input
            type="email"
            name="email"
            required
            className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
          />
        </label>

        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">Senha</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            placeholder="mín. 8 caracteres"
            className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
          />
        </label>

        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">WhatsApp (opcional)</span>
          <input
            name="phone"
            className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
          />
        </label>

        {role === "athlete" && (
          <>
            <label className="flex flex-col gap-4 text-sm">
              <span className="font-medium text-g4-ink">Data de nascimento</span>
              <input
                type="date"
                name="birth_date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
              />
              {estimatedHrMax && (
                <span className="text-xs text-g4-muted">
                  FC máxima estimada: <span className="font-medium text-g4-ink">{estimatedHrMax} bpm</span> (o
                  treinador pode ajustar depois com um valor medido)
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-4 text-sm">
                <span className="font-medium text-g4-ink">Peso (kg)</span>
                <input
                  type="number"
                  name="weight_kg"
                  min={0}
                  step={0.1}
                  className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
                />
              </label>
              <label className="flex flex-col gap-4 text-sm">
                <span className="font-medium text-g4-ink">Altura (cm)</span>
                <input
                  type="number"
                  name="height_cm"
                  min={0}
                  className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <span className="font-medium text-g4-ink">Anamnese — doenças ou dores crônicas</span>
              <input type="hidden" name="medical_notes" value={medicalNotes} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-g4-border bg-white p-3">
                {MEDICAL_CONDITIONS.map((option) => (
                  <label key={option} className="flex items-center gap-4 text-sm text-g4-ink">
                    <input
                      type="checkbox"
                      checked={conditions.includes(option)}
                      onChange={() => toggleCondition(option)}
                    />
                    {option}
                  </label>
                ))}
                <label className="flex items-center gap-4 text-sm text-g4-ink">
                  <input
                    type="checkbox"
                    checked={conditions.includes(OTHER_OPTION)}
                    onChange={() => toggleCondition(OTHER_OPTION)}
                  />
                  {OTHER_OPTION}
                </label>
                <label className="col-span-2 flex items-center gap-4 border-t border-g4-border pt-3 text-sm text-g4-ink">
                  <input
                    type="checkbox"
                    checked={conditions.includes(NONE_OPTION)}
                    onChange={() => toggleCondition(NONE_OPTION)}
                  />
                  {NONE_OPTION}
                </label>
              </div>
              {conditions.includes(OTHER_OPTION) && (
                <input
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Qual?"
                  className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
                />
              )}
            </div>
          </>
        )}

        <label className="flex flex-col gap-4 text-sm">
          <span className="font-medium text-g4-ink">Mensagem (opcional)</span>
          <textarea
            name="message"
            rows={3}
            className="rounded-xl border border-g4-border bg-white px-3 py-2.5 text-sm text-g4-ink focus-ring"
          />
        </label>

        {SITE_KEY && <div className="g-recaptcha" data-sitekey={SITE_KEY} />}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={pending}>
          {pending ? "Enviando..." : "Enviar pedido"}
        </Button>
      </form>
    </Card>
  );
}
