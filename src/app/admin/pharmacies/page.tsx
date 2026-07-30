"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import { CheckIcon, ProtocolIcon, UploadIcon } from "@/components/ui/icons";
import { RAG_FILL, complianceRag } from "@/lib/doctor/rag";
import { ADMIN_PHARMACIES } from "@/lib/admin/data";
import type { AdminPharmacy, SopParams } from "@/lib/admin/types";

function bumpVersion(v: string): string {
  const m = v.match(/^v(\d+)\.(\d+)$/);
  if (!m) return v;
  return `v${m[1]}.${Number(m[2]) + 1}`;
}

export default function AdminPharmaciesPage() {
  const [uploadFor, setUploadFor] = useState<AdminPharmacy | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Pharmacies & SOPs" subtitle="Onboarding and the SOP lifecycle for the connected pharmacies" />

      <div className="px-6 py-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3 rounded-lg bg-success-lighter/60 px-5 py-3.5 text-sm text-text-primary ring-1 ring-success-light/40">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <CheckIcon width={14} height={14} />
          </span>
          Uploading a new SOP version never overwrites — every case is scored and audit-logged against the version active at decision time.
        </div>

        <div className="space-y-3">
          {ADMIN_PHARMACIES.map((p) => {
            const rag = complianceRag(p.compliance);
            return (
              <div key={p.code} className="flex flex-wrap items-center gap-4 rounded-lg bg-background-paper px-5 py-4 shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-lighter text-primary-dark">
                  <ProtocolIcon width={18} height={18} />
                </span>
                <div className="min-w-[160px]">
                  <p className="text-sm font-bold text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-secondary">{p.region}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="rounded-md bg-background-neutral px-2 py-1 font-mono font-bold text-text-primary">SOP {p.sopVersion}</span>
                  updated {p.sopUpdated}
                </div>
                <span className="rounded-full bg-background-neutral px-3 py-1 text-xs font-semibold text-text-secondary">
                  {p.ordersTotal} Orders Total
                </span>
                <div className="flex flex-1 items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-background-neutral">
                      <div className={`h-full rounded-full ${RAG_FILL[rag]}`} style={{ width: `${p.compliance}%` }} />
                    </div>
                    <span className="w-9 text-right font-mono text-sm font-bold text-text-primary">{p.compliance}%</span>
                  </div>
                  <Link
                    href={`/admin/protocols?ph=${p.code}`}
                    className="rounded-lg border border-[var(--divider)] px-3.5 py-2 text-sm font-semibold text-text-primary hover:bg-background-neutral"
                  >
                    View SOP
                  </Link>
                  <button
                    type="button"
                    onClick={() => setUploadFor(p)}
                    className="rounded-lg bg-primary-dark px-3.5 py-2 text-sm font-bold text-white hover:bg-primary-darker"
                  >
                    Upload new version
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {uploadFor && (
        <SopDrawer
          pharmacy={uploadFor}
          onClose={() => setUploadFor(null)}
          onActivate={(v) => {
            setToast(`SOP ${v} activated — new cases score against it, audit trail keyed to version`);
            setUploadFor(null);
          }}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

// ---- SOP upload pipeline drawer -------------------------------------------

const STEPS = ["Upload", "Configure", "Validate"] as const;

function SopDrawer({
  pharmacy,
  onClose,
  onActivate,
}: {
  pharmacy: AdminPharmacy;
  onClose: () => void;
  onActivate: (version: string) => void;
}) {
  const [step, setStep] = useState(0);
  const nextVersion = bumpVersion(pharmacy.sopVersion);
  const [params, setParams] = useState<SopParams>({
    bmiMin: 30,
    bmiComorbid: 27,
    gapWeeks: 6,
    maxMj: "15 mg",
    maxWg: "2.4 mg",
    reviewMonths: 6,
  });
  const fileName = `${pharmacy.name.split(" ")[0]}_SOP_${nextVersion}.pdf`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-primary-darker/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-background-paper shadow-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="border-b border-[var(--divider)] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Upload new version</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-text-secondary hover:bg-background-neutral">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-text-secondary">{pharmacy.name} · {pharmacy.sopVersion} → {nextVersion}</p>
          {/* stepper */}
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    i < step ? "bg-success text-white" : i === step ? "bg-primary text-white" : "bg-background-neutral text-text-disabled"
                  }`}
                >
                  {i < step ? <CheckIcon width={14} height={14} /> : i + 1}
                </span>
                <span className={`text-xs font-semibold ${i === step ? "text-text-primary" : "text-text-secondary"}`}>{s}</span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-[var(--divider)]" />}
              </div>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div>
              <p className="text-sm font-semibold text-text-primary">Current file</p>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-[var(--divider)] px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-error-lighter text-error-dark text-[10px] font-bold">PDF</span>
                <span className="text-sm text-text-primary">{pharmacy.name.split(" ")[0]}-SOP-{pharmacy.sopVersion}.pdf</span>
              </div>
              <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--divider)] px-4 py-10 text-center">
                <UploadIcon className="text-text-disabled" />
                <p className="text-sm font-semibold text-text-primary">Drop the new SOP PDF here</p>
                <p className="text-xs text-text-secondary">{fileName} · 14 pages · uploaded just now · READY</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm font-bold text-text-primary">Per-pharmacy parameters</p>
              <p className="text-xs text-text-secondary">
                Parsed &amp; embedded — 182 chunks → pgvector · {nextVersion} recorded. Adjust before validation.
              </p>
              <div className="mt-4 space-y-4">
                <ParamRow label="BMI threshold (≥)">
                  <NumInput value={params.bmiMin} onChange={(v) => setParams((p) => ({ ...p, bmiMin: v }))} />
                </ParamRow>
                <ParamRow label="BMI threshold with qualifying comorbidity (≥)">
                  <NumInput value={params.bmiComorbid} onChange={(v) => setParams((p) => ({ ...p, bmiComorbid: v }))} />
                </ParamRow>
                <ParamRow label="Treatment-gap re-titration limit (weeks)">
                  <NumInput value={params.gapWeeks} onChange={(v) => setParams((p) => ({ ...p, gapWeeks: v }))} />
                </ParamRow>
                <ParamRow label="Max Mounjaro">
                  <TextInput value={params.maxMj} onChange={(v) => setParams((p) => ({ ...p, maxMj: v }))} />
                </ParamRow>
                <ParamRow label="Max Wegovy">
                  <TextInput value={params.maxWg} onChange={(v) => setParams((p) => ({ ...p, maxWg: v }))} />
                </ParamRow>
                <ParamRow label="Continuation review (months)">
                  <NumInput value={params.reviewMonths} onChange={(v) => setParams((p) => ({ ...p, reviewMonths: v }))} />
                </ParamRow>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 rounded-lg bg-success-lighter px-4 py-3 text-sm font-semibold text-success-darker">
                <CheckIcon width={18} height={18} />
                Validation passed — 12 / 12 sample cases
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  `Eligibility thresholds — BMI ≥ ${params.bmiMin} (≥ ${params.bmiComorbid} with comorbidity)`,
                  `Treatment-gap re-titration — gap > ${params.gapWeeks} weeks`,
                  `Max-dose guard — Mounjaro ${params.maxMj} · Wegovy ${params.maxWg}`,
                ].map((c) => (
                  <li key={c} className="flex gap-3 text-sm text-text-primary">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-lighter text-success-dark">
                      <CheckIcon width={13} height={13} />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-text-secondary">
                Activating keeps prior versions intact — historical cases stay scored against the version active at their decision time.
              </p>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--divider)] px-6 py-4">
          <button
            type="button"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <button
            type="button"
            onClick={() => (step < 2 ? setStep((s) => s + 1) : onActivate(nextVersion))}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            {step === 0 ? "Parse & embed document" : step === 1 ? "Validate configuration" : `Activate ${nextVersion}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ParamRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-11 w-24 rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
    />
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-32 rounded-lg border border-[var(--divider)] px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
    />
  );
}
