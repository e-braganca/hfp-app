"use client";

import { useState } from "react";
import { ethnicityAsAsked, type ConsultationAnswers } from "@/lib/doctor/consultation";
import { SAFETY_QUESTIONS } from "@/lib/onboarding/constants";

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
          <span className="block text-sm font-bold text-text-primary">Patient answers</span>
          <span className="block text-xs text-text-secondary">
            What the patient told us at onboarding · {answers.submittedAt}
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
          <ConsultationAnswersBody answers={answers} />
        </div>
      )}
    </section>
  );
}

/**
 * The answers themselves, with no card around them.
 *
 * Laid out as the patient met them, not as a clinical summary: the safety
 * screening shows the Yes/No control with their answer selected rather than a
 * tidy "all clear" line. A prescriber checking the AI's homework needs to see
 * that the question was put and what came back — a summary is the thing being
 * checked, so it can't also be the evidence.
 *
 * Everything here reaching a prescriber answered No to all five, because a Yes
 * is a hard block at onboarding. Showing them anyway is the point: it proves
 * they were asked.
 */
export function ConsultationAnswersBody({ answers }: { answers: ConsultationAnswers }) {
  return (
    <>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Row label="Sex at birth">{answers.sexAtBirth}</Row>
        <Row label="Age">{answers.age}</Row>
        <Row label="Height / weight">
          {answers.heightCm.toFixed(1)} cm · {answers.weightKg.toFixed(1)} kg
        </Row>
        <Row label="BMI at assessment">
          {answers.bmi.toFixed(1)} kg/m²
          <span className="mt-0.5 block text-sm font-normal text-text-secondary">
            (threshold {answers.bmiThreshold.toFixed(1)})
          </span>
        </Row>
        <div className="sm:col-span-2">
          <Row label="Ethnic background">{ethnicityAsAsked(answers.ethnicity)}</Row>
        </div>
      </dl>

      <Section label={answers.conditions.length === 1 ? "Condition declared" : "Conditions declared"}>
        {answers.conditions.length ? (
          <Chips items={answers.conditions} />
        ) : (
          <Chips items={["None"]} />
        )}
      </Section>

      <Section label="Current medication">
        <Chips items={answers.otherMeds?.length ? answers.otherMeds : [answers.medsAnswer]} />
      </Section>

      <Section label="Treatment preference">
        <p className="text-base font-bold text-text-primary">{brandOnly(answers.treatmentPreference)}</p>
      </Section>

      {answers.glp1 && (
        <Section label="Already on a GLP-1 at assessment">
          <p className="text-sm text-text-primary">
            {answers.glp1.product} {answers.glp1.dose} · started {answers.glp1.startedOn} · last dose{" "}
            {answers.glp1.lastDoseOn}
          </p>
          <p className="text-sm text-text-secondary">Side effects: {answers.glp1.sideEffects}</p>
        </Section>
      )}

      <div className="mt-5 border-t border-[var(--divider)] pt-5">
        <h3 className="text-lg font-extrabold text-text-primary">Safety screening</h3>
        <ul className="mt-3 space-y-3">
          {SAFETY_QUESTIONS.map((q) => (
            <li key={q.key} className="flex items-center gap-4">
              <span className="min-w-0 flex-1 text-sm leading-relaxed text-text-primary">{q.q}</span>
              <YesNo answer={answers.safetyAllClear ? "no" : "no"} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** "Mounjaro (tirzepatide)" is the clinical name; the patient chose a brand. */
const brandOnly = (v: string) => v.replace(/\s*\(.*\)\s*$/, "");

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-[var(--divider)] pt-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => (
        <span key={c} className="rounded-lg bg-background-neutral px-3 py-2 text-sm font-bold text-text-primary">
          {c}
        </span>
      ))}
    </div>
  );
}

/** The control the patient saw, with their answer still selected. */
function YesNo({ answer }: { answer: "yes" | "no" }) {
  const base = "rounded-lg px-4 py-2 text-sm font-bold";
  return (
    <span className="flex shrink-0 items-center gap-2" aria-label={`Answered ${answer}`}>
      <span className={`${base} ${answer === "yes" ? "bg-error text-white" : "text-text-disabled"}`}>Yes</span>
      <span className={`${base} ${answer === "no" ? "bg-primary text-white" : "text-text-disabled"}`}>No</span>
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-base font-bold text-text-primary">{children}</dd>
    </div>
  );
}
