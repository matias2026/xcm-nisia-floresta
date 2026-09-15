"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RequestAccessForm } from "@/app/solicitar-acesso/RequestAccessForm";
import { LoginForm } from "./LoginForm";

type Tab = "login" | "signup";

/**
 * Tela principal (login): alterna entre "Entrar" e "Criar conta" sem sair
 * da página — antes "criar conta" só existia direto no /admin (o
 * treinador criava a conta por fora); agora é o próprio /solicitar-acesso
 * (pedido revisado pelo treinador), só que acessível aqui como aba.
 */
export function AccountAccessTabs({ next }: { next: string }) {
  const [tab, setTab] = useState<Tab>("login");

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 rounded-xl bg-g4-surface-alt p-1">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-ring",
            tab === "login" ? "bg-lime text-g4-ink" : "text-g4-muted hover:text-g4-ink"
          )}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-ring",
            tab === "signup" ? "bg-lime text-g4-ink" : "text-g4-muted hover:text-g4-ink"
          )}
        >
          Criar conta
        </button>
      </div>

      {tab === "login" ? <LoginForm next={next} /> : <RequestAccessForm />}
    </div>
  );
}
