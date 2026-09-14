import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { compareToPlanned, type PlanComparison } from "@/lib/workout-metrics";

export interface ZoneDatum {
  zone: string;
  label: string;
  plannedMinutes: number;
  completedMinutes: number;
}

interface ZonesChartProps {
  title: string;
  data: ZoneDatum[];
}

// "Completed" bar color based on comparison with the planned value: blue
// within tolerance, red outside expectations. The "Planned" bar is
// always neutral — it's the reference, not the result.
const COMPARISON_BAR_CLASS: Record<PlanComparison, string> = {
  match: "bg-blue-500",
  off: "bg-red-500",
  none: "bg-g4-border",
};

/**
 * Time in zone, planned vs. completed. The "Completed" bar is colored by
 * how correct it is relative to the plan (blue = within expectations,
 * red = outside), no longer by a fixed decorative tone.
 */
export function ZonesChart({ title, data }: ZonesChartProps) {
  const maxMinutes = Math.max(1, ...data.flatMap((d) => [d.plannedMinutes, d.completedMinutes]));

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex flex-wrap items-center gap-4 text-xs text-g4-muted">
          <span className="inline-flex items-center gap-4">
            <span className="h-2 w-2 rounded-full bg-g4-border" aria-hidden />
            Planejado
          </span>
          <span className="inline-flex items-center gap-4">
            <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden />
            Dentro do planejado
          </span>
          <span className="inline-flex items-center gap-4">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
            Fora do planejado
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {data.map((zone) => {
          const comparison = compareToPlanned(zone.plannedMinutes, zone.completedMinutes);

          return (
            <div key={zone.zone} className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-center">
              <div className="min-[420px]:w-24 min-[420px]:shrink-0">
                <p className="text-sm font-medium text-g4-ink">{zone.zone}</p>
                <p className="text-xs text-g4-muted">{zone.label}</p>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-3.5 flex-1 rounded-sm bg-g4-surface-alt">
                    <div
                      className="h-3.5 rounded-r-[4px] bg-g4-border"
                      style={{ width: `${(zone.plannedMinutes / maxMinutes) * 100}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-xs tabular-nums text-g4-muted">
                    {zone.plannedMinutes}min
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-3.5 flex-1 rounded-sm bg-g4-surface-alt">
                    <div
                      className={cn("h-3.5 rounded-r-[4px]", COMPARISON_BAR_CLASS[comparison])}
                      style={{ width: `${(zone.completedMinutes / maxMinutes) * 100}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-xs tabular-nums text-g4-ink">
                    {zone.completedMinutes}min
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
