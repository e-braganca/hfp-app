"use client";

import { useState } from "react";
import { DoctorIdentity, DoctorStatusPill, MiniComplianceBar } from "@/components/admin/doctorBits";
import { Modal } from "@/components/ui/Modal";
import { Select, type SelectOption } from "@/components/ui/Select";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import { PlusIcon } from "@/components/ui/icons";
import { ADMIN_DOCTORS } from "@/lib/admin/data";
import {
  ACCESS_LABEL,
  QUEUE_BANDS,
  type AdminDoctor,
  type QueueAccess,
  type QueueBand,
} from "@/lib/admin/types";

/* ============================================================================
   Clinical team. Two things are managed here and nothing else: what a
   clinician is allowed to work, and whether their account is live.

   Access is two settings, not one. `granted` is the licence — the bands they
   were signed off for at invitation, only widened by an admin. `access` is
   what they're pulling today, and the dropdown can never offer more than the
   licence allows, so a Green-only clinician can't be handed reds by accident.

   Who is holding which case moved to Current Queue, where it belongs; this
   page no longer lists or reassigns cases.
   ============================================================================ */

const ACCESS_OPTIONS: QueueAccess[] = ["green", "amber", "red", "all"];

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>(ADMIN_DOCTORS);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDoctor | null>(null);
  const [deleting, setDeleting] = useState<AdminDoctor | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const patch = (name: string, next: Partial<AdminDoctor>) =>
    setDoctors((ds) => ds.map((d) => (d.name === name ? { ...d, ...next } : d)));

  const setAccess = (d: AdminDoctor, access: QueueAccess) => {
    patch(d.name, { access });
    setToast(`${d.name} now working ${ACCESS_LABEL[access].toLowerCase()} — audit-logged`);
  };

  const toggleSuspend = (d: AdminDoctor) => {
    const status = d.status === "suspended" ? "active" : "suspended";
    patch(d.name, { status });
    setToast(status === "suspended" ? `${d.name} suspended — audit-logged` : `${d.name} reactivated — audit-logged`);
  };

  const saveEdit = (name: string, granted: QueueBand[]) => {
    const d = doctors.find((x) => x.name === name)!;
    // a licence can shrink under the working band — pull `access` back with it
    const access: QueueAccess =
      d.access !== "all" && !granted.includes(d.access) ? (granted[0] ?? "green") : d.access;
    patch(name, { granted, access });
    setEditing(null);
    setToast(`Clearance updated for ${name} — audit-logged`);
  };

  const removeDoctor = (d: AdminDoctor) => {
    setDoctors((ds) => ds.filter((x) => x.name !== d.name));
    setDeleting(null);
    setToast(`${d.name} removed — access revoked, decisions stay on the audit trail`);
  };

  const addDoctor = (name: string, granted: QueueBand[]) => {
    const clean = name.trim();
    if (!clean) return;
    const full = clean.startsWith("Dr.") ? clean : `Dr. ${clean}`;
    const initials = full.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    setDoctors((ds) => [
      ...ds,
      {
        name: full, initials, gmc: "pending", pct: null,
        granted, access: granted.length === QUEUE_BANDS.length ? "all" : (granted[0] ?? "green"),
        status: "onboarding", online: false, lastSeen: "Never signed in", cases: [],
      },
    ]);
    setAddOpen(false);
    setToast(`Account provisioned — invitation & certification exam sent to ${full}`);
  };

  const cols = "grid-cols-[1.6fr_1.1fr_0.9fr_0.5fr_200px] [&>*]:min-w-0";

  return (
    <>
      <PageHeader title="Doctors" subtitle="Onboarding, permissions and performance across the clinical team" />

      <div className="px-6 py-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-background-paper shadow-card">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">Clinical team</h2>
              <p className="text-sm text-text-secondary">
                Queue access can never exceed the bands a clinician was signed off for at invitation
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

          {/* scrolls at its natural width below lg; fits the viewport from lg up */}
          <div className="overflow-x-auto lg:overflow-x-visible">
            <div className="min-w-[880px] lg:min-w-0">
              <div className={`grid ${cols} border-y border-[var(--divider)] bg-grey-100`}>
                {["Doctor", "Queue access", "Status", "SOP", "Actions"].map((h) => (
                  <div
                    key={h}
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary ${
                      h === "Actions" ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {doctors.map((d) => (
                <div key={d.name} className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0`}>
                  <div className="px-4 py-3">
                    <DoctorIdentity doctor={d} />
                  </div>

                  <div className="px-4 py-3">
                    <AccessSelect doctor={d} onChange={(a) => setAccess(d, a)} />
                  </div>

                  <div className="px-4 py-3">
                    <DoctorStatusPill status={d.status} />
                  </div>

                  <div className="px-4 py-3">
                    <MiniComplianceBar pct={d.pct} />
                  </div>

                  {/* actions pinned right, in every table */}
                  <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditing(d)}
                      className="whitespace-nowrap rounded-lg border border-[var(--divider)] px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-background-neutral"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSuspend(d)}
                      className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                        d.status === "suspended"
                          ? "border-success text-success-dark hover:bg-success-lighter"
                          : "border-error text-error hover:bg-error-lighter"
                      }`}
                    >
                      {d.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                    {/* removal only after suspension — you can't delete someone
                        who might be mid-case */}
                    {d.status === "suspended" && (
                      <button
                        type="button"
                        onClick={() => setDeleting(d)}
                        className="whitespace-nowrap rounded-lg bg-error px-2.5 py-1.5 text-xs font-bold text-white hover:bg-error-dark"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ClearanceModal
        open={addOpen}
        title="Add doctor"
        subtitle="They receive an invitation and the certification exam before their queue opens"
        confirmLabel="Send invitation"
        withName
        onClose={() => setAddOpen(false)}
        onSave={(name, granted) => addDoctor(name, granted)}
      />

      <ClearanceModal
        open={editing !== null}
        key={editing?.name}
        title={`Edit ${editing?.name ?? ""}`}
        subtitle="Bands this clinician is signed off to work"
        confirmLabel="Save clearance"
        initial={editing?.granted}
        onClose={() => setEditing(null)}
        onSave={(_, granted) => editing && saveEdit(editing.name, granted)}
      />

      <Modal
        open={deleting !== null}
        title="Remove this account?"
        subtitle={deleting?.name ?? ""}
        onClose={() => setDeleting(null)}
      >
        <p className="text-sm text-text-secondary">
          Access is revoked immediately. Every decision they signed stays on the audit trail under their name — removing
          the account never removes the record.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => deleting && removeDoctor(deleting)}
            className="rounded-lg bg-error px-4 py-2.5 text-sm font-bold text-white hover:bg-error-dark"
          >
            Remove account
          </button>
        </div>
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

/** Working band. Anything outside the licence is present but disabled, so the
 *  admin can see what would need widening rather than wondering why it's gone. */
function AccessSelect({ doctor, onChange }: { doctor: AdminDoctor; onChange: (a: QueueAccess) => void }) {
  const allowed = (o: QueueAccess) =>
    o === "all" ? doctor.granted.length > 1 : doctor.granted.includes(o as QueueBand);

  const dot = (o: QueueAccess) => (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
        o === "green" ? "bg-success" : o === "amber" ? "bg-warning" : o === "red" ? "bg-error" : "bg-primary"
      }`}
    />
  );

  const options: SelectOption[] = ACCESS_OPTIONS.map((o) => ({
    value: o,
    label: ACCESS_LABEL[o],
    hint: allowed(o) ? undefined : "Not granted at invitation",
    disabled: !allowed(o),
    leading: dot(o),
  }));

  return (
    <div>
      <Select
        value={doctor.access}
        options={options}
        disabled={doctor.status !== "active"}
        onChange={(v) => onChange(v as QueueAccess)}
      />
      <p className="mt-1 text-[11px] text-text-secondary">
        Granted: {doctor.granted.map((g) => g[0].toUpperCase() + g.slice(1)).join(" · ")}
      </p>
    </div>
  );
}

/** Shared by add and edit — the licence is the same decision either way. */
function ClearanceModal({
  open,
  title,
  subtitle,
  confirmLabel,
  withName = false,
  initial = ["green"],
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  confirmLabel: string;
  withName?: boolean;
  initial?: QueueBand[];
  onClose: () => void;
  onSave: (name: string, granted: QueueBand[]) => void;
}) {
  const [name, setName] = useState("");
  const [granted, setGranted] = useState<QueueBand[]>(initial);

  if (!open) return null;
  const toggle = (b: QueueBand) =>
    setGranted((g) => (g.includes(b) ? g.filter((x) => x !== b) : [...g, b]));
  const valid = granted.length > 0 && (!withName || name.trim().length > 1);

  return (
    <Modal open title={title} subtitle={subtitle} onClose={onClose}>
      {withName && (
        <label className="block">
          <span className="text-sm font-semibold text-text-primary">Full name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Amara Nwosu"
            className="mt-1.5 h-11 w-full rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      )}

      <p className={`text-sm font-semibold text-text-primary ${withName ? "mt-4" : ""}`}>
        Queue bands they may work
      </p>
      <p className="mt-0.5 text-xs text-text-secondary">
        Select every band this clinician is signed off for. They can be narrowed to one band day to day, never widened
        past this.
      </p>
      <div className="mt-3 space-y-2">
        {QUEUE_BANDS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => toggle(b)}
            className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
              granted.includes(b)
                ? "border-primary bg-primary-lighter"
                : "border-[var(--divider)] hover:border-primary-light"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                b === "green" ? "bg-success" : b === "amber" ? "bg-warning" : "bg-error"
              }`}
            />
            <span className="flex-1 text-sm font-semibold capitalize text-text-primary">{b}</span>
            <span className="text-xs text-text-secondary">
              {b === "green" ? "Routine, SOP-clean cases" : b === "amber" ? "Flagged, needs judgement" : "High risk, senior work"}
            </span>
          </button>
        ))}
      </div>
      {granted.length === 0 && (
        <p className="mt-2 text-xs font-semibold text-error-dark">Pick at least one band.</p>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => onSave(name, granted)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
