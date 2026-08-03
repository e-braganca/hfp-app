import type { Projection } from "@/lib/patient/projection";

/**
 * Dashboard weight sparkline: logged weights (solid) continued by the trial
 * projection (dashed). Deliberately a near-term window — plotting the whole
 * 72-week horizon squeezes the patient's actual check-ins into a few pixels.
 * The target line only renders once it's inside the visible range; until then
 * the figure lives in the Started / Today / Target row under the chart, and
 * the full horizon is on /patient/weight.
 */
export function WeightSparkline({ values, projection }: { values: number[]; projection: Projection }) {
  const w = 560;
  const h = 130;
  const pad = 10;
  const rightPad = 44;

  const loggedWeeks = values.length - 1;
  const horizon = Math.min(projection.horizonWeeks, loggedWeeks + 14);

  const projected: number[] = [];
  for (let week = loggedWeeks; week <= horizon; week += 1) projected.push(projection.at(week));

  const inView = [...values, ...projected];
  const min = Math.min(...inView) - 0.8;
  const max = Math.max(...inView) + 0.8;
  const targetVisible = projection.targetKg >= min;

  const x = (week: number) => pad + (week / horizon) * (w - pad - rightPad);
  const y = (v: number) => pad + ((max - v) / (max - min || 1)) * (h - pad * 2);

  const logged = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const future = projected.map((v, i) => `${x(loggedWeeks + i)},${y(v)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 w-full"
      role="img"
      aria-label={`Weight ${values[0]} to ${values[values.length - 1]} kg, projected toward a ${projection.targetKg.toFixed(1)} kg target`}
    >
      {targetVisible && (
        <>
          <line x1={pad} x2={w - rightPad} y1={y(projection.targetKg)} y2={y(projection.targetKg)} stroke="var(--color-secondary)" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={w - rightPad + 6} y={y(projection.targetKg) + 4} className="fill-[var(--color-secondary-dark)] font-mono text-[11px] font-bold">
            {projection.targetKg.toFixed(1)}
          </text>
        </>
      )}

      {/* logged */}
      <polyline points={`${logged} ${x(loggedWeeks)},${h - pad} ${x(0)},${h - pad}`} fill="var(--primary-main-12)" stroke="none" />
      <polyline points={logged} fill="none" stroke="var(--primary-main)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* projected continuation */}
      <polyline points={future} fill="none" stroke="var(--primary-light)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
      <circle cx={x(loggedWeeks)} cy={y(values[values.length - 1])} r="4" fill="var(--primary-main)" />
      <text x={x(horizon)} y={y(projected[projected.length - 1]) - 8} textAnchor="end" className="fill-[var(--color-text-disabled)] font-mono text-[10px]">
        wk {horizon}
      </text>
    </svg>
  );
}
