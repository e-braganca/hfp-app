import { pharmacyName } from "@/lib/doctor/data";
import type { ReactNode } from "react";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{children}</p>
    </div>
  );
}

/** Left-column patient identity + vitals card, shared by order & case detail. */
export function PatientSummaryCard({
  ref_,
  nhs,
  age,
  sex,
  bmi,
  ethnicity,
  pharmacyCode,
  comorbidities,
  pill,
}: {
  ref_: string;
  nhs: string;
  age: number;
  sex: string;
  bmi: number;
  ethnicity: string;
  pharmacyCode: string;
  comorbidities: string[];
  pill: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-background-paper p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold text-text-primary">{ref_}</p>
          <p className="font-mono text-xs text-text-secondary">NHS {nhs}</p>
        </div>
        {pill}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <Field label="Age / Sex">{age} · {sex}</Field>
        <Field label="BMI">{bmi} kg/m²</Field>
        <Field label="Ethnicity">{ethnicity}</Field>
        <Field label="Pharmacy">{pharmacyName(pharmacyCode)}</Field>
      </div>

      <div className="mt-5 border-t border-[var(--divider)] pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Comorbidity</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {comorbidities.length === 0 ? (
            <span className="text-sm text-text-disabled">None on record</span>
          ) : (
            comorbidities.map((c) => (
              <span key={c} className="rounded-md bg-background-neutral px-2.5 py-1 text-xs font-semibold text-text-primary">
                {c}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
