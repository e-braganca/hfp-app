"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { kgToStLb, numOf, stLbToKg, trim1, WEIGHT_UNITS, type WeightUnit } from "@/lib/onboarding/units";

/**
 * Weekly weight check-in. Entered in whichever unit the patient thinks in
 * (kg / st·lb / lb) and stored in kg, the same rule onboarding follows.
 * Shared by the dashboard and the Weight tracking page.
 */
export function LogWeightModal({
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
