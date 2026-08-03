import { buildProjection, TRIAL_OUTCOMES } from "@/lib/patient/projection";

/* ============================================================================
   Projection preview for the eligibility interstitial. The patient hasn't
   chosen a treatment yet at that point, so this shows the RANGE across the
   two UK-licensed weight-management GLP-1s rather than inventing a single
   number — the prescriber confirms which one, and the range narrows.
   Same caveat as everywhere: trial averages, not a prediction or promise.
   ============================================================================ */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const todayLabel = () => {
  const d = new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export function ProjectionPreview({ startKg, heightCm }: { startKg: number; heightCm: number }) {
  const start = todayLabel();
  const meds = Object.keys(TRIAL_OUTCOMES); // ["Mounjaro", "Wegovy"]
  const projections = meds.map((med) =>
    buildProjection({ startKg, currentKg: startKg, heightCm, med, startDate: start, weeksElapsed: 0 }),
  );
  // best = biggest loss, gentle = smallest; the honest range between them
  const sorted = [...projections].sort((a, b) => a.targetKg - b.targetKg);
  const best = sorted[0];
  const gentle = sorted[sorted.length - 1];
  const horizon = Math.max(...projections.map((p) => p.horizonWeeks));
  const SIX_MONTHS = 26;

  const w = 560;
  const h = 170;
  const padX = 34;
  const padY = 18;
  const rightPad = 62;
  const min = best.targetKg - 2;
  const max = startKg + 1;
  const x = (week: number) => padX + (week / horizon) * (w - padX - rightPad);
  const y = (v: number) => padY + ((max - v) / (max - min || 1)) * (h - padY * 2);

  const curve = (p: (typeof projections)[number]) => {
    const pts: string[] = [];
    for (let week = 0; week <= p.horizonWeeks; week += 2) pts.push(`${x(week)},${y(p.at(week))}`);
    return pts.join(" ");
  };

  const fmt = (n: number) => n.toFixed(1);
  const bmiOf = (kg: number) => kg / (heightCm / 100) ** 2;

  return (
    <div className="mt-6 rounded-xl border border-[var(--divider)] bg-background-paper p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-extrabold text-text-primary">What treatment could look like for you</h3>
        <span className="font-mono text-[10px] tracking-wide text-text-secondary">TRIAL AVERAGES · SURMOUNT-1 · STEP-1</span>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" role="img" aria-label={`Projected weight from ${fmt(startKg)} kg to between ${fmt(best.targetKg)} and ${fmt(gentle.targetKg)} kg`}>
        {/* start / target guide lines */}
        <line x1={padX} x2={w - rightPad} y1={y(startKg)} y2={y(startKg)} stroke="var(--divider)" strokeDasharray="3 4" />
        <text x={padX - 6} y={y(startKg) + 4} textAnchor="end" className="fill-[var(--color-text-disabled)] font-mono text-[10px]">
          {Math.round(startKg)}
        </text>
        <line x1={padX} x2={w - rightPad} y1={y(best.targetKg)} y2={y(best.targetKg)} stroke="var(--color-secondary)" strokeWidth="1.2" strokeDasharray="5 4" />
        <text x={padX - 6} y={y(best.targetKg) + 4} textAnchor="end" className="fill-[var(--color-secondary-dark)] font-mono text-[10px] font-bold">
          {Math.round(best.targetKg)}
        </text>

        {/* 6-month marker */}
        <line x1={x(SIX_MONTHS)} x2={x(SIX_MONTHS)} y1={padY} y2={h - padY} stroke="var(--divider)" strokeDasharray="2 5" />
        <text x={x(SIX_MONTHS)} y={padY - 5} textAnchor="middle" className="fill-[var(--color-text-disabled)] font-mono text-[9px] font-bold">
          6 MONTHS
        </text>

        {/* the range between the two treatments */}
        <polygon
          points={`${curve(best)} ${[...Array(Math.floor(gentle.horizonWeeks / 2) + 1)]
            .map((_, i) => gentle.horizonWeeks - i * 2)
            .map((week) => `${x(week)},${y(gentle.at(week))}`)
            .join(" ")}`}
          fill="var(--primary-main-12)"
        />
        {projections.map((p, i) => (
          <polyline
            key={meds[i]}
            points={curve(p)}
            fill="none"
            stroke={p === best ? "var(--primary-main)" : "var(--primary-light)"}
            strokeWidth="2.2"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        ))}
        {projections.map((p, i) => (
          <text
            key={meds[i]}
            x={x(p.horizonWeeks) + 6}
            y={y(p.at(p.horizonWeeks)) + 4}
            className={`font-mono text-[10px] font-bold ${p === best ? "fill-[var(--primary-main)]" : "fill-[var(--primary-light)]"}`}
          >
            {meds[i]}
          </text>
        ))}
        <circle cx={x(0)} cy={y(startKg)} r="4" fill="var(--color-text-primary)" />
      </svg>

      <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-[var(--divider)] bg-[var(--divider)] sm:grid-cols-2">
        <div className="bg-background-paper p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">In 6 months</p>
          <p className="mt-0.5 font-mono text-base font-extrabold text-text-primary">
            {fmt(best.at(SIX_MONTHS))}–{fmt(gentle.at(SIX_MONTHS))} kg
          </p>
          <p className="text-[11px] text-text-secondary">
            about {fmt(startKg - gentle.at(SIX_MONTHS))}–{fmt(startKg - best.at(SIX_MONTHS))} kg down
          </p>
        </div>
        <div className="bg-background-paper p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Trial average · {best.targetDate}</p>
          <p className="mt-0.5 font-mono text-base font-extrabold text-secondary-dark">
            {fmt(best.targetKg)}–{fmt(gentle.targetKg)} kg
          </p>
          <p className="text-[11px] text-text-secondary">
            BMI {bmiOf(best.targetKg).toFixed(1)}–{bmiOf(gentle.targetKg).toFixed(1)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-text-secondary">
        Range across the two licensed treatments at their highest dose, alongside diet and exercise — your prescriber
        confirms which one suits you. These are trial averages, not a prediction for you and not a guarantee;
        individual results vary widely.
      </p>
    </div>
  );
}
