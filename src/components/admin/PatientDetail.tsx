"use client";

import { ConsultationAnswersCard } from "@/components/doctor/ConsultationAnswersCard";
import { PresenceDot } from "@/components/admin/doctorBits";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { RagPill } from "@/components/ui/StatusPill";
import { StatTile } from "@/components/ui/StatTile";
import { ADMIN_DOCTORS } from "@/lib/admin/data";
import { consultationFor } from "@/lib/doctor/consultation";
import { pharmacyName } from "@/lib/doctor/data";
import type { Patient } from "@/lib/doctor/types";
import { OUTCOME_META, PAST_REQUESTS } from "@/lib/shared/request-history";

/* ============================================================================
   One patient, end to end: who they are, what they're on, and every request
   the platform has decided for them. The point of the page is the last part —
   a name in a list tells you nothing, the history tells you whether this
   person has been escalated three times or sailed through.
   ============================================================================ */

const STATUS_PILL: Record<Patient["status"], { label: string; cls: string }> = {
  active: { label: "Active treatment", cls: "bg-success-lighter text-success-darker" },
  review: { label: "In review", cls: "bg-warning-lighter text-warning-darker" },
  paused: { label: "Paused", cls: "bg-grey-200 text-text-secondary" },
};

export function PatientDetail({ patient }: { patient: Patient }) {
  // one patient, many requests — keyed by patientRef, not by name
  const history = PAST_REQUESTS.filter((r) => r.patientRef === patient.ref);
  const approved = history.filter((r) => r.outcome === "approved").length;
  const flagged = history.filter((r) => r.outcome === "declined" || r.outcome === "escalated").length;
  const status = STATUS_PILL[patient.status];

  return (
    <div>
      <PageHeader title={patient.name} subtitle={`${patient.ref} · ${pharmacyName(patient.pharmacyCode)}`} />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <Breadcrumb backHref="/admin/patients" backLabel="Patients" trail={["Patients", patient.ref]} />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value={`${patient.bmi}`} label="BMI at last review" />
          <StatTile value={patient.dose} label={`Current dose · ${patient.med.split(" ")[0]}`} />
          <StatTile value={history.length} label="Requests on record" tone="muted" />
          <StatTile
            value={flagged}
            label={flagged === 0 ? "No declines or escalations" : "Declined or escalated"}
            tone={flagged === 0 ? "success" : "warning"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
          <div className="space-y-6">
            <section className="rounded-lg bg-background-paper p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-text-primary">{patient.name}</p>
                  <p className="font-mono text-xs text-text-secondary">{patient.ref}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${status.cls}`}>
                  {status.label}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4">
                <Field label="Age / Sex">
                  {patient.age} · {patient.sex}
                </Field>
                <Field label="BMI">{patient.bmi} kg/m²</Field>
                <Field label="Medication">{patient.med}</Field>
                <Field label="Dose">{patient.dose}</Field>
                <Field label="Pharmacy">{pharmacyName(patient.pharmacyCode)}</Field>
                <Field label="Last review">{patient.lastReview}</Field>
              </dl>
            </section>

            <ConsultationAnswersCard
              answers={consultationFor(patient.ref, {
                sexAtBirth: patient.sex,
                age: patient.age,
                bmi: patient.bmi,
              })}
            />
          </div>

          <section className="rounded-lg bg-background-paper shadow-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
              <h2 className="text-base font-bold text-text-primary">Request history</h2>
              <p className="text-sm text-text-secondary">
                {history.length === 0
                  ? "Nothing decided yet"
                  : `${history.length} decided · ${approved} approved`}
              </p>
            </div>

            {history.length === 0 ? (
              <p className="border-t border-[var(--divider)] px-5 py-10 text-center text-sm text-text-secondary">
                This patient has no decided requests on the platform yet.
              </p>
            ) : (
              <ol className="border-t border-[var(--divider)]">
                {history.map((r) => {
                  const meta = OUTCOME_META[r.outcome];
                  return (
                    <li key={r.ref} className="flex flex-wrap items-start gap-4 border-b border-[var(--divider)] px-5 py-4 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-text-primary">{r.ref}</span>
                          <span className="rounded-md bg-grey-200 px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                            {r.category}
                          </span>
                          <span className="font-mono text-[11px] text-text-secondary">{r.decidedOn}</span>
                        </p>
                        <p className="mt-1 text-sm font-semibold text-text-primary">
                          {r.med} · {r.dose}
                        </p>
                        {r.note && <p className="mt-0.5 text-sm italic text-text-secondary">{r.note}</p>}
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                          Decided by
                          <DoctorInline name={r.decidedBy} />
                          · SOP {r.sopVersion}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold ${meta.cls}`}>
                          {meta.label}
                        </span>
                        <RagPill rag={r.rag} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/** A clinician's name anywhere outside their own row still carries presence. */
function DoctorInline({ name }: { name: string }) {
  const d = ADMIN_DOCTORS.find((x) => x.name === name);
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-text-primary">
      {d && <PresenceDot online={d.online} className="h-2 w-2 ring-0" />}
      {name}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-text-primary">{children}</dd>
    </div>
  );
}
