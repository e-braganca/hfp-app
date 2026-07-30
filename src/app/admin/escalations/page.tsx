"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RagPill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";
import { pharmacyName } from "@/lib/doctor/data";
import { ADMIN_ESCALATIONS } from "@/lib/admin/data";
import { OUTCOME_LABEL, type EscalationStatus } from "@/lib/admin/types";
import type { Rag } from "@/lib/doctor/types";

const RAG_TEXT: Record<Rag, string> = {
  green: "text-success-dark",
  amber: "text-warning-dark",
  yellow: "text-warning-dark",
  red: "text-error",
};
const RAG_BORDER: Record<Rag, string> = {
  green: "border-success/50",
  amber: "border-warning/50",
  yellow: "border-warning/50",
  red: "border-error/50",
};

// What the admin can ask the patient for — multi-select in the request-info modal.
const INFO_TOPICS = [
  "Current weight (new live photo)",
  "Blood pressure readings",
  "Pregnancy / breastfeeding status",
  "Current medications & doses",
  "Side effects experienced",
  "Weight history / previous attempts",
  "Recent blood tests",
  "GP contact details",
];

export default function AdminEscalationsPage() {
  const [statuses, setStatuses] = useState<Record<string, EscalationStatus>>(
    Object.fromEntries(ADMIN_ESCALATIONS.map((e) => [e.ref, e.status])),
  );
  const [tab, setTab] = useState<"open" | "past">("open");
  const [guideFor, setGuideFor] = useState<string | null>(null);
  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [infoFor, setInfoFor] = useState<string | null>(null);
  const [infoTopics, setInfoTopics] = useState<string[]>([]);
  const [infoNote, setInfoNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const resolve = (ref: string, status: Exclude<EscalationStatus, "open">, toastMsg: string) => {
    setStatuses((s) => ({ ...s, [ref]: status }));
    setGuideFor(null);
    setDeclineFor(null);
    setInfoFor(null);
    setToast(toastMsg);
  };

  const openInfoModal = (ref: string) => {
    setInfoTopics([]);
    setInfoNote("");
    setInfoFor(ref);
  };
  const toggleTopic = (t: string) =>
    setInfoTopics((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  // Open = untouched; Past = returned/awaiting info; declined leave the board entirely.
  const visible = ADMIN_ESCALATIONS.filter((e) =>
    tab === "open" ? statuses[e.ref] === "open" : statuses[e.ref] === "guidance" || statuses[e.ref] === "info",
  );
  const openCount = ADMIN_ESCALATIONS.filter((e) => statuses[e.ref] === "open").length;
  const pastCount = ADMIN_ESCALATIONS.filter((e) => ["guidance", "info"].includes(statuses[e.ref])).length;

  return (
    <>
      <PageHeader title="Escalations" subtitle="Cases removed from the standard queue — awaiting senior review" />

      <div className="space-y-5 px-6 py-6 lg:px-8">
        {/* tabs */}
        <div className="flex gap-1 border-b border-[var(--divider)]">
          {(
            [
              { key: "open", label: "Open", count: openCount },
              { key: "past", label: "Past", count: pastCount },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                tab === t.key
                  ? "border-primary text-primary-dark"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                  tab === t.key ? "bg-primary-lighter text-primary-dark" : "bg-background-neutral text-text-secondary"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {visible.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--divider)] px-4 py-10 text-center text-sm text-text-secondary">
            {tab === "open" ? "No open escalations — all clear." : "No resolved escalations yet."}
          </p>
        )}

        {visible.map((e) => {
          const status = statuses[e.ref];
          const resolved = status !== "open";
          return (
            <div
              key={e.ref}
              className={`rounded-lg border-2 bg-background-paper p-5 shadow-card ${
                resolved ? "border-[var(--divider)]" : RAG_BORDER[e.rag]
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-text-primary">{e.ref}</span>
                  <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background-neutral text-text-disabled">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
                        <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    {pharmacyName(e.pharmacyCode)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary">
                    Escalated by <span className="font-semibold text-text-primary">{e.escalatedBy}</span>
                  </span>
                  {!resolved && <span className={`text-sm font-semibold ${RAG_TEXT[e.rag]}`}>waiting {e.waited}</span>}
                  {resolved ? (
                    <RagPill rag={OUTCOME_LABEL[status].rag} label={OUTCOME_LABEL[status].label} />
                  ) : (
                    <RagPill rag={e.rag} />
                  )}
                </div>
              </div>

              <h3 className="mt-3 text-lg font-bold text-text-primary">{e.reason}</h3>
              <p className="text-sm text-text-secondary">{e.med}</p>

              {e.note && (
                <div className="mt-3 flex gap-2.5 rounded-lg bg-background-neutral px-4 py-3 text-sm text-text-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-text-disabled">
                    <path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                  {e.note}
                </div>
              )}

              {!resolved && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setGuideFor(e.ref)}
                      className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
                    >
                      Return with guidance
                    </button>
                    <button
                      type="button"
                      onClick={() => openInfoModal(e.ref)}
                      className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral"
                    >
                      Request patient info
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeclineFor(e.ref)}
                      className="rounded-lg border border-error px-4 py-2.5 text-sm font-bold text-error hover:bg-error-lighter"
                    >
                      Decline order
                    </button>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Every outcome is audit-logged with SOP version
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* return with guidance modal */}
      <Modal
        open={guideFor !== null}
        title="Return with guidance"
        subtitle={guideFor ?? ""}
        onClose={() => setGuideFor(null)}
      >
        <label className="block text-sm font-semibold text-text-primary">Clinical guidance for the doctor</label>
        <textarea
          rows={4}
          placeholder="Explain the decision and cite the SOP rule…"
          className="mt-2 w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
        />
        <p className="mt-3 text-xs text-text-secondary">
          Your guidance and the SOP version are logged; the case re-enters the doctor’s queue.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setGuideFor(null)}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => guideFor && resolve(guideFor, "guidance", `Returned to doctor with guidance — ${guideFor}`)}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Send guidance &amp; return case
          </button>
        </div>
      </Modal>

      {/* decline confirm modal */}
      <Modal
        open={declineFor !== null}
        title="Decline order?"
        subtitle={declineFor ?? ""}
        onClose={() => setDeclineFor(null)}
      >
        <p className="text-sm text-text-secondary">
          The patient will be notified and the decision recorded to the audit trail against the active SOP version.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeclineFor(null)}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => declineFor && resolve(declineFor, "declined", `Order declined — patient notified, ${declineFor}`)}
            className="rounded-lg bg-error px-4 py-2.5 text-sm font-bold text-white hover:bg-error-dark"
          >
            Decline order
          </button>
        </div>
      </Modal>

      {/* request patient info modal */}
      <Modal
        open={infoFor !== null}
        title="Request patient information"
        subtitle={infoFor ?? ""}
        onClose={() => setInfoFor(null)}
      >
        <p className="text-sm font-semibold text-text-primary">What do you need from the patient?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {INFO_TOPICS.map((t) => {
            const on = infoTopics.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => toggleTopic(t)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  on
                    ? "border-primary bg-primary-lighter text-primary-dark"
                    : "border-[var(--divider)] bg-background-paper text-text-secondary hover:border-primary-light hover:text-text-primary"
                }`}
              >
                {on ? "✓ " : ""}{t}
              </button>
            );
          })}
        </div>
        <label className="mt-4 block text-sm font-semibold text-text-primary">Anything else? (optional)</label>
        <textarea
          rows={3}
          value={infoNote}
          onChange={(e) => setInfoNote(e.target.value)}
          placeholder="Add context the patient will see with the request…"
          className="mt-2 w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
        />
        <p className="mt-3 text-xs text-text-secondary">
          The patient gets an email + dashboard task; the case moves to Past as “Awaiting patient info” and is
          audit-logged with the SOP version.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setInfoFor(null)}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={infoTopics.length === 0}
            onClick={() =>
              infoFor &&
              resolve(
                infoFor,
                "info",
                `Information request sent to patient — ${infoFor} (${infoTopics.length} topic${infoTopics.length === 1 ? "" : "s"})`,
              )
            }
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
          >
            Send request
          </button>
        </div>
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
