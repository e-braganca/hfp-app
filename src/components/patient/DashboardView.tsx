"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Toast } from "@/components/ui/Toast";
import { LogDoseModal } from "./LogDoseModal";
import { LogWeightModal } from "./LogWeightModal";
import { PendingVerificationBanner } from "./PendingVerificationBanner";
import { WeightSparkline } from "./WeightSparkline";
import {
  DELIVERIES,
  DELIVERY_STATUS_LABEL,
  DOSE_SCHEDULE,
  HEIGHT_CM,
  TREATMENT,
} from "@/lib/patient/data";
import {
  allDoses,
  allWeights,
  daysSinceLastDose,
  getLogServerSnapshot,
  getLogSnapshot,
  logDose,
  logWeight,
  prettyDate,
  subscribeLog,
} from "@/lib/patient/log-store";
import { buildProjection } from "@/lib/patient/projection";
import { trim1 } from "@/lib/onboarding/units";

/* ============================================================================
   Patient dashboard (FC-13) — the day-to-day hub: dose, weight trend,
   deliveries. Both check-ins happen here in a modal rather than sending the
   patient to another page to do a ten-second job.
   ============================================================================ */

export function DashboardView() {
  const log = useSyncExternalStore(subscribeLog, getLogSnapshot, getLogServerSnapshot);
  const [logging, setLogging] = useState<null | "weight" | "dose">(null);
  const [toast, setToast] = useState<string | null>(null);

  const weights = allWeights(log);
  const doses = allDoses(log);
  const start = weights[0].kg;
  const current = weights[weights.length - 1].kg;
  const next = DELIVERIES.find((d) => d.status !== "delivered");
  const sinceDose = daysSinceLastDose(log.doses);

  const projection = buildProjection({
    startKg: start,
    currentKg: current,
    heightCm: HEIGHT_CM,
    med: TREATMENT.shortName,
    startDate: weights[0].date,
    weeksElapsed: weights.length - 1,
  });

  return (
    <div>
      <PageHeader
        title="Good morning, Alex"
        subtitle={`${TREATMENT.med} · week ${TREATMENT.week} of your programme`}
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <PendingVerificationBanner />

        {/* headline numbers */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value={TREATMENT.dose} label="Current weekly dose" />
          <StatTile value={`–${(start - current).toFixed(1)} kg`} label={`Since starting · ${TREATMENT.week} weeks`} tone="success" />
          <StatTile
            value={sinceDose === null ? "—" : sinceDose === 0 ? "Today" : `${sinceDose}d`}
            label={sinceDose === null ? "No dose logged yet" : "Since your last dose"}
            tone={sinceDose !== null && sinceDose > 9 ? "warning" : "muted"}
          />
          <StatTile value={next?.date.replace(" 2026", "") ?? "—"} label="Next delivery arrives" tone="muted" />
        </div>

        {/* the two weekly check-ins, side by side */}
        <section className="grid gap-4 sm:grid-cols-2">
          <CheckInCard
            title="This week's dose"
            body={
              sinceDose === null
                ? `Record each ${TREATMENT.shortName} injection so your prescriber can see your schedule.`
                : sinceDose === 0
                  ? "Logged today — you're up to date."
                  : `Last logged ${sinceDose} day${sinceDose === 1 ? "" : "s"} ago${doses[0] ? ` · ${prettyDate(doses[0].date)}` : ""}.`
            }
            cta="Log dose"
            onClick={() => setLogging("dose")}
            tone={sinceDose !== null && sinceDose > 9 ? "warning" : "default"}
          />
          <CheckInCard
            title="This week's weight"
            body={`Last check-in ${weights[weights.length - 1].date} · ${current.toFixed(1)} kg.`}
            cta="Log weight"
            onClick={() => setLogging("weight")}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* weight trend */}
          <section className="rounded-lg bg-background-paper p-6 shadow-card">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold text-text-primary">Weight trend</h2>
              <span className="font-mono text-xs text-text-secondary">weekly check-in · kg</span>
            </div>
            <WeightSparkline values={weights.map((w) => w.kg)} projection={projection} />
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="text-text-secondary">
                Started <span className="font-mono font-bold text-text-primary">{start.toFixed(1)}</span>
              </span>
              <span className="text-text-secondary">
                Today <span className="font-mono font-bold text-success-dark">{current.toFixed(1)}</span>
              </span>
              <span className="text-text-secondary">
                Target <span className="font-mono font-bold text-secondary-dark">{projection.targetKg.toFixed(1)}</span>
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              Dashed line is the {TREATMENT.shortName} trial average applied to your start weight — an estimate, not a
              promise. <Link href="/patient/weight" className="font-semibold text-primary hover:underline">See the full projection</Link>
            </p>
          </section>

          {/* dose schedule */}
          <section className="rounded-lg bg-background-paper p-6 shadow-card">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold text-text-primary">Titration schedule</h2>
              <Link href="/patient/treatment" className="text-xs font-bold text-primary hover:underline">
                My treatment →
              </Link>
            </div>
            <ol className="mt-4 space-y-3">
              {DOSE_SCHEDULE.map((d) => (
                <li key={d.week} className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      d.state === "done"
                        ? "bg-success"
                        : d.state === "current"
                          ? "bg-primary ring-4 ring-[var(--primary-main-24)]"
                          : "bg-grey-300"
                    }`}
                  />
                  <span className={`flex-1 text-sm ${d.state === "current" ? "font-bold text-text-primary" : "text-text-secondary"}`}>
                    {d.week}
                  </span>
                  <span className="font-mono text-sm font-bold text-text-primary">{d.dose}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-lg bg-primary-lighter px-3 py-2.5 text-xs leading-relaxed text-primary-dark">
              Dose increases are confirmed by your prescriber at each review — never change your dose on your own.
            </p>
          </section>
        </div>

        {/* deliveries */}
        <section className="rounded-lg bg-background-paper p-6 shadow-card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-text-primary">Deliveries</h2>
            <Link href="/patient/deliveries" className="text-xs font-bold text-primary hover:underline">
              All deliveries →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[var(--divider)] text-sm">
            {DELIVERIES.map((d) => {
              const st = DELIVERY_STATUS_LABEL[d.status];
              return (
                <div key={d.ref} className="flex items-center justify-between gap-4 py-3">
                  <span className="font-mono text-xs text-text-secondary">{d.date}</span>
                  <span className="flex-1 text-text-primary">{d.what}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                      st.tone === "success"
                        ? "bg-success-lighter text-success-dark"
                        : st.tone === "warning"
                          ? "bg-warning-lighter text-warning-dark"
                          : "bg-info-lighter text-info-dark"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            href="/patient/deliveries/new"
            className="mt-4 inline-block rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-bold text-text-primary transition-colors hover:bg-background-neutral"
          >
            Renew your prescription
          </Link>
        </section>
      </div>

      <LogWeightModal
        open={logging === "weight"}
        lastKg={current}
        onClose={() => setLogging(null)}
        onSave={(kg, note) => {
          logWeight({
            date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
            kg,
            note: note.trim() || undefined,
          });
          setLogging(null);
          setToast(`Weight logged — ${trim1(kg)} kg. Your prescriber sees this at your next review.`);
        }}
      />

      <LogDoseModal
        open={logging === "dose"}
        onClose={() => setLogging(null)}
        onSave={(date) => {
          logDose({ date, dose: TREATMENT.dose });
          setLogging(null);
          setToast(`Dose logged — ${TREATMENT.shortName} ${TREATMENT.dose} on ${prettyDate(date)}.`);
        }}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

/** One of the two weekly jobs, with the state of it and the button to do it. */
function CheckInCard({
  title,
  body,
  cta,
  onClick,
  tone = "default",
}: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-5 shadow-card ${
        tone === "warning" ? "bg-warning-lighter/60 ring-1 ring-warning/30" : "bg-background-paper"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-text-primary">{title}</p>
        <p className="mt-0.5 text-sm text-text-secondary">{body}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
      >
        {cta}
      </button>
    </div>
  );
}
