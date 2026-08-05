"use client";

import { useState, useSyncExternalStore } from "react";
import { LogWeightModal } from "@/components/patient/LogWeightModal";
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
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded-full bg-primary" /> Your check-ins
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded-full bg-primary-light" style={{ backgroundImage: "repeating-linear-gradient(90deg,var(--primary-light) 0 4px,transparent 4px 8px)" }} />
              Projected on trial average
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded-full" style={{ backgroundImage: "repeating-linear-gradient(90deg,var(--color-secondary) 0 5px,transparent 5px 9px)" }} />
              Target {projection.targetKg.toFixed(1)} kg
            </span>
          </div>
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
function WeightChart({ entries, projection }: { entries: WeightEntry[]; projection: Projection }) {
  const w = 760;
  const h = 240;
  const padX = 44;
  const padY = 26;
  const rightPad = 20;
  const values = entries.map((e) => e.kg);
  const loggedWeeks = values.length - 1;
  const totalWeeks = projection.horizonWeeks;

  const min = Math.floor(projection.targetKg - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const x = (week: number) => padX + (week / totalWeeks) * (w - padX - rightPad);
  const y = (v: number) => padY + ((max - v) * (h - padY * 2)) / (max - min || 1);

  const logged = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const future: string[] = [];
  for (let week = loggedWeeks; week <= totalWeeks; week += 1) future.push(`${x(week)},${y(projection.at(week))}`);

  const gridLines = [max, Math.round((max + min) / 2), min];
  // x labels every ~12 weeks so the axis stays readable across 68–72 weeks
  const tickWeeks = [0, 12, 24, 36, 48, 60, totalWeeks].filter((t) => t <= totalWeeks);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h + 24}`} className="mt-4 w-full min-w-[620px]" role="img" aria-label={`Weight chart with projection to a ${projection.targetKg.toFixed(1)} kg target`}>
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={padX} x2={w - rightPad} y1={y(g)} y2={y(g)} stroke="var(--divider)" strokeDasharray="3 4" />
            <text x={padX - 8} y={y(g) + 4} textAnchor="end" className="fill-[var(--color-text-disabled)] font-mono text-[11px]">
              {g}
            </text>
          </g>
        ))}

        {/* target band + line */}
        <line x1={padX} x2={w - rightPad} y1={y(projection.targetKg)} y2={y(projection.targetKg)} stroke="var(--color-secondary)" strokeWidth="1.8" strokeDasharray="6 4" />
        <text x={padX + 4} y={y(projection.targetKg) - 6} className="fill-[var(--color-secondary-dark)] font-mono text-[11px] font-bold">
          TARGET {projection.targetKg.toFixed(1)} kg · BMI {projection.targetBmi.toFixed(1)}
        </text>

        {/* milestones */}
        {projection.milestones
          .filter((m) => m.weeks !== null && m.pct < projection.totalPct)
          .map((m) => (
            <g key={m.label}>
              <line x1={x(m.weeks!)} x2={x(m.weeks!)} y1={padY} y2={h - padY} stroke="var(--divider)" strokeDasharray="2 5" />
              <circle cx={x(m.weeks!)} cy={y(m.kg)} r="4" fill={m.reached ? "var(--color-success)" : "var(--color-grey-400)"} />
              <text x={x(m.weeks!)} y={padY - 8} textAnchor="middle" className="fill-[var(--color-text-disabled)] font-mono text-[10px] font-bold">
                {(m.pct * 100).toFixed(0)}%
              </text>
            </g>
          ))}

        {/* logged */}
        <polyline points={`${logged} ${x(loggedWeeks)},${y(min)} ${x(0)},${y(min)}`} fill="var(--primary-main-12)" stroke="none" />
        <polyline points={logged} fill="none" stroke="var(--primary-main)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* projection */}
        <polyline points={future.join(" ")} fill="none" stroke="var(--primary-light)" strokeWidth="2.2" strokeDasharray="5 5" strokeLinecap="round" />

        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 5 : 3} fill="var(--primary-main)" />
        ))}
        <text x={x(loggedWeeks)} y={y(values[loggedWeeks]) - 10} textAnchor="middle" className="fill-[var(--color-text-primary)] font-mono text-[12px] font-bold">
          {values[loggedWeeks].toFixed(1)}
        </text>

        {tickWeeks.map((t) => (
          <text key={t} x={x(t)} y={h + 14} textAnchor="middle" className="fill-[var(--color-text-disabled)] font-mono text-[10px]">
            {t === 0 ? "start" : `wk ${t}`}
          </text>
        ))}
      </svg>
    </div>
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

/* ---- log modal ------------------------------------------------------------ */
