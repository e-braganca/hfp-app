"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TREATMENT } from "@/lib/patient/data";
import { prettyDate, todayIso } from "@/lib/patient/log-store";

/**
 * Record an injection. The only thing to choose is the date — the dose comes
 * from the active prescription, because a patient changing their own dose is
 * exactly what the titration schedule exists to prevent. Recording it late is
 * normal, so past dates are allowed and future ones are not.
 */
export function LogDoseModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (date: string) => void;
}) {
  const today = todayIso();
  const [date, setDate] = useState(today);

  if (!open) return null;
  const valid = !!date && date <= today;

  return (
    <Modal
      open
      title="Log your dose"
      subtitle={`${TREATMENT.med} · ${TREATMENT.dose}`}
      onClose={onClose}
    >
      <div className="rounded-lg bg-background-neutral px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Recording</p>
        <p className="mt-0.5 text-base font-bold text-text-primary">
          {TREATMENT.shortName} {TREATMENT.dose}
        </p>
        <p className="text-xs text-text-secondary">
          Your prescribed dose — it changes only when your prescriber moves you up at a review.
        </p>
      </div>

      <label className="mt-4 block text-sm font-semibold text-text-primary">When did you take it?</label>
      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => setDate(e.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none"
      />
      <p className="mt-1.5 text-xs text-text-secondary">
        {date === today ? "Today" : date ? prettyDate(date) : "Pick the day you injected"} · usually a{" "}
        {TREATMENT.injectionDay}
      </p>

      <p className="mt-4 rounded-lg bg-primary-lighter px-3 py-2.5 text-xs leading-relaxed text-primary-dark">
        Your prescriber reads this before each repeat — gaps between doses affect whether you can carry on at the same
        dose or need to step down.
      </p>

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
          onClick={() => valid && onSave(date)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
        >
          Log dose
        </button>
      </div>
    </Modal>
  );
}
