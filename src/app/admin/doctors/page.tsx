"use client";

import { useState } from "react";
import {
  CaseCategoryPill,
  DoctorIdentity,
  DoctorStatusPill,
  PresencePill,
  MiniComplianceBar,
  QueueAccessBadge,
  WorkingOn,
} from "@/components/admin/doctorBits";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RagPill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";
import { ChevronDown, GripIcon, PlusIcon } from "@/components/ui/icons";
import { ADMIN_DOCTORS } from "@/lib/admin/data";
import type { AdminDoctor, AssignedCase } from "@/lib/admin/types";

interface Dragged {
  case_: AssignedCase;
  from: string;
}
interface Reassign {
  case_: AssignedCase;
  from: string;
  to: string;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>(ADMIN_DOCTORS);
  const [expanded, setExpanded] = useState<string | null>(ADMIN_DOCTORS[0].name);
  const [dragged, setDragged] = useState<Dragged | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [reassign, setReassign] = useState<Reassign | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const toggleFilter = (name: string) =>
    setDoctors((ds) =>
      ds.map((d) => {
        if (d.name !== name) return d;
        const filter = d.filter === "green" ? "full" : "green";
        setToast(`Permissions updated — ${name} · audit-logged`);
        return { ...d, filter };
      }),
    );

  const toggleSuspend = (name: string) =>
    setDoctors((ds) =>
      ds.map((d) => {
        if (d.name !== name) return d;
        const status = d.status === "suspended" ? "active" : "suspended";
        setToast(status === "suspended" ? `${name} suspended — audit-logged` : `${name} reactivated — audit-logged`);
        return { ...d, status };
      }),
    );

  const tryDrop = (to: string) => {
    setDropTarget(null);
    if (!dragged || dragged.from === to) return;
    const target = doctors.find((d) => d.name === to)!;
    if (target.status === "onboarding") {
      setToast(`Cannot reassign to ${to} — certification still pending`);
      setDragged(null);
      return;
    }
    if (target.status === "suspended") {
      setToast(`Cannot reassign to ${to} — account suspended`);
      setDragged(null);
      return;
    }
    setReassign({ case_: dragged.case_, from: dragged.from, to });
    setDragged(null);
  };

  const confirmReassign = () => {
    if (!reassign) return;
    setDoctors((ds) =>
      ds.map((d) => {
        if (d.name === reassign.from) return { ...d, cases: d.cases.filter((c) => c.ref !== reassign.case_.ref) };
        if (d.name === reassign.to) return { ...d, cases: [...d.cases, reassign.case_] };
        return d;
      }),
    );
    setToast(`${reassign.case_.ref} reassigned to ${reassign.to} — both queues updated, audit-logged`);
    setReassign(null);
  };

  const addDoctor = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const full = clean.startsWith("Dr.") ? clean : `Dr. ${clean}`;
    const initials = full.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    setDoctors((ds) => [...ds, { name: full, initials, gmc: "pending", pct: null, filter: "green", status: "onboarding", online: false, lastSeen: "Never signed in", cases: [] }]);
    setAddOpen(false);
    setToast(`Account provisioned — invitation & certification exam sent to ${full}`);
  };

  const cols = "grid-cols-[32px_1.5fr_0.7fr_0.9fr_1fr_1fr_1.1fr]";
  const reassignWarn = reassign && doctors.find((d) => d.name === reassign.to)?.filter === "green" && reassign.case_.rag !== "green";

  return (
    <>
      <PageHeader title="Doctors" subtitle="Onboarding, permissions and performance across the clinical team" />

      <div className="px-6 py-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-background-paper shadow-card">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">Clinical team</h2>
              <p className="text-sm text-text-secondary">
                New doctors start Green-only until certified performance allows the full queue
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-dark px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-darker"
            >
              <PlusIcon width={16} height={16} />
              Add doctor
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className={`grid ${cols} border-y border-[var(--divider)] bg-grey-100`}>
                <div />
                {["Doctor", "Presence", "Queue Access", "Working On", "SOP Compliance", "Actions"].map((h) => (
                  <div key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">{h}</div>
                ))}
              </div>

              {doctors.map((d) => {
                const isOpen = expanded === d.name;
                const isDropTarget = dropTarget === d.name && dragged?.from !== d.name;
                return (
                  <div key={d.name}>
                    <div
                      onDragOver={(e) => {
                        if (dragged) { e.preventDefault(); setDropTarget(d.name); }
                      }}
                      onDragLeave={() => setDropTarget((t) => (t === d.name ? null : t))}
                      onDrop={() => tryDrop(d.name)}
                      className={`grid ${cols} items-center border-b border-[var(--divider)] ${
                        isDropTarget ? "bg-primary-lighter ring-2 ring-inset ring-primary" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : d.name)}
                        className="flex h-full items-center justify-center text-text-disabled hover:text-text-primary"
                        aria-label={isOpen ? "Collapse" : "Expand"}
                      >
                        <ChevronDown width={18} height={18} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                        <DoctorIdentity doctor={d} />
                        {d.status !== "active" && <DoctorStatusPill status={d.status} />}
                      </div>
                      <div className="px-4 py-3"><PresencePill online={d.online} lastSeen={d.lastSeen} /></div>
                      <div className="px-4 py-3"><QueueAccessBadge filter={d.filter} /></div>
                      <div className="px-4 py-3"><WorkingOn cases={d.cases} /></div>
                      <div className="px-4 py-3"><MiniComplianceBar pct={d.pct} /></div>
                      <div className="px-4 py-3">
                        {d.status === "onboarding" ? (
                          <span className="text-xs text-text-disabled">Awaiting exam</span>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => toggleFilter(d.name)}
                              className="rounded-lg border border-[var(--divider)] px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-background-neutral"
                            >
                              {d.filter === "green" ? "Allow full queue" : "Set Green-only"}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSuspend(d.name)}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                                d.status === "suspended"
                                  ? "border-success text-success-dark hover:bg-success-lighter"
                                  : "border-error text-error hover:bg-error-lighter"
                              }`}
                            >
                              {d.status === "suspended" ? "Reactivate" : "Suspend"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-b border-[var(--divider)] bg-grey-100 px-6 py-4">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                          Assigned cases · {d.cases.length} — drag a case onto another doctor to reassign
                        </p>
                        {d.cases.length === 0 ? (
                          <p className="text-sm text-text-disabled">No cases assigned.</p>
                        ) : (
                          <div className="space-y-2">
                            {d.cases.map((c) => (
                              <div
                                key={c.ref}
                                draggable
                                onDragStart={() => setDragged({ case_: c, from: d.name })}
                                onDragEnd={() => { setDragged(null); setDropTarget(null); }}
                                className="flex cursor-grab items-center gap-3 rounded-lg bg-background-paper px-3 py-2.5 shadow-z1 active:cursor-grabbing"
                              >
                                <GripIcon width={16} height={16} className="shrink-0 text-text-disabled" />
                                <span className="font-mono text-sm font-bold text-text-primary">{c.ref}</span>
                                <span className="flex-1 text-sm text-text-secondary">{c.med} · {c.dose}</span>
                                <CaseCategoryPill cat={c.cat} />
                                <RagPill rag={c.rag} />
                                <span className="hidden text-sm text-text-secondary sm:inline">{c.pharmacy}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* reassign modal */}
      <Modal
        open={reassign !== null}
        title="Reassign case"
        subtitle={reassign?.case_.ref ?? ""}
        onClose={() => setReassign(null)}
      >
        {reassign && (
          <>
            <div className="rounded-lg bg-background-neutral px-4 py-3">
              <p className="font-mono text-sm font-bold text-text-primary">{reassign.case_.ref}</p>
              <p className="text-sm text-text-secondary">{reassign.case_.med} · {reassign.case_.dose}</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <div className="flex-1 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">From</p>
                <p className="mt-1 font-semibold text-text-primary">{reassign.from}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-text-disabled">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex-1 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">To</p>
                <p className="mt-1 font-semibold text-text-primary">{reassign.to}</p>
              </div>
            </div>
            {reassignWarn && (
              <div className="mt-4 rounded-lg bg-warning-lighter px-3 py-2.5 text-sm text-warning-darker">
                {reassign.to} is Green-only — this {reassign.case_.rag} case sits outside their current filter. Confirming overrides it and is audit-logged.
              </div>
            )}
            <p className="mt-4 text-xs text-text-secondary">
              The reassignment and both queue changes are recorded to the audit trail.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReassign(null)}
                className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReassign}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
              >
                Confirm reassignment
              </button>
            </div>
          </>
        )}
      </Modal>

      <AddDoctorModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addDoctor} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

function AddDoctorModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Modal open={open} title="Add doctor" subtitle="Provision a new clinical account" onClose={onClose}>
      <label className="block text-sm font-semibold text-text-primary">Full name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dr. Jane Smith"
        className="mt-1.5 h-11 w-full rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
      />
      <label className="mt-4 block text-sm font-semibold text-text-primary">Email</label>
      <input
        type="email"
        placeholder="jane.smith@hfp.co.uk"
        className="mt-1.5 h-11 w-full rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
      />
      <div className="mt-4 rounded-lg bg-warning-lighter px-3 py-2.5 text-sm text-warning-darker">
        New doctors start Green-only after passing the certification exam. Full-queue access is granted once certified.
      </div>
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
          onClick={() => onAdd(name)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
        >
          Provision account
        </button>
      </div>
    </Modal>
  );
}
