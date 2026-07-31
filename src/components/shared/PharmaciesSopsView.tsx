"use client";

import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import { CheckIcon, ProtocolIcon } from "@/components/ui/icons";
import { SopUploadDrawer } from "@/components/admin/SopUploadDrawer";
import { RAG_FILL, complianceRag } from "@/lib/doctor/rag";
import { PHARMACIES, protocolFor } from "@/lib/doctor/data";
import { ADMIN_PHARMACIES } from "@/lib/admin/data";
import {
  getApplicationsServerSnapshot,
  getApplicationsSnapshot,
  removeApplication,
  subscribeApplications,
  type PharmacyApplication,
} from "@/lib/pharmacy-applications";
import type { Pharmacy, SopRule } from "@/lib/doctor/types";

/** Unique 2-letter code for a newly approved partner, e.g. "Boots Online" → BO. */
function deriveCode(business: string, taken: string[]): string {
  const words = business.replace(/[^a-zA-Z ]/g, "").split(/\s+/).filter(Boolean);
  let code = ((words[0]?.[0] ?? "P") + (words[1]?.[0] ?? words[0]?.[1] ?? "X")).toUpperCase();
  let i = 2;
  while (taken.includes(code)) code = code[0] + String(i++);
  return code;
}

/* ============================================================================
   Pharmacies & SOPs — one page: pharmacy list on the left, the selected
   pharmacy's details + SOP on the right. Shared by doctor (read-only) and
   admin (editable: pharmacy details, individual rules, SOP version upload).
   All edits are local demo state; production routes them through the SOP
   pipeline so every change is versioned and audit-logged.
   ============================================================================ */

export function PharmaciesSopsView({ editable = false }: { editable?: boolean }) {
  const params = useSearchParams();
  const initial = params.get("ph");
  const validInitial = PHARMACIES.some((p) => p.code === initial) ? initial! : PHARMACIES[0].code;

  const [selected, setSelected] = useState(validInitial);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(PHARMACIES);
  // editable copies of each pharmacy's rules, created on first edit
  const [ruleEdits, setRuleEdits] = useState<Record<string, SopRule[]>>({});
  const [editingRule, setEditingRule] = useState<string | null>(null); // rule number
  const [draftText, setDraftText] = useState("");
  const [editingDetails, setEditingDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // partner applications from /pharmacies/register (localStorage-backed store;
  // useSyncExternalStore keeps SSR markup stable and re-renders on mutation)
  const applications = useSyncExternalStore(
    subscribeApplications,
    getApplicationsSnapshot,
    getApplicationsServerSnapshot,
  );
  // codes approved this session: their SOP is uploaded but not yet parsed
  const [pendingSop, setPendingSop] = useState<Record<string, string>>({});

  const approve = (app: PharmacyApplication) => {
    const code = deriveCode(app.business, pharmacies.map((p) => p.code));
    const postcode = app.address.trim().split(/\s+/).slice(-2).join(" ");
    setPharmacies((ps) => [
      ...ps,
      {
        code,
        name: app.business,
        region: app.coverage[0] ?? "UK",
        postcode: /\d/.test(postcode) ? postcode : "—",
        ordersToday: 0,
        compliance: 100,
        sopVersion: "v1.0",
        sopUpdated: "today",
        connected: true,
      },
    ]);
    setPendingSop((m) => ({ ...m, [code]: app.sopFileName }));
    removeApplication(app.id);
    setSelected(code);
    setToast(`${app.business} approved — live as ${code}, SOP v1.0 queued for parsing`);
  };

  const decline = (app: PharmacyApplication) => {
    removeApplication(app.id);
    setToast(`${app.business} declined — ${app.responsibleEmail} will be notified`);
  };

  const pharmacy = pharmacies.find((p) => p.code === selected)!;
  const sopPending = pendingSop[selected];
  const protocol = protocolFor(selected);
  const rules = sopPending ? [] : (ruleEdits[selected] ?? protocol.rules);

  const saveRule = (n: string) => {
    setRuleEdits((re) => ({
      ...re,
      [selected]: rules.map((r) => (r.n === n ? { ...r, text: draftText } : r)),
    }));
    setEditingRule(null);
    setToast(`Rule ${n} updated — draft; publishing bumps the SOP version and re-runs validation`);
  };

  const saveDetails = (patch: Partial<Pharmacy>) => {
    setPharmacies((ps) => ps.map((p) => (p.code === selected ? { ...p, ...patch } : p)));
    setEditingDetails(false);
    setToast(`${patch.name ?? pharmacy.name} — details updated`);
  };

  return (
    <>
      <PageHeader
        title="Pharmacies & SOPs"
        subtitle={
          editable
            ? "Connected pharmacies, their details and the SOP lifecycle"
            : "The connected pharmacies and the clinical rulebooks read on every case"
        }
      />

      <div className="px-6 py-6 lg:px-8">
        {editable && (
          <div className="mb-5 flex items-center gap-3 rounded-lg bg-success-lighter/60 px-5 py-3.5 text-sm text-text-primary ring-1 ring-success-light/40">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <CheckIcon width={14} height={14} />
            </span>
            Edits never overwrite history — every case stays scored and audit-logged against the SOP version active at
            decision time.
          </div>
        )}

        {/* pending partner applications (admin) */}
        {editable && applications.length > 0 && (
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
              Pending applications
              <span className="rounded-full bg-warning-lighter px-2 py-0.5 text-[11px] font-extrabold text-warning-dark">
                {applications.length}
              </span>
            </h2>
            <div className="mt-3 space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="rounded-lg border-2 border-warning/50 bg-background-paper p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-extrabold text-text-primary">{app.business}</p>
                      <p className="text-sm text-text-secondary">
                        {app.responsibleName} · {app.responsibleEmail} · {app.phone}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-text-secondary">{app.id} · {app.submittedAt}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p className="text-text-secondary">
                      <span className="font-bold text-text-primary">Address · </span>
                      {app.address.replace(/\n/g, ", ")}
                    </p>
                    <p className="text-text-secondary">
                      <span className="font-bold text-text-primary">Coverage · </span>
                      {app.coverage.join(", ")}
                    </p>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {app.meds.map((m) => (
                      <span key={m} className="rounded-full bg-primary-lighter px-2.5 py-1 text-[11px] font-bold text-primary-dark">{m}</span>
                    ))}
                    <span className="ml-1 flex items-center gap-1.5 text-xs text-text-secondary">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-error-lighter text-[8px] font-bold text-error-dark">PDF</span>
                      {app.sopFileName}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => approve(app)}
                      className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
                    >
                      Approve &amp; onboard
                    </button>
                    <button
                      type="button"
                      onClick={() => decline(app)}
                      className="rounded-lg border border-error px-4 py-2.5 text-sm font-bold text-error hover:bg-error-lighter"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* pharmacy list */}
          <div className="self-start rounded-lg bg-background-paper p-2 shadow-card">
            {pharmacies.map((p) => {
              const active = p.code === selected;
              const pRag = complianceRag(p.compliance);
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setSelected(p.code)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors last:mb-0 ${
                    active ? "bg-primary-lighter" : "hover:bg-background-neutral"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active ? "bg-primary text-white" : "bg-background-neutral text-text-secondary"
                    }`}
                  >
                    <ProtocolIcon width={16} height={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text-primary">{p.name}</span>
                    <span className="block truncate text-xs text-text-secondary">
                      {p.region} · SOP {p.sopVersion}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-xs font-bold text-text-primary">{p.compliance}%</span>
                    <span className="h-1.5 w-12 overflow-hidden rounded-full bg-background-neutral">
                      <span className={`block h-full rounded-full ${RAG_FILL[pRag]}`} style={{ width: `${p.compliance}%` }} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* detail panel */}
          <div className="rounded-lg bg-background-paper p-6 shadow-card">
            {/* header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--divider)] pb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{pharmacy.name}</h2>
                <p className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-success-dark">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Connected · SOP {pharmacy.sopVersion} · updated {pharmacy.sopUpdated}
                </p>
              </div>
              {editable && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDetails(true)}
                    className="rounded-lg border border-[var(--divider)] px-3.5 py-2 text-sm font-semibold text-text-primary hover:bg-background-neutral"
                  >
                    Edit details
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploading(true)}
                    className="rounded-lg bg-primary-dark px-3.5 py-2 text-sm font-bold text-white hover:bg-primary-darker"
                  >
                    Upload new SOP version
                  </button>
                </div>
              )}
            </div>

            {/* pharmacy details strip */}
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--divider)] sm:grid-cols-4">
              {(
                [
                  ["Region", `${pharmacy.region} · ${pharmacy.postcode}`],
                  ["Orders today", String(pharmacy.ordersToday)],
                  ["SOP compliance", `${pharmacy.compliance}%`],
                  ["Document", sopPending ? "parsing…" : `${protocol.pages} pages`],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="bg-background-paper p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{k}</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-text-primary">{v}</p>
                </div>
              ))}
            </div>

            {/* rules */}
            <h3 className="mt-6 text-sm font-extrabold text-text-primary">SOP rules</h3>
            {sopPending && (
              <div className="mt-3 rounded-xl border border-dashed border-[var(--divider)] px-5 py-8 text-center">
                <p className="text-sm font-bold text-text-primary">{sopPending} uploaded with the application</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
                  Parsing and rule extraction run next — configure thresholds with the partner, validate against sample
                  cases, then the rules appear here.
                </p>
              </div>
            )}
            <ol className="mt-1">
              {rules.map((r) => (
                <li key={r.n} className="group flex gap-4 border-b border-[var(--divider)] py-4 last:border-0">
                  <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-primary-lighter font-mono text-xs font-bold text-primary-dark">
                    {r.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-text-primary">
                      {r.title}
                      {r.flag && (
                        <span className="ml-2 rounded-full bg-warning-lighter px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-darker">
                          Flagged inline
                        </span>
                      )}
                    </p>
                    {editingRule === r.n ? (
                      <div className="mt-2">
                        <textarea
                          rows={3}
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          className="w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            disabled={draftText.trim().length === 0}
                            onClick={() => saveRule(r.n)}
                            className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-40"
                          >
                            Save rule
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRule(null)}
                            className="rounded-lg border border-[var(--divider)] px-3.5 py-2 text-xs font-bold text-text-primary hover:bg-background-neutral"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{r.text}</p>
                    )}
                  </div>
                  {editable && editingRule !== r.n && (
                    <button
                      type="button"
                      aria-label={`Edit rule ${r.n}`}
                      onClick={() => {
                        setEditingRule(r.n);
                        setDraftText(r.text);
                      }}
                      className="h-8 w-8 shrink-0 rounded-lg text-text-disabled opacity-0 transition-opacity hover:bg-background-neutral hover:text-text-primary focus:opacity-100 group-hover:opacity-100"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mx-auto">
                        <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <path d="m14.5 7.5 3 3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ol>

            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark"
            >
              <ProtocolIcon width={16} height={16} />
              View complete document
            </button>
          </div>
        </div>
      </div>

      {/* edit pharmacy details (admin) */}
      <EditDetailsModal
        open={editingDetails}
        pharmacy={pharmacy}
        onClose={() => setEditingDetails(false)}
        onSave={saveDetails}
      />

      {/* SOP upload pipeline (admin) */}
      {uploading && (
        <SopUploadDrawer
          pharmacy={{
            code: pharmacy.code,
            name: pharmacy.name,
            region: pharmacy.region,
            sopVersion: pharmacy.sopVersion,
            sopUpdated: pharmacy.sopUpdated,
            ordersTotal: ADMIN_PHARMACIES.find((p) => p.code === selected)?.ordersTotal ?? 0,
            compliance: pharmacy.compliance,
          }}
          onClose={() => setUploading(false)}
          onActivate={(v) => {
            setPharmacies((ps) => ps.map((p) => (p.code === selected ? { ...p, sopVersion: v } : p)));
            setUploading(false);
            setToast(`SOP ${v} activated — new cases score against it, audit trail keyed to version`);
          }}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

function EditDetailsModal({
  open,
  pharmacy,
  onClose,
  onSave,
}: {
  open: boolean;
  pharmacy: Pharmacy;
  onClose: () => void;
  onSave: (patch: Partial<Pharmacy>) => void;
}) {
  const [name, setName] = useState(pharmacy.name);
  const [region, setRegion] = useState(pharmacy.region);
  const [postcode, setPostcode] = useState(pharmacy.postcode);
  // re-seed the form when it opens for a different pharmacy
  const [seededFor, setSeededFor] = useState(pharmacy.code);
  if (seededFor !== pharmacy.code) {
    setSeededFor(pharmacy.code);
    setName(pharmacy.name);
    setRegion(pharmacy.region);
    setPostcode(pharmacy.postcode);
  }

  const inputCls =
    "h-11 w-full rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24";

  return (
    <Modal open={open} title="Edit pharmacy details" subtitle={pharmacy.code} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${inputCls}`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Region</span>
            <input value={region} onChange={(e) => setRegion(e.target.value)} className={`mt-1.5 ${inputCls}`} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Postcode</span>
            <input value={postcode} onChange={(e) => setPostcode(e.target.value)} className={`mt-1.5 ${inputCls}`} />
          </label>
        </div>
        <p className="text-xs text-text-secondary">
          Contract, GPhC registration and dispatch integration are managed in onboarding — not editable here.
        </p>
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
          disabled={name.trim().length === 0}
          onClick={() => onSave({ name: name.trim(), region: region.trim(), postcode: postcode.trim() })}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
        >
          Save details
        </button>
      </div>
    </Modal>
  );
}
