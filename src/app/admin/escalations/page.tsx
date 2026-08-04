"use client";

import { useEffect, useRef, useState } from "react";
import { EscalationDrawer } from "@/components/admin/EscalationDrawer";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RagPill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";
import { RequestInfoEmailModal } from "@/components/shared/RequestInfoEmailModal";
import { ChevronRight } from "@/components/ui/icons";
import { RAG_TEXT } from "@/lib/doctor/rag";
import { pharmacyName } from "@/lib/doctor/data";
import { ADMIN_ESCALATIONS } from "@/lib/admin/data";
import { OUTCOME_LABEL, type EscalationStatus } from "@/lib/admin/types";
import type { Rag } from "@/lib/doctor/types";

const RAG_BORDER: Record<Rag, string> = {
  green: "border-success/50",
  amber: "border-warning/50",
  yellow: "border-warning/50",
  red: "border-error/50",
};

export default function AdminEscalationsPage() {
  const [statuses, setStatuses] = useState<Record<string, EscalationStatus>>(
    Object.fromEntries(ADMIN_ESCALATIONS.map((e) => [e.ref, e.status])),
  );
  const [tab, setTab] = useState<"open" | "past">("open");
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [guideFor, setGuideFor] = useState<string | null>(null);
  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [infoFor, setInfoFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Open = untouched; Past = returned/awaiting info; declined leave the board entirely.
  const visible = ADMIN_ESCALATIONS.filter((e) =>
    tab === "open" ? statuses[e.ref] === "open" : statuses[e.ref] === "guidance" || statuses[e.ref] === "info",
  );
  const openCount = ADMIN_ESCALATIONS.filter((e) => statuses[e.ref] === "open").length;
  const pastCount = ADMIN_ESCALATIONS.filter((e) => ["guidance", "info"].includes(statuses[e.ref])).length;

  const active = ADMIN_ESCALATIONS.find((e) => e.ref === activeRef) ?? null;
  const infoPatient = ADMIN_ESCALATIONS.find((e) => e.ref === infoFor);

  /**
   * Resolve, then hand the reviewer the next case in list order. The resolved
   * one drops out of Open, so "next" is the one that followed it — wrapping to
   * the top when it was last, since everything left sits above it.
   */
  const resolve = (ref: string, status: Exclude<EscalationStatus, "open">, toastMsg: string) => {
    const queue = visible.map((e) => e.ref);
    const remaining = queue.filter((r) => r !== ref);
    const at = queue.indexOf(ref);
    const nextRef = remaining.length === 0 ? null : (remaining[at] ?? remaining[0]);

    setStatuses((s) => ({ ...s, [ref]: status }));
    setGuideFor(null);
    setDeclineFor(null);
    setInfoFor(null);
    setActiveRef(nextRef);
    setToast(nextRef ? toastMsg : `${toastMsg} — no open escalations left`);
  };

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
              onClick={() => {
                setTab(t.key);
                setActiveRef(null);
              }}
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

        {visible.map((e) => (
          <EscalationCard
            key={e.ref}
            e={e}
            status={statuses[e.ref]}
            active={activeRef === e.ref}
            onOpen={() => setActiveRef(e.ref)}
          />
        ))}
      </div>

      <EscalationDrawer
        escalation={active}
        status={active ? statuses[active.ref] : "open"}
        position={active ? visible.findIndex((v) => v.ref === active.ref) + 1 : 0}
        total={visible.length}
        onClose={() => setActiveRef(null)}
        onGuidance={() => active && setGuideFor(active.ref)}
        onInfo={() => active && setInfoFor(active.ref)}
        onDecline={() => active && setDeclineFor(active.ref)}
      />

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

      {/* request patient info — email composer */}
      {infoFor && (
        <RequestInfoEmailModal
          open
          onClose={() => setInfoFor(null)}
          onSend={({ subject }) =>
            resolve(infoFor, "info", `Email sent to ${infoPatient?.patientName ?? "patient"} — "${subject}"`)
          }
          patientName={infoPatient?.patientName ?? "the patient"}
          sex={infoPatient?.sex}
          caseRef={infoFor}
          senderName="Dr. Eleanor Hart"
          senderRole="Clinical Lead · HFP Admin"
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

/** List card. Decisions moved into the drawer, so the card's only job is to
 *  summarise the case and show whether it's the one under review. */
function EscalationCard({
  e,
  status,
  active,
  onOpen,
}: {
  e: (typeof ADMIN_ESCALATIONS)[number];
  status: EscalationStatus;
  active: boolean;
  onOpen: () => void;
}) {
  const resolved = status !== "open";
  const el = useRef<HTMLDivElement>(null);

  // when resolving advances the drawer, bring the new case into view behind it
  useEffect(() => {
    if (active) el.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <div ref={el} className={active ? "relative" : undefined}>
      {active && (
        <span className="absolute -left-3 top-6 bottom-6 w-1.5 rounded-full bg-primary" aria-hidden />
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onOpen();
          }
        }}
        className={`cursor-pointer rounded-lg border-2 bg-background-paper p-5 text-left shadow-card transition-shadow hover:shadow-dialog focus:outline-none ${
          active
            ? "border-primary ring-2 ring-primary-main-24"
            : resolved
              ? "border-[var(--divider)]"
              : RAG_BORDER[e.rag]
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* first in the row so it stays readable in the sliver of list the
                open drawer leaves visible */}
            {active && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                Reviewing
              </span>
            )}
            <span className="font-mono text-sm font-bold text-text-primary">{e.ref}</span>
            <span className="text-sm font-semibold text-text-primary">{e.patientName}</span>
            <span className="text-sm text-text-secondary">{pharmacyName(e.pharmacyCode)}</span>
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

        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-text-primary">{e.reason}</h3>
            <p className="text-sm text-text-secondary">{e.med}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary-dark">
            {resolved ? "View record" : "Open review"}
            <ChevronRight width={16} height={16} />
          </span>
        </div>

        {e.note && (
          <div className="mt-3 flex gap-2.5 rounded-lg bg-background-neutral px-4 py-3 text-sm text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-text-disabled">
              <path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            {e.note}
          </div>
        )}
      </div>
    </div>
  );
}
