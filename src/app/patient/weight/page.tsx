"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Toast } from "@/components/ui/Toast";
import { bmiFor, WEIGHT_LOG, type WeightEntry } from "@/lib/patient/data";
import { kgToStLb, numOf, stLbToKg, trim1, WEIGHT_UNITS, type WeightUnit } from "@/lib/onboarding/units";

/* ============================================================================
   Weight tracking (FC-16) — full log: chart with axis labels, weekly deltas,
   and the "log this week" modal. Weight is entered in the patient's preferred
   unit (kg / st·lb / lb) but stored in kg, same rule as onboarding.
   ============================================================================ */

export default function WeightTrackingPage() {
  const [entries, setEntries] = useState<WeightEntry[]>(WEIGHT_LOG);
  const [logging, setLogging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const start = entries[0].kg;
  const current = entries[entries.length - 1].kg;
  const change = current - start;
  const pct = (change / start) * 100;
  const weeklyAvg = change / (entries.length - 1);

  const addEntry = (kg: number, note: string) => {
    setEntries((es) => [
      ...es,
      {
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        kg,
        note: note.trim() || undefined,
      },
    ]);
    setLogging(false);
    setToast(`Weight logged — ${trim1(kg)} kg. Your prescriber sees this at your next review.`);
  };

  return (
    <div>
      <PageHeader title="Weight tracking" subtitle="Weekly check-ins — reviewed by your prescriber before every repeat" />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value={`${current.toFixed(1)} kg`} label="Current weight" />
          <StatTile value={`${change <= 0 ? "–" : "+"}${Math.abs(change).toFixed(1)} kg`} label={`Total change · ${pct.toFixed(1)}%`} tone={change <= 0 ? "success" : "warning"} />
          <StatTile value={`${Math.abs(weeklyAvg).toFixed(2)} kg`} label="Avg per week" tone="muted" />
          <StatTile value={bmiFor(current).toFixed(1)} label="Current BMI" />
        </div>

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
          <WeightChart entries={entries} />
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

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const w = 720;
  const h = 220;
  const padX = 44;
  const padY = 22;
  const values = entries.map((e) => e.kg);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const x = (i: number) => padX + (i * (w - padX - 16)) / Math.max(values.length - 1, 1);
  const y = (v: number) => padY + ((max - v) * (h - padY * 2)) / (max - min || 1);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const gridLines = [max, (max + min) / 2, min];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="mt-4 w-full min-w-[560px]" role="img" aria-label="Weight chart">
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={padX} x2={w - 8} y1={y(g)} y2={y(g)} stroke="var(--divider)" strokeDasharray="3 4" />
            <text x={padX - 8} y={y(g) + 4} textAnchor="end" className="fill-[var(--color-text-disabled)] font-mono text-[11px]">
              {g.toFixed(0)}
            </text>
          </g>
        ))}
        <polyline
          points={`${points} ${x(values.length - 1)},${y(min)} ${x(0)},${y(min)}`}
          fill="var(--primary-main-12)"
          stroke="none"
        />
        <polyline points={points} fill="none" stroke="var(--primary-main)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 5 : 3.5} fill="var(--primary-main)" />
            {i === values.length - 1 && (
              <text x={x(i)} y={y(v) - 10} textAnchor="middle" className="fill-[var(--color-text-primary)] font-mono text-[12px] font-bold">
                {v.toFixed(1)}
              </text>
            )}
          </g>
        ))}
        {entries.map((e, i) => (
          <text
            key={e.date}
            x={x(i)}
            y={h + 12}
            textAnchor="middle"
            className="fill-[var(--color-text-disabled)] font-mono text-[10px]"
          >
            {e.date.split(" ").slice(0, 2).join(" ")}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ---- log modal ------------------------------------------------------------ */

function LogWeightModal({
  open,
  lastKg,
  onClose,
  onSave,
}: {
  open: boolean;
  lastKg: number;
  onClose: () => void;
  onSave: (kg: number, note: string) => void;
}) {
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [kgStr, setKgStr] = useState("");
  const [st, setSt] = useState("");
  const [lb, setLb] = useState("");
  const [lbTotal, setLbTotal] = useState("");
  const [note, setNote] = useState("");

  const kg =
    unit === "kg"
      ? numOf(kgStr)
      : unit === "stlb"
        ? numOf(st) === null && numOf(lb) === null
          ? null
          : stLbToKg(numOf(st), numOf(lb))
        : numOf(lbTotal) === null
          ? null
          : (numOf(lbTotal) as number) / 2.2046226218;

  const valid = kg !== null && kg > 25 && kg < 400;
  const bigSwing = valid && Math.abs((kg! - lastKg) / lastKg) > 0.07;

  const switchUnit = (u: WeightUnit) => {
    // carry the current value across units so switching never loses the entry
    if (kg !== null && u !== unit) {
      if (u === "kg") setKgStr(trim1(kg));
      else if (u === "stlb") {
        const { st: s, lb: l } = kgToStLb(kg);
        setSt(String(s));
        setLb(String(l));
      } else setLbTotal(String(Math.round(kg * 2.2046226218)));
    }
    setUnit(u);
  };

  const inputCls =
    "h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 font-mono text-lg font-bold text-text-primary focus:border-primary focus:outline-none";

  return (
    <Modal open={open} title="Log this week's weight" subtitle={`Last check-in: ${lastKg.toFixed(1)} kg`} onClose={onClose}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Your weight today</p>
        <div role="group" aria-label="Weight unit" className="flex gap-0.5 rounded-full bg-[var(--divider)]/40 p-0.5">
          {WEIGHT_UNITS.map((u) => (
            <button
              key={u.key}
              type="button"
              aria-pressed={u.key === unit}
              onClick={() => switchUnit(u.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                u.key === unit ? "bg-background-paper text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-3 grid gap-2 ${unit === "stlb" ? "grid-cols-2" : "grid-cols-1"}`}>
        {unit === "kg" && (
          <div className="relative">
            <input type="number" inputMode="decimal" placeholder="92.4" value={kgStr} onChange={(e) => setKgStr(e.target.value)} className={inputCls} />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">kg</span>
          </div>
        )}
        {unit === "stlb" && (
          <>
            <div className="relative">
              <input type="number" inputMode="decimal" placeholder="14" value={st} onChange={(e) => setSt(e.target.value)} className={inputCls} />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">st</span>
            </div>
            <div className="relative">
              <input type="number" inputMode="decimal" placeholder="7" value={lb} onChange={(e) => setLb(e.target.value)} className={inputCls} />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">lb</span>
            </div>
          </>
        )}
        {unit === "lb" && (
          <div className="relative">
            <input type="number" inputMode="decimal" placeholder="203" value={lbTotal} onChange={(e) => setLbTotal(e.target.value)} className={inputCls} />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">lb</span>
          </div>
        )}
      </div>
      {valid && unit !== "kg" && (
        <p className="mt-1.5 font-mono text-xs text-text-secondary">= {trim1(kg!)} kg</p>
      )}
      {bigSwing && (
        <p className="mt-2 rounded-lg bg-warning-lighter px-3 py-2.5 text-xs leading-relaxed text-warning-darker">
          That&rsquo;s a big change since last week — double-check the number. Large swings trigger a prescriber
          confirmation at your next order.
        </p>
      )}

      <label className="mt-4 block text-sm font-semibold text-text-primary">Note (optional)</label>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Side effects, missed dose, travel…"
        className="mt-2 h-11 w-full rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none"
      />

      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => valid && onSave(Math.round(kg! * 10) / 10, note)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
        >
          Save check-in
        </button>
      </div>
    </Modal>
  );
}
