"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MetricCard } from "@/components/doctor/MetricCard";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PharmacyFilter } from "@/components/doctor/PharmacyFilter";
import { PharmacyLabel } from "@/components/ui/PharmacyLabel";
import { ScorePill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";
import { ChevronRight, WarnIcon } from "@/components/ui/icons";
import {
  COMPLEX_CASES,
  ESCALATIONS,
  NEW_ORDERS,
  QUEUE_METRICS,
  SIMPLE_REPEATS,
} from "@/lib/doctor/data";

type Tab = "new" | "simple" | "complex" | "escalated";

const TABS: { key: Tab; label: string; count: number }[] = [
  { key: "new", label: "New Orders", count: NEW_ORDERS.length },
  { key: "simple", label: "Simple Repeats", count: SIMPLE_REPEATS.length },
  { key: "complex", label: "Complex Repeats", count: COMPLEX_CASES.length },
  { key: "escalated", label: "Escalated Requests", count: ESCALATIONS.length },
];

export default function WorkQueuePage() {
  const [tab, setTab] = useState<Tab>("new");
  const [pharmacy, setPharmacy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const byPharmacy = <T extends { pharmacyCode: string }>(rows: T[]) =>
    pharmacy ? rows.filter((r) => r.pharmacyCode === pharmacy) : rows;

  return (
    <>
      <PageHeader
        title="Work Queue"
        subtitle="Manage pending prescriptions through new orders, simple repeats, and complex repeats"
      />

      <div className="px-6 py-6 lg:px-8">
        {/* metric tiles */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {QUEUE_METRICS.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>

        {/* tabs + filter */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1 border-b border-[var(--divider)]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "border-primary text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    tab === t.key
                      ? "bg-primary-main-16 text-primary-dark"
                      : "bg-grey-200 text-text-secondary"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <PharmacyFilter value={pharmacy} onChange={setPharmacy} />
        </div>

        <div className="mt-5">
          {tab === "new" && <NewOrdersTab rows={byPharmacy(NEW_ORDERS)} />}
          {tab === "simple" && (
            <SimpleRepeatsTab rows={byPharmacy(SIMPLE_REPEATS)} onSigned={(n) => setToast(`${n} simple repeats approved & signed`)} />
          )}
          {tab === "complex" && <ComplexRepeatsTab rows={byPharmacy(COMPLEX_CASES)} />}
          {tab === "escalated" && <EscalatedTab rows={byPharmacy(ESCALATIONS)} />}
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

// ---- table shells ---------------------------------------------------------

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg bg-background-paper shadow-card">
      <div className="overflow-x-auto">
        <div className="min-w-[840px]">{children}</div>
      </div>
    </div>
  );
}

function HeadCell({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary ${className}`}>
      {children}
    </div>
  );
}

function PatientCell({ ref_, nhs }: { ref_: string; nhs: string }) {
  return (
    <div className="px-4 py-4">
      <div className="text-sm font-bold text-text-primary">{ref_}</div>
      <div className="font-mono text-xs text-text-secondary">{nhs}</div>
    </div>
  );
}

function MedCell({ med, dose }: { med: string; dose: string }) {
  return (
    <div className="px-4 py-4">
      <div className="text-sm font-bold text-text-primary">{med}</div>
      <div className="text-xs text-text-secondary">{dose}</div>
    </div>
  );
}

// ---- New Orders -----------------------------------------------------------

function NewOrdersTab({ rows }: { rows: typeof NEW_ORDERS }) {
  const cols = "grid-cols-[1.1fr_1.4fr_1.5fr_1.6fr_auto_40px]";
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Eligibility</HeadCell>
        <HeadCell>Auto-Score</HeadCell>
        <HeadCell />
      </div>
      {rows.map((o) => (
        <Link
          key={o.ref}
          href={`/doctor/orders/${o.ref}`}
          className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 hover:bg-grey-100`}
        >
          <PatientCell ref_={o.ref} nhs={o.nhs} />
          <div className="px-4 py-4"><PharmacyLabel code={o.pharmacyCode} /></div>
          <MedCell med={o.med} dose={o.dose} />
          <div className="px-4 py-4 text-sm text-text-secondary">{o.eligibility}</div>
          <div className="px-4 py-4"><ScorePill score={o.score} /></div>
          <div className="px-4 py-4 text-text-disabled"><ChevronRight width={18} height={18} /></div>
        </Link>
      ))}
    </TableCard>
  );
}

// ---- Simple Repeats (batch) ----------------------------------------------

function SimpleRepeatsTab({
  rows,
  onSigned,
}: {
  rows: typeof SIMPLE_REPEATS;
  onSigned: (n: number) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(rows.map((r) => r.ref)));
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState(false);

  // keep selection valid when the pharmacy filter changes the row set
  const visibleRefs = useMemo(() => rows.map((r) => r.ref), [rows]);
  const selectedVisible = visibleRefs.filter((r) => selected.has(r));
  const allChecked = selectedVisible.length === visibleRefs.length && visibleRefs.length > 0;

  const toggle = (ref: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(ref)) n.delete(ref);
      else n.add(ref);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allChecked) visibleRefs.forEach((r) => n.delete(r));
      else visibleRefs.forEach((r) => n.add(r));
      return n;
    });

  const confirm = () => {
    const n = selectedVisible.length;
    setReviewing(false);
    setDone(true);
    onSigned(n);
  };

  const cols = "grid-cols-[44px_1.1fr_1.4fr_1.5fr_1.2fr_auto_40px]";

  if (done) {
    return (
      <div className="rounded-lg bg-background-paper p-12 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-lighter text-success-dark">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-text-primary">
          {selectedVisible.length} simple repeats approved & signed
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
          Each approval was scored Green against its pharmacy SOP and individually recorded to the audit trail (Rule 1.1 + 2.2).
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
        >
          Back to Simple Repeats
        </button>
      </div>
    );
  }

  return (
    <>
      {/* batch banner */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-success-lighter/60 px-5 py-4 ring-1 ring-success-light/40">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-text-primary">Batch approval — Green Simple Repeats</p>
            <p className="text-xs text-text-secondary">
              Every selected case scored Green against its pharmacy SOP — no manual review needed. {selectedVisible.length} of {visibleRefs.length} selected.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={selectedVisible.length === 0}
          onClick={() => setReviewing(true)}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
        >
          Review &amp; sign {selectedVisible.length} cases
        </button>
      </div>

      <TableCard>
        <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
          <div className="flex items-center justify-center py-3">
            <Checkbox checked={allChecked} onChange={toggleAll} />
          </div>
          <HeadCell>Patient</HeadCell>
          <HeadCell>Pharmacy</HeadCell>
          <HeadCell>Medication / Dose</HeadCell>
          <HeadCell>Last Review</HeadCell>
          <HeadCell>Auto-Score</HeadCell>
          <HeadCell />
        </div>
        {rows.map((r) => (
          <div
            key={r.ref}
            className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 hover:bg-grey-100`}
          >
            <div className="flex items-center justify-center py-4">
              <Checkbox checked={selected.has(r.ref)} onChange={() => toggle(r.ref)} />
            </div>
            <PatientCell ref_={r.ref} nhs={r.nhs} />
            <div className="px-4 py-4"><PharmacyLabel code={r.pharmacyCode} /></div>
            <MedCell med={r.med} dose={r.dose} />
            <div className="px-4 py-4 text-sm text-text-secondary">{r.lastReview}</div>
            <div className="px-4 py-4"><ScorePill score={r.score} /></div>
            <div className="px-4 py-4 text-text-disabled"><ChevronRight width={18} height={18} /></div>
          </div>
        ))}
      </TableCard>

      <Modal
        open={reviewing}
        title="Review & sign batch"
        subtitle={`${selectedVisible.length} Green simple repeats`}
        onClose={() => setReviewing(false)}
      >
        <p className="text-sm text-text-secondary">
          All {selectedVisible.length} selected repeats scored Green against their pharmacy SOP (Rule 1.1 eligibility + Rule 2.2 titration). Each approval is individually audit-logged.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setReviewing(false)}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Approve &amp; sign {selectedVisible.length}
          </button>
        </div>
      </Modal>
    </>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
        checked ? "border-primary bg-primary text-white" : "border-grey-400 bg-background-paper"
      }`}
    >
      {checked && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ---- Complex Repeats ------------------------------------------------------

function ComplexRepeatsTab({ rows }: { rows: typeof COMPLEX_CASES }) {
  const cols = "grid-cols-[1.1fr_1.4fr_1.5fr_1.6fr_auto_40px]";
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Flag Reason</HeadCell>
        <HeadCell>Auto-Score</HeadCell>
        <HeadCell />
      </div>
      {rows.map((c) => (
        <Link
          key={c.ref}
          href={`/doctor/cases/${c.ref}`}
          className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 hover:bg-grey-100`}
        >
          <PatientCell ref_={c.ref} nhs={c.nhs} />
          <div className="px-4 py-4"><PharmacyLabel code={c.pharmacyCode} /></div>
          <MedCell med={c.med} dose={c.dose} />
          <div className="flex items-center gap-2 px-4 py-4 text-sm text-text-primary">
            <WarnIcon width={18} height={18} className="shrink-0 text-warning" />
            {c.flagReason}
          </div>
          <div className="px-4 py-4"><ScorePill score={c.score} /></div>
          <div className="px-4 py-4 text-text-disabled"><ChevronRight width={18} height={18} /></div>
        </Link>
      ))}
    </TableCard>
  );
}

// ---- Escalated (read-only) ------------------------------------------------

function EscalatedTab({ rows }: { rows: typeof ESCALATIONS }) {
  const cols = "grid-cols-[1.1fr_1.4fr_1.5fr_1.6fr_auto_40px]";
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Escalation Reason</HeadCell>
        <HeadCell>Status</HeadCell>
        <HeadCell />
      </div>
      {rows.map((e, i) => (
        <div
          key={`${e.ref}-${i}`}
          className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0`}
        >
          <PatientCell ref_={e.ref} nhs={e.nhs} />
          <div className="px-4 py-4"><PharmacyLabel code={e.pharmacyCode} /></div>
          <MedCell med={e.med} dose={e.dose} />
          <div className="px-4 py-4 text-sm text-text-secondary">{e.reason}</div>
          <div className="px-4 py-4">
            <span className="text-sm font-bold text-warning-dark">{e.status}</span>
          </div>
          <div className="px-4 py-4 text-text-disabled"><ChevronRight width={18} height={18} /></div>
        </div>
      ))}
    </TableCard>
  );
}
