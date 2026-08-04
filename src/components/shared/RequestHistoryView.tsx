"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { RagPill } from "@/components/ui/StatusPill";
import { pharmacyName } from "@/lib/doctor/data";
import {
  OUTCOME_META,
  PAST_REQUESTS,
  type PastRequest,
  type RequestOutcome,
} from "@/lib/shared/request-history";

/* ============================================================================
   Past medication requests — the decision log. Doctors get their own
   decisions (`onlyDoctor`), admins get the whole panel plus a "decided by"
   column. Filter by outcome, category and pharmacy; search by ref or patient.
   ============================================================================ */

const OUTCOMES: (RequestOutcome | "all")[] = ["all", "approved", "declined", "info", "escalated"];
const CATEGORIES = ["all", "New Order", "Simple Repeat", "Complex Repeat"] as const;

export function RequestHistoryView({ onlyDoctor }: { onlyDoctor?: string }) {
  const [outcome, setOutcome] = useState<RequestOutcome | "all">("all");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [query, setQuery] = useState("");

  const scope = useMemo(
    () => (onlyDoctor ? PAST_REQUESTS.filter((r) => r.decidedBy === onlyDoctor) : PAST_REQUESTS),
    [onlyDoctor],
  );

  const rows = scope.filter((r) => {
    if (outcome !== "all" && r.outcome !== outcome) return false;
    if (category !== "all" && r.category !== category) return false;
    const q = query.trim().toLowerCase();
    return q === "" || r.ref.toLowerCase().includes(q) || r.patientName.toLowerCase().includes(q);
  });

  const count = (o: RequestOutcome) => scope.filter((r) => r.outcome === o).length;
  const approvalRate = scope.length ? Math.round((count("approved") / scope.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Past requests"
        subtitle={
          onlyDoctor
            ? "Every medication request you have decided, with the SOP version in force at the time"
            : "Every decided medication request across the panel, with the SOP version in force at the time"
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value={scope.length} label="Requests decided" />
          <StatTile value={`${approvalRate}%`} label="Approved & issued" tone="success" />
          <StatTile value={count("declined")} label="Declined" tone="warning" />
          <StatTile value={count("escalated")} label="Escalated" tone="muted" />
        </div>

        <section className="rounded-lg bg-background-paper shadow-card">
          {/* filters */}
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--divider)] p-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient ref or name…"
              className="h-9 w-56 rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none"
            />
            <div className="flex flex-wrap gap-1">
              {OUTCOMES.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                    outcome === o
                      ? "bg-primary text-white"
                      : "bg-background-neutral text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {o === "all" ? "All outcomes" : OUTCOME_META[o].label}
                </button>
              ))}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
              className="ml-auto h-9 rounded-lg border border-[var(--divider)] px-2.5 text-sm focus:border-primary focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
              ))}
            </select>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <div className={onlyDoctor ? "min-w-[820px]" : "min-w-[980px]"}>
              <div
                className={`grid ${onlyDoctor ? "grid-cols-[110px_1.3fr_1.4fr_0.9fr_1fr_140px]" : "grid-cols-[110px_1.3fr_1.4fr_0.9fr_1fr_1fr_140px]"} border-b border-[var(--divider)] bg-grey-100`}
              >
                {["Ref", "Patient", "Medication", "Category", "Pharmacy", ...(onlyDoctor ? [] : ["Decided by"]), "Outcome"].map((h) => (
                  <div key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                    {h}
                  </div>
                ))}
              </div>

              {rows.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-text-secondary">
                  No requests match these filters.
                </p>
              )}

              {rows.map((r) => (
                <Row key={r.ref} r={r} onlyDoctor={!!onlyDoctor} />
              ))}
            </div>
          </div>

          <p className="flex items-center gap-1.5 border-t border-[var(--divider)] px-4 py-3 text-xs text-text-secondary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
            </svg>
            Showing {rows.length} of {scope.length} — every row is an immutable audit entry keyed to its SOP version.
          </p>
        </section>
      </div>
    </>
  );
}

function Row({ r, onlyDoctor }: { r: PastRequest; onlyDoctor: boolean }) {
  const meta = OUTCOME_META[r.outcome];
  return (
    <div
      className={`grid ${onlyDoctor ? "grid-cols-[110px_1.3fr_1.4fr_0.9fr_1fr_140px]" : "grid-cols-[110px_1.3fr_1.4fr_0.9fr_1fr_1fr_140px]"} items-center border-b border-[var(--divider)] last:border-0 hover:bg-background-neutral/60`}
    >
      <div className="px-4 py-3">
        <p className="font-mono text-xs font-bold text-text-primary">{r.ref}</p>
        <p className="font-mono text-[10px] text-text-disabled">SOP {r.sopVersion}</p>
      </div>
      <div className="px-4 py-3">
        <p className="truncate text-sm font-semibold text-text-primary">{r.patientName}</p>
        <p className="font-mono text-[11px] text-text-secondary">{r.decidedOn}</p>
      </div>
      <div className="px-4 py-3">
        <p className="truncate text-sm text-text-primary">{r.med}</p>
        <p className="text-xs text-text-secondary">{r.dose}</p>
        {r.note && <p className="mt-0.5 text-xs italic text-text-secondary">{r.note}</p>}
      </div>
      <div className="px-4 py-3">
        <span className="rounded-md bg-grey-200 px-2 py-0.5 text-xs font-semibold text-text-secondary">{r.category}</span>
      </div>
      <div className="truncate px-4 py-3 text-sm text-text-secondary">{pharmacyName(r.pharmacyCode)}</div>
      {!onlyDoctor && <div className="truncate px-4 py-3 text-sm text-text-primary">{r.decidedBy}</div>}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold ${meta.cls}`}>
          {meta.label}
        </span>
        <RagPill rag={r.rag} />
      </div>
    </div>
  );
}
