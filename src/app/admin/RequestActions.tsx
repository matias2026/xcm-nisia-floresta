"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { approveRequest, denyRequest } from "./actions";

export function RequestActions({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  if (approved) {
    return password ? (
      <div className="rounded-lg bg-g4-surface-alt p-2 text-xs">
        <p className="font-medium text-g4-ink">Conta criada. Senha provisória:</p>
        <p className="mt-1 select-all font-mono text-sm text-g4-ink">{password}</p>
        <p className="mt-1 text-g4-muted">
          Pedido antigo, sem senha própria — copie e repasse agora, não aparece de novo.
        </p>
      </div>
    ) : (
      <p className="text-xs text-g4-muted">Conta criada — já pode entrar com a senha que definiu no pedido.</p>
    );
  }

  if (denied) {
    return <p className="text-xs text-g4-muted">Pedido negado.</p>;
  }

  return (
    <div className="flex flex-col items-end gap-4">
      <div className="flex gap-4">
        <Button
          type="button"
          variant="primary"
          className="px-3 py-1 text-xs"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await approveRequest(requestId);
              if (result.error) {
                setError(result.error);
                return;
              }
              setPassword(result.password);
              setApproved(true);
            });
          }}
        >
          {isPending ? "..." : "Aprovar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="px-3 py-1 text-xs"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await denyRequest(requestId);
              if (result.error) {
                setError(result.error);
                return;
              }
              setDenied(true);
            });
          }}
        >
          Negar
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
