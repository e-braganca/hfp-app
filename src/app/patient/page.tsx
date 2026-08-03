import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { PendingVerificationBanner } from "@/components/patient/PendingVerificationBanner";
import { WeightSparkline } from "@/components/patient/WeightSparkline";
import {
  DELIVERIES,
  DELIVERY_STATUS_LABEL,
  DOSE_SCHEDULE,
  HEIGHT_CM,
  TREATMENT,
  WEIGHT_LOG,
} from "@/lib/patient/data";
import { buildProjection } from "@/lib/patient/projection";

export const metadata: Metadata = { title: "Your dashboard — Prescriptr" };

/* ============================================================================
   Patient dashboard (FC-13) — the day-to-day hub: dose, weight trend,
   deliveries. Each section links into its full page.
   ============================================================================ */

export default function PatientDashboard() {
  const start = WEIGHT_LOG[0].kg;
  const current = WEIGHT_LOG[WEIGHT_LOG.length - 1].kg;
  const next = DELIVERIES.find((d) => d.status !== "delivered");
  const projection = buildProjection({
    startKg: start,
    currentKg: current,
    heightCm: HEIGHT_CM,
    med: TREATMENT.shortName,
    startDate: WEIGHT_LOG[0].date,
    weeksElapsed: WEIGHT_LOG.length - 1,
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
          <StatTile value={TREATMENT.injectionDay.slice(0, 3)} label="Next injection day" />
          <StatTile value={next?.date.replace(" 2026", "") ?? "—"} label="Next delivery arrives" tone="muted" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* weight trend */}
          <section className="rounded-lg bg-background-paper p-6 shadow-card">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold text-text-primary">Weight trend</h2>
              <span className="font-mono text-xs text-text-secondary">weekly check-in · kg</span>
            </div>
            <WeightSparkline values={WEIGHT_LOG.map((w) => w.kg)} projection={projection} />
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
              <Link
                href="/patient/weight"
                className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                Log this week&rsquo;s weight
              </Link>
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
            Request new delivery
          </Link>
        </section>
      </div>
    </div>
  );
}
