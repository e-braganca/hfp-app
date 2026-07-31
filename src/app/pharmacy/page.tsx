"use client";

import { useSyncExternalStore } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { CheckIcon } from "@/components/ui/icons";
import {
  getApplicationsServerSnapshot,
  getApplicationsSnapshot,
  subscribeApplications,
} from "@/lib/pharmacy-applications";

/* ============================================================================
   Pharmacy partner portal (FC — pharmacy side, first page). Status-aware:
   while their application sits in the admin queue the dashboard shows the
   review state; once approved (application leaves the queue) it shows the
   live partner dashboard. Same-browser demo arc:
   register → "under review" → admin approves → this page goes live.
   ============================================================================ */

const RECENT_ORDERS = [
  { ref: "PT-4471", med: "Mounjaro 2.5 mg · new start", status: "Approved · Dr. Hart", ok: true, at: "09:41" },
  { ref: "PT-4470", med: "Wegovy 0.25 mg · new start", status: "Approved · Dr. Reyes", ok: true, at: "09:12" },
  { ref: "PT-3126", med: "Mounjaro 5 mg · simple repeat", status: "Approved · batch", ok: true, at: "08:55" },
  { ref: "PT-4468", med: "Mounjaro 2.5 mg · new start", status: "In review", ok: false, at: "08:47" },
  { ref: "PT-2087", med: "Mounjaro 7.5 mg · complex repeat", status: "Escalated · senior review", ok: false, at: "08:20" },
];

const SOP_SUMMARY = [
  ["1.1 Eligibility", "BMI ≥ 30, or ≥ 27 with qualifying comorbidity"],
  ["2.2 Titration", "One dose level per 4 weeks, tolerance permitting"],
  ["4.3 Treatment gaps", "> 6 weeks → re-titrate one level below"],
  ["5.1 Maximum dose", "Mounjaro 15 mg · Wegovy 2.4 mg"],
];

export default function PharmacyDashboard() {
  const applications = useSyncExternalStore(
    subscribeApplications,
    getApplicationsSnapshot,
    getApplicationsServerSnapshot,
  );
  // most recent application still awaiting admin review, if any
  const pending = applications[applications.length - 1];

  if (pending) {
    return (
      <div>
        <PageHeader title={pending.business} subtitle={`Partner application ${pending.id} · submitted ${pending.submittedAt}`} />
        <div className="space-y-6 px-6 py-6 lg:px-8">
          <div className="rounded-lg border-2 border-warning/50 bg-background-paper p-6 shadow-card">
            <span className="rounded-full bg-warning-lighter px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-warning-dark">
              Application under review
            </span>
            <h2 className="mt-3 text-xl font-extrabold text-text-primary">
              Thanks, {pending.responsibleName.split(" ")[0]} — our clinical team is on it.
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary">
              We&rsquo;re reviewing {pending.business}&rsquo;s GPhC registration, sourcing and SOP. Expect a reply at{" "}
              <span className="font-semibold text-text-primary">{pending.responsibleEmail}</span> within 5 working days.
            </p>
            <ol className="mt-5 space-y-3">
              {[
                { label: "Application received", state: "done" },
                { label: "Compliance review — registration, sourcing, SOP", state: "active" },
                { label: "SOP configuration & validation with you", state: "next" },
                { label: "Go live — orders in, signed decisions out", state: "next" },
              ].map((s) => (
                <li key={s.label} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      s.state === "done"
                        ? "bg-success text-white"
                        : s.state === "active"
                          ? "bg-warning text-white"
                          : "bg-background-neutral text-text-disabled"
                    }`}
                  >
                    {s.state === "done" ? <CheckIcon width={13} height={13} /> : s.state === "active" ? "…" : ""}
                  </span>
                  <span className={`text-sm ${s.state === "next" ? "text-text-secondary" : "font-semibold text-text-primary"}`}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg bg-background-paper p-6 shadow-card">
              <h3 className="text-base font-bold text-text-primary">Your submission</h3>
              <div className="mt-3 space-y-2 text-sm">
                {(
                  [
                    ["Coverage", pending.coverage.join(", ")],
                    ["Can supply", pending.meds.join(", ")],
                    ["SOP document", pending.sopFileName],
                    ["Contact", `${pending.responsibleEmail} · ${pending.phone}`],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-b border-[var(--divider)] pb-2 last:border-0">
                    <span className="shrink-0 text-text-secondary">{k}</span>
                    <span className="text-right font-semibold text-text-primary">{v}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-lg bg-background-paper p-6 shadow-card">
              <h3 className="text-base font-bold text-text-primary">While you wait</h3>
              <ul className="mt-3 space-y-3">
                {[
                  "Have your GPhC registration certificate ready for verification.",
                  "Confirm your cold-chain courier can evidence 2–8 °C in transit.",
                  "Nominate the superintendent pharmacist for the SOP configuration call.",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-text-primary">
                    <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // live partner state
  return (
    <div>
      <PageHeader title="Willowbrook Pharmacy" subtitle="Partner dashboard · SOP v3.2 active · London SE1" />
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value="23" label="Orders signed today" />
          <StatTile value="4.1h" label="Median review turnaround" tone="success" />
          <StatTile value="99%" label="Compliance vs your SOP" tone="success" />
          <StatTile value="412" label="Scripts this month" tone="muted" />
        </div>

        <section id="orders" className="rounded-lg bg-background-paper p-6 shadow-card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-text-primary">Recent orders</h2>
            <span className="font-mono text-xs text-text-secondary">today · decisions by named prescribers</span>
          </div>
          <div className="mt-3 divide-y divide-[var(--divider)]">
            {RECENT_ORDERS.map((o) => (
              <div key={o.ref} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <span className="w-20 shrink-0 font-mono text-xs font-bold text-text-primary">{o.ref}</span>
                <span className="w-14 shrink-0 font-mono text-xs text-text-secondary">{o.at}</span>
                <span className="min-w-0 flex-1 text-text-primary">{o.med}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                    o.ok ? "bg-success-lighter text-success-dark" : "bg-warning-lighter text-warning-dark"
                  }`}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="sop" className="rounded-lg bg-background-paper p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-text-primary">Your SOP</h2>
            <span className="flex items-center gap-2 text-xs font-semibold text-success-dark">
              <span className="h-2 w-2 rounded-full bg-success" /> v3.2 active · updated 12 May 2026
            </span>
          </div>
          <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--divider)] sm:grid-cols-2">
            {SOP_SUMMARY.map(([k, v]) => (
              <div key={k} className="bg-background-paper p-4">
                <p className="font-mono text-[11px] font-bold text-primary-dark">{k}</p>
                <p className="mt-0.5 text-sm text-text-secondary">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-xs leading-relaxed text-primary-dark">
            SOP changes go through your account manager — every new version is validated against sample cases before it
            goes live, and old versions stay in the audit trail.
          </p>
        </section>
      </div>
    </div>
  );
}
