import { Button } from "@/components/ui/Button";
import type { WorkoutInterval, WorkoutIntervalType } from "@/lib/supabase/types";

interface IntervalEditorProps {
  intervals: WorkoutInterval[];
  onChange: (intervals: WorkoutInterval[]) => void;
  /** FC máxima do aluno (medida ou estimada pela fórmula de Tanaka), usada
   * só para sugerir o campo "FC alvo" de cada bloco — o treinador decide
   * se usa, edita ou deixa em branco. */
  suggestedHrMaxBpm?: number | null;
}

export const TYPE_LABELS: Record<WorkoutIntervalType, string> = {
  warmup: "Aquecimento",
  steady: "Ritmo constante",
  interval: "Tiro",
  recovery: "Recuperação",
  cooldown: "Desaquecimento",
};

// Intensity zones by %FTP (Coggan standard) — the same ranges and names
// used in the zones chart (ZonesChart), so the number matches the label
// instead of showing up on its own.
export const ZONES = [
  { key: "Z1", label: "Recuperação", low: 0, high: 55 },
  { key: "Z2", label: "Resistência", low: 56, high: 75 },
  { key: "Z3", label: "Ritmo", low: 76, high: 90 },
  { key: "Z4", label: "Limiar", low: 91, high: 105 },
  { key: "Z5", label: "VO2max", low: 106, high: 150 },
] as const;

function zoneForPct(pct: number): (typeof ZONES)[number] {
  return ZONES.find((z) => pct <= z.high) ?? ZONES[ZONES.length - 1];
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-g4-border bg-white p-2 text-sm text-g4-ink focus-ring";
const miniLabelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-g4-muted lg:whitespace-nowrap";

const EMPTY_INTERVAL: WorkoutInterval = {
  type: "interval",
  durationSeconds: 5 * 60,
  targetLowPct: 90,
  targetHighPct: 90,
};

/**
 * Editor for the structured %FTP/zone blocks (warmup, intervals,
 * recovery, cooldown) — the same list that feeds the .ZWO export
 * (`src/lib/workout-export.ts`), so it only shows up for cycling. Each row
 * is an independent segment; duration here is always in minutes. The zone
 * (Z1–Z5) is derived from the block's max %FTP — picking a zone adjusts
 * the %FTP range automatically, and editing the %FTP directly updates the
 * displayed zone, so there are no two states to keep in sync.
 */
export function IntervalEditor({ intervals, onChange, suggestedHrMaxBpm }: IntervalEditorProps) {
  function updateRow(index: number, patch: Partial<WorkoutInterval>) {
    onChange(intervals.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(intervals.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...intervals, { ...EMPTY_INTERVAL }]);
  }

  return (
    <div className="mt-3">
      <div className="flex flex-col gap-4">
        {intervals.map((row, index) => {
          const zone = zoneForPct(row.targetHighPct);

          return (
            <div
              key={index}
              className="grid grid-cols-2 gap-4 rounded-2xl border border-g4-border bg-g4-surface-alt/60 p-4 shadow-sm lg:grid-cols-[1.1fr_0.85fr_1.15fr_0.85fr_0.85fr_0.95fr_auto] lg:items-end"
            >
              <label className="block">
                <span className={miniLabelClass}>Tipo</span>
                <select
                  value={row.type}
                  onChange={(e) => updateRow(index, { type: e.target.value as WorkoutIntervalType })}
                  className={fieldClass}
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={miniLabelClass}>Duração (min)</span>
                <input
                  type="number"
                  min={0}
                  value={Math.round(row.durationSeconds / 60)}
                  onChange={(e) =>
                    updateRow(index, { durationSeconds: Math.max(0, Number(e.target.value)) * 60 })
                  }
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className={miniLabelClass}>Zona</span>
                <select
                  value={zone.key}
                  onChange={(e) => {
                    const next = ZONES.find((z) => z.key === e.target.value) ?? ZONES[0];
                    updateRow(index, { targetLowPct: next.low, targetHighPct: next.high });
                  }}
                  className={fieldClass}
                >
                  {ZONES.map((z) => (
                    <option key={z.key} value={z.key}>
                      {z.key} · {z.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={miniLabelClass}>% FTP mín.</span>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={row.targetLowPct}
                  onChange={(e) => updateRow(index, { targetLowPct: Number(e.target.value) })}
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className={miniLabelClass}>% FTP máx.</span>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={row.targetHighPct}
                  onChange={(e) => updateRow(index, { targetHighPct: Number(e.target.value) })}
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className={miniLabelClass}>FC alvo (bpm)</span>
                <input
                  type="number"
                  min={0}
                  value={row.targetHrBpm ?? ""}
                  onChange={(e) =>
                    updateRow(index, { targetHrBpm: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  placeholder={suggestedHrMaxBpm ? String(suggestedHrMaxBpm) : "opcional"}
                  className={fieldClass}
                />
                {suggestedHrMaxBpm != null && row.targetHrBpm == null && (
                  <button
                    type="button"
                    onClick={() => updateRow(index, { targetHrBpm: suggestedHrMaxBpm })}
                    className="mt-1 text-[11px] text-lime-deep underline-offset-2 hover:underline"
                  >
                    usar estimativa ({suggestedHrMaxBpm})
                  </button>
                )}
              </label>

              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label="Remover bloco"
                className="col-span-2 rounded-lg border border-status-missed/30 px-2 py-2 text-xs font-medium text-status-missed hover:bg-status-missed/10 lg:col-span-1 lg:border-0 lg:justify-self-center"
              >
                Remover
              </button>
            </div>
          );
        })}
      </div>

      <Button variant="secondary" className="mt-3 px-4 text-sm" onClick={addRow}>
        + Adicionar bloco
      </Button>

      {intervals.length === 0 && (
        <p className="mt-2 text-xs text-g4-muted">
          Nenhum bloco cadastrado — adicione ao menos um para liberar a exportação .ZWO.
        </p>
      )}
    </div>
  );
}
