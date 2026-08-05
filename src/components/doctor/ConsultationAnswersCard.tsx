"use client";

import { useState } from "react";
import { SAFETY_ASKED, type ConsultationAnswers } from "@/lib/doctor/consultation";

/**
 * The patient's own answers, as given at onboarding. Collapsed by default —
 * the AI card is the working surface and this is what you open when you want
 * to check its homework, so it shouldn't compete for the first read.
 */
export function ConsultationAnswersCard({
  answers,
  defaultOpen = false,
}: {
  answers: ConsultationAnswers;
  /** open where it's the main content, closed where the AI card leads */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-lg bg-background-paper shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-background-neutral/60"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-text-primary">Consultation answers</span>
          <span className="block text-xs text-text-secondary">
            What the patient told us at onboarding · submitted {answers.submittedAt}
          </span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-text-secondary transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[var(--divider)] px-5 py-4">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Row label="Sex at birth">{answers.sexAtBirth}</Row>
            <Row label="Age">{answers.age}</Row>
            <Row label="Height / weight">
              {answers.heightCm} cm · {answers.weightKg} kg
            </Row>
            <Row label="BMI at assessment">
              {answers.bmi.toFixed(1)} kg/m²{" "}
              <span className="font-normal text-text-secondary">
                (threshold {answers.bmiThreshold})
              </span>
            </Row>
            <Row label="Ethnic background">{answers.ethnicity}</Row>
            <Row label="Conditions declared">
              {answers.conditions.length ? answers.conditions.join(", ") : "None"}
            </Row>
            <Row label="Current medication">{answers.medsAnswer}</Row>
            <Row label="Treatment preference">{answers.treatmentPreference}</Row>
          </dl>

          {answers.glp1 && (
            <div className="mt-4 rounded-lg bg-warning-lighter px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-warning-darker">
                Already on a GLP-1 at assessment
              </p>
              <p className="mt-1 text-sm text-text-primary">
                {answers.glp1.product} {answers.glp1.dose} · started {answers.glp1.startedOn} · last dose{" "}
                {answers.glp1.lastDoseOn}
              </p>
              <p className="text-sm text-text-secondary">Side effects: {answers.glp1.sideEffects}</p>
            </div>
          )}

          {answers.otherMeds && answers.otherMeds.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Other medication declared
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {answers.otherMeds.map((m) => (
                  <span key={m} className="rounded-md bg-background-neutral px-2.5 py-1 text-xs font-semibold text-text-primary">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-[var(--divider)] pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Safety screening — all answered No
            </p>
            <ul className="mt-1.5 space-y-1">
              {SAFETY_ASKED.map((q) => (
                <li key={q} className="flex gap-2 text-xs leading-relaxed text-text-secondary">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 text-xs text-text-secondary">
            Verification: {answers.verification.weightPhoto} weight photo · {answers.verification.idDocument}
          </p>
        </div>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-text-primary">{children}</dd>
    </div>
  );
}
