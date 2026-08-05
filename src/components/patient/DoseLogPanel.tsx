"use client";

import { useState, useSyncExternalStore } from "react";
import { Toast } from "@/components/ui/Toast";
import { LogDoseModal } from "./LogDoseModal";
import { TREATMENT } from "@/lib/patient/data";
import {
  allDoses,
  daysSinceLastDose,
  getLogServerSnapshot,
  getLogSnapshot,
  logDose,
  prettyDate,
  subscribeLog,
  undoDose,
} from "@/lib/patient/log-store";

/**
 * The injection record on My treatment. The same modal the dashboard uses —
 * the difference here is the history, which is what the prescriber reads at
 * review and what tells the patient whether they've drifted off schedule.
 */
export function DoseLogPanel() {
  const log = useSyncExternalStore(subscribeLog, getLogSnapshot, getLogServerSnapshot);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const doses = allDoses(log);
  const since = daysSinceLastDose(log.doses);
  const overdue = since !== null && since > 9;

  return (
    <section className="rounded-lg bg-background-paper p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text-primary">Your dose log</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            {since === null
              ? `No doses logged yet — record each ${TREATMENT.shortName} injection as you take it.`
              : since === 0
                ? "Logged today. Your schedule is up to date."
                : `Last injection ${since} day${since === 1 ? "" : "s"} ago.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
        >
          Log dose
        </button>
      </div>

      {overdue && (
        <p className="mt-4 rounded-lg bg-warning-lighter px-4 py-3 text-sm leading-relaxed text-warning-darker">
          It&rsquo;s been over a week and a half since your last logged dose. If you&rsquo;ve missed more than 4 days,
          skip it and take the next one on your usual {TREATMENT.injectionDay} — never double up. Gaps beyond six weeks
          mean your prescriber has to step you back down a dose.
        </p>
      )}

      {doses.length > 0 && (
        <ul className="mt-4 divide-y divide-[var(--divider)]">
          {doses.slice(0, 8).map((d) => (
            <li key={d.date} className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-sm text-text-primary">{prettyDate(d.date)}</span>
              <span className="font-mono text-sm font-bold text-text-primary">
                {TREATMENT.shortName} {d.dose}
              </span>
              <button
                type="button"
                onClick={() => {
                  undoDose(d.date);
                  setToast(`Removed the dose logged on ${prettyDate(d.date)}.`);
                }}
                className="text-xs font-bold text-text-secondary underline hover:text-text-primary"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <LogDoseModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(date) => {
          logDose({ date, dose: TREATMENT.dose });
          setOpen(false);
          setToast(`Dose logged — ${TREATMENT.shortName} ${TREATMENT.dose} on ${prettyDate(date)}.`);
        }}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </section>
  );
}
