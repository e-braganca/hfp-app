"use client";

import { useState, useSyncExternalStore } from "react";
import { LogWeightModal } from "@/components/patient/LogWeightModal";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART,
  ChartFrame,
  ChartLegend,
  ChartTooltip,
  axisProps,
  referencePill,
  valueDots,
} from "@/components/ui/chart";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Toast } from "@/components/ui/Toast";
import { bmiFor, HEIGHT_CM, TREATMENT, type WeightEntry } from "@/lib/patient/data";
import {
  allWeights,
  getLogServerSnapshot,
  getLogSnapshot,
  logWeight,
  subscribeLog,
} from "@/lib/patient/log-store";
import { buildProjection, type Projection } from "@/lib/patient/projection";
import { trim1 } from "@/lib/onboarding/units";

/* ============================================================================
   Weight tracking (FC-16) — full log: chart with axis labels, weekly deltas,
   and the "log this week" modal. Weight is entered in the patient's preferred
   unit (kg / st·lb / lb) but stored in kg, same rule as onboarding.
   ============================================================================ */

export default function WeightTrackingPage() {
  const log = useSyncExternalStore(subscribeLog, getLogSnapshot, getLogServerSnapshot);
  const entries = allWeights(log);
  const [logging, setLogging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const start = entries[0].kg;
  const current = entries[entries.length - 1].kg;
  const change = current - start;
  const pct = (change / start) * 100;
  const weeklyAvg = change / (entries.length - 1);
  const projection = buildProjection({
    startKg: start,
    currentKg: current,
    heightCm: HEIGHT_CM,
    med: TREATMENT.shortName,
    startDate: entries[0].date,
    weeksElapsed: entries.length - 1,
  });

  const addEntry = (kg: number, note: string) => {
    logWeight({
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      kg,
      note: note.trim() || undefined,
    });
    setLogging(false);
    setToast(`Weight logged — ${trim1(kg)} kg. Your prescriber sees this at your next review.`);
  };

  return (
    <div>
      <PageHeader title="Weight tracking" subtitle="Weekly check-ins — reviewed by your prescriber before every repeat" />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value={`${current.toFixed(1)} kg`} label={`Current weight · BMI ${bmiFor(current).toFixed(1)}`} />
          <StatTile value={`${change <= 0 ? "–" : "+"}${Math.abs(change).toFixed(1)} kg`} label={`Total change · ${pct.toFixed(1)}%`} tone={change <= 0 ? "success" : "warning"} />
          <StatTile
            value={`${projection.targetKg.toFixed(1)} kg`}
            label={`Target · BMI ${projection.targetBmi.toFixed(1)}`}
            tone="success"
          />
          <StatTile value={`${Math.abs(weeklyAvg).toFixed(2)} kg`} label="Avg per week" tone="muted" />
        </div>

        <ProjectionPanel projection={projection} current={current} />

        {/* chart */}
        <section className="rounded-lg bg-background-paper p-6 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-base font-bold text-text-primary">Your progress</h2>
            <button
              type="button"
              onClick={() => setLogging(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              Log this week&rsquo;s weight
            </button>
          </div>
          <WeightChart entries={entries} projection={projection} />
        </section>

        {/* log */}
        <section className="rounded-lg bg-background-paper p-6 shadow-card">
          <h2 className="text-base font-bold text-text-primary">Check-in history</h2>
          <div className="mt-3 divide-y divide-[var(--divider)]">
            {[...entries].reverse().map((e, i, arr) => {
              const prev = arr[i + 1];
              const delta = prev ? e.kg - prev.kg : null;
              return (
                <div key={`${e.date}-${e.kg}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                  <span className="w-28 shrink-0 font-mono text-xs text-text-secondary">{e.date}</span>
                  <span className="w-20 shrink-0 font-mono text-base font-extrabold text-text-primary">
                    {e.kg.toFixed(1)}
                  </span>
                  {delta !== null ? (
                    <span
                      className={`w-24 shrink-0 rounded-full px-2 py-0.5 text-center font-mono text-[11px] font-extrabold ${
                        delta < 0
                          ? "bg-success-lighter text-success-dark"
                          : delta === 0
                            ? "bg-background-neutral text-text-secondary"
                            : "bg-warning-lighter text-warning-dark"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(1)} kg
                    </span>
                  ) : (
                    <span className="w-24 shrink-0 text-center font-mono text-[11px] font-bold text-text-disabled">start</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-text-secondary">{e.note}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 rounded-lg bg-warning-lighter px-4 py-3 text-xs leading-relaxed text-warning-darker">
            A loss of more than 10% or a gain of more than 7% between orders triggers extra confirmation questions at
            your next repeat — that&rsquo;s your pharmacy&rsquo;s safety protocol, not a punishment.
          </p>
        </section>
      </div>

      <LogWeightModal open={logging} lastKg={current} onClose={() => setLogging(false)} onSave={addEntry} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

/* ---- chart with axes ------------------------------------------------------ */

/** Logged weights + the trial projection out to the target, with the 5% and
 *  10% milestones marked — 5% is the SOP continuation gate at 6 months. */

/**
 * Progress against the trial-average projection. Recharts handles the scale,
 * the hover and the resize; the styling is the app's own tokens, so this chart
 * reads as part of the platform rather than a widget dropped into it.
 */
const RANGES = [
  { key: "near", label: "Next 3 months", weeks: 12 },
  { key: "mid", label: "6 months", weeks: 26 },
  { key: "full", label: "Full plan", weeks: 0 },
] as const;

function WeightChart({ entries, projection }: { entries: WeightEntry[]; projection: Projection }) {
  // Default to the near window: over the full 72-week horizon eight weeks of
  // real check-ins collapse into a smudge, and the patient's own line is the
  // one thing this chart exists to show.
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("near");
  const logged = entries.length - 1;
  const picked = RANGES.find((r) => r.key === range)!;
  const horizon =
    picked.weeks === 0 ? projection.horizonWeeks : Math.min(projection.horizonWeeks, logged + picked.weeks);

  // one row per week: the logged line stops where the check-ins do, the
  // projection carries on to the end of the window
  const data = Array.from({ length: horizon + 1 }, (_, week) => ({
    week,
    date: entries[week]?.date,
    actual: week <= logged ? entries[week].kg : null,
    // drawn only from the last check-in onwards, so it never sits on top of
    // the patient's own line and hide it
    projected: week >= logged ? projection.at(week) : null,
  }));

  // scale to what's in the window, not to a target 18 months out
  const shown = [...entries.slice(0, horizon + 1).map((e) => e.kg), projection.at(horizon)];
  const min = Math.floor(Math.min(...shown) - 1);
  const max = Math.ceil(Math.max(...shown) + 1);
  const targetInView = projection.targetKg >= min && projection.targetKg <= max;
  const step = horizon <= 14 ? 2 : horizon <= 30 ? 4 : 8;

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              range === r.key
                ? "bg-primary text-white"
                : "bg-background-neutral text-text-secondary hover:text-text-primary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ChartFrame height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.line} stopOpacity={0.18} />
              <stop offset="100%" stopColor={CHART.line} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="week"
            {...axisProps}
            ticks={Array.from({ length: Math.floor(horizon / step) + 1 }, (_, i) => i * step)}
            tickFormatter={(w: number) => (w === 0 ? "start" : `wk ${w}`)}
          />
          <YAxis {...axisProps} domain={[min, max]} width={44} tickFormatter={(v: number) => `${v}`} />

          {targetInView ? (
            <ReferenceLine
              y={projection.targetKg}
              stroke={CHART.target}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={referencePill({ text: `target ${projection.targetKg.toFixed(1)} kg`, dy: -13 })}
            />
          ) : (
            // out of this window — say so on the floor of the plot rather than
            // rescaling to a target 18 months out and flattening the real line
            <ReferenceLine
              y={min}
              stroke="none"
              label={referencePill({ text: `target ${projection.targetKg.toFixed(1)} kg ↓`, dy: -14 })}
            />
          )}

          <Area
            type="monotone"
            dataKey="projected"
            stroke={CHART.lineSoft}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            fill="none"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke={CHART.line}
            strokeWidth={2.5}
            fill="url(#weightFill)"
            dot={valueDots({
              at: logged,
              text: `${entries[logged].kg.toFixed(1)} kg`,
              colour: CHART.line,
              r: 3,
              dy: -20,
            })}
            activeDot={{ r: 5, fill: CHART.line, stroke: "var(--color-background-paper)", strokeWidth: 2 }}
            connectNulls={false}
            // the page re-renders on every store tick; Recharts would restart
            // its reveal animation each time and never finish drawing the line
            isAnimationActive={false}
          />

          <ChartTooltip
            format={(d) => {
              const week = d.week as number;
              const actual = d.actual as number | null;
              const projected = d.projected as number;
              return {
                title: (d.date as string) ?? `Week ${week}`,
                rows: [
                  ...(actual !== null
                    ? [{ label: "Your weight", value: `${actual.toFixed(1)} kg`, colour: CHART.line }]
                    : []),
                  { label: "Trial average", value: `${projected.toFixed(1)} kg`, colour: CHART.lineSoft },
                ],
              };
            }}
          />
        </AreaChart>
      </ChartFrame>

      <ChartLegend
        items={[
          { label: "Your check-ins", colour: CHART.line },
          { label: "Projected on trial average", colour: CHART.lineSoft, dashed: true },
          {
            label: targetInView
              ? `Target ${projection.targetKg.toFixed(1)} kg`
              : `Target ${projection.targetKg.toFixed(1)} kg — beyond this window`,
            colour: CHART.target,
            dashed: true,
          },
        ]}
      />
    </>
  );
}

/** Target, projected dates and pace-vs-trial, with the honesty caveat. */
function ProjectionPanel({ projection, current }: { projection: Projection; current: number }) {
  const ahead = projection.paceKg >= 0;
  return (
    <section className="rounded-lg bg-background-paper p-6 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-text-primary">Where this is heading</h2>
        <span className="font-mono text-[11px] tracking-wide text-text-secondary">{projection.source}</span>
      </div>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
        On the trial average for your treatment you&rsquo;d reach{" "}
        <span className="font-bold text-text-primary">{projection.targetKg.toFixed(1)} kg</span> (BMI{" "}
        <span className="font-bold text-text-primary">{projection.targetBmi.toFixed(1)}</span>) around{" "}
        <span className="font-bold text-text-primary">{projection.targetDate}</span> — a{" "}
        {(projection.totalPct * 100).toFixed(1)}% reduction from your start weight.
      </p>

      <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--divider)] sm:grid-cols-3">
        {projection.milestones.map((m) => (
          <div key={m.label} className="bg-background-paper p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              {m.reached && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
              {m.label}
            </p>
            <p className="mt-1 font-mono text-lg font-extrabold text-text-primary">{m.kg.toFixed(1)} kg</p>
            <p className="text-xs text-text-secondary">
              {m.reached ? "reached" : m.date ? `projected ${m.date}` : "beyond trial average"}
            </p>
          </div>
        ))}
      </div>

      <p
        className={`mt-4 rounded-lg px-4 py-3 text-sm ${
          ahead ? "bg-success-lighter text-success-darker" : "bg-warning-lighter text-warning-darker"
        }`}
      >
        <span className="font-bold">
          {ahead ? "Ahead of the trial pace" : "Behind the trial pace"} by {Math.abs(projection.paceKg).toFixed(1)} kg.
        </span>{" "}
        You&rsquo;re at {current.toFixed(1)} kg — the trial curve puts this week at{" "}
        {(current + projection.paceKg).toFixed(1)} kg.
      </p>

      <p className="mt-3 text-xs leading-relaxed text-text-secondary">
        This is an estimate from manufacturer trial averages at the highest dose, alongside diet and exercise — not a
        prediction for you and not a guarantee. Individual results vary widely, and your prescriber reviews your actual
        progress at every repeat.
      </p>
    </section>
  );
}
