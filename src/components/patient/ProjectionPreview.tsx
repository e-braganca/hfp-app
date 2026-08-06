"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { CHART, ChartFrame, ChartLegend, ChartTooltip, axisProps, referencePill, valueDots } from "@/components/ui/chart";
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

  const fmt = (n: number) => n.toFixed(1);
  const bmiOf = (kg: number) => kg / (heightCm / 100) ** 2;

  // one row every two weeks; `band` is the range between the two treatments,
  // which is the honest shape of this estimate before a prescriber picks one
  const data = Array.from({ length: Math.floor(horizon / 2) + 1 }, (_, i) => {
    const week = i * 2;
    return {
      week,
      best: best.at(week),
      gentle: gentle.at(week),
      band: [best.at(week), gentle.at(week)] as [number, number],
    };
  });

  const min = Math.floor(best.targetKg - 2);
  const max = Math.ceil(startKg + 1);

  return (
    <div className="mt-6 rounded-xl border border-[var(--divider)] bg-background-paper p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-extrabold text-text-primary">What treatment could look like for you</h3>
        <span className="font-mono text-[10px] tracking-wide text-text-secondary">TRIAL AVERAGES · SURMOUNT-1 · STEP-1</span>
      </div>

      <ChartFrame height={200}>
        <ComposedChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="week"
            {...axisProps}
            ticks={[0, 26, 52, horizon]}
            tickFormatter={(w: number) => (w === 0 ? "today" : `wk ${w}`)}
          />
          <YAxis {...axisProps} domain={[min, max]} width={40} />

          <ReferenceLine
            y={startKg}
            stroke={CHART.grid}
            strokeDasharray="3 4"
            label={referencePill({
              text: `today ${fmt(startKg)} kg`,
              side: "left",
              dy: 14,
              colour: "var(--color-text-secondary)",
            })}
          />
          <ReferenceLine
            x={26}
            stroke={CHART.grid}
            strokeDasharray="2 5"
            label={{ value: "6 MONTHS", position: "top", fill: "var(--color-text-disabled)", fontSize: 9, fontFamily: "var(--font-mono)" }}
          />
          {/* the line's own value is called out at its end point, so it isn't
              labelled twice */}
          <ReferenceLine y={best.targetKg} stroke={CHART.target} strokeDasharray="5 4" strokeWidth={1.2} />

          {/* the spread between the two licensed options */}
          <Area
            type="monotone"
            dataKey="band"
            stroke="none"
            fill={CHART.fill}
            isAnimationActive={false}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="best"
            stroke={CHART.line}
            strokeWidth={2.2}
            strokeDasharray="5 4"
            dot={valueDots({ at: data.length - 1, text: `${fmt(best.targetKg)} kg`, colour: CHART.line, anchor: "end", dy: -16 })}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="gentle"
            stroke={CHART.lineSoft}
            strokeWidth={2.2}
            strokeDasharray="5 4"
            dot={valueDots({ at: data.length - 1, text: `${fmt(gentle.targetKg)} kg`, colour: CHART.lineSoft, anchor: "end", dy: -16 })}
            isAnimationActive={false}
          />

          <ChartTooltip
            format={(d) => ({
              title: (d.week as number) === 0 ? "Today" : `Week ${d.week}`,
              rows: [
                { label: meds[0], value: `${fmt(d.best as number)} kg`, colour: CHART.line },
                { label: meds[1], value: `${fmt(d.gentle as number)} kg`, colour: CHART.lineSoft },
              ],
            })}
          />
        </ComposedChart>
      </ChartFrame>

      <ChartLegend
        items={meds.map((m, i) => ({ label: m, colour: i === 0 ? CHART.line : CHART.lineSoft, dashed: true }))}
      />

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
