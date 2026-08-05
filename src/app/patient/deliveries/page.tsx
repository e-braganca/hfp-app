import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { DELIVERIES, DELIVERY_STATUS_LABEL, TREATMENT } from "@/lib/patient/data";

export const metadata: Metadata = { title: "Deliveries — Prescriptr" };

/* ============================================================================
   Deliveries (FC-15) — history + the entry point to the re-order wizard.
   ============================================================================ */

export default function DeliveriesPage() {
  const inFlight = DELIVERIES.find((d) => d.status !== "delivered");

  return (
    <div>
      <PageHeader title="Deliveries" subtitle="Cold-chain, signed-for — dispensed by your pharmacy after prescriber approval" />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value={inFlight ? inFlight.date.replace(" 2026", "") : "—"} label="Next delivery" />
          <StatTile value={inFlight ? DELIVERY_STATUS_LABEL[inFlight.status].label : "None in flight"} label="Status" tone="warning" />
          <StatTile value={TREATMENT.dose} label="Current dose" tone="muted" />
          <StatTile value={`£${TREATMENT.priceMo}`} label="Per month · charged on approval" tone="muted" />
        </div>

        <section className="rounded-lg bg-background-paper p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-text-primary">All deliveries</h2>
            <Link
              href="/patient/deliveries/new"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              Renew your prescription
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[var(--divider)]">
            {DELIVERIES.map((d) => {
              const st = DELIVERY_STATUS_LABEL[d.status];
              return (
                <div key={d.ref} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4 text-sm">
                  <span className="w-20 shrink-0 font-mono text-xs font-bold text-text-primary">{d.ref}</span>
                  <span className="w-28 shrink-0 font-mono text-xs text-text-secondary">{d.date}</span>
                  <span className="min-w-0 flex-1 font-semibold text-text-primary">{d.what}</span>
                  {d.tracking && <span className="font-mono text-xs text-text-secondary">{d.tracking}</span>}
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

          <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-xs leading-relaxed text-primary-dark">
            Every repeat is reviewed by a prescriber before dispatch. Renewing includes a quick check-in —
            current weight with a live photo — so the review is fast.
          </p>
        </section>
      </div>
    </div>
  );
}
