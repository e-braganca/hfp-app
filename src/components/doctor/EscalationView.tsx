"use client";

import { pharmacyName } from "@/lib/doctor/data";
import type { Escalation } from "@/lib/doctor/types";
import { ReviewPanel } from "./ReviewPanel";
import { consultationFor } from "@/lib/doctor/consultation";
import { PatientMediaCard } from "@/components/shared/PatientMedia";
import { PatientSummaryCard } from "./PatientSummaryCard";
import { ReviewShell } from "./ReviewShell";
import { RagPill } from "@/components/ui/StatusPill";
import { ESCALATION_RAG } from "@/lib/shared/live-cases";

/* ============================================================================
   An escalated case, read-only.

   It is already with the prescriber who raised it and the senior reviewing
   it; a third clinician claiming it would take it from both. So there is no
   reservation banner and no decision — this screen exists so the case can be
   opened and read, which is all anyone on the shared board can do with it.
   ============================================================================ */

export function EscalationView({ escalation }: { escalation: Escalation }) {
  const e = escalation;
  const answers = consultationFor(e.ref);
  const awaiting = e.status === "Awaiting senior review";

  return (
    <ReviewShell
      title="Escalated Request"
      subtitle={`${e.ref} · ${pharmacyName(e.pharmacyCode)} · ${e.reason}`}
      backHref="/doctor/queue"
      trail={["Escalated", e.ref]}
      banner={
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background-neutral px-5 py-3.5 ring-1 ring-[var(--divider)]">
          <p className="text-sm text-text-primary">
            <span className="font-bold">{e.status}.</span>{" "}
            {awaiting
              ? "It is out of the shared board until a senior picks it up — nothing to do here but read it."
              : "A senior is working it now. You'll see the outcome on the case it was raised from."}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-grey-200 px-3 py-1 text-xs font-bold text-text-secondary">
            <LockGlyph />
            Read-only
          </span>
        </div>
      }
      left={
        <>
          <PatientSummaryCard
            ref_={e.ref}
            nhs={e.nhs}
            age={answers.age}
            sex={answers.sexAtBirth}
            bmi={answers.bmi}
            ethnicity={answers.ethnicity}
            pharmacyCode={e.pharmacyCode}
            comorbidities={answers.conditions}
            pill={<RagPill rag={ESCALATION_RAG} label="Escalated" />}
          />

          <div className="rounded-lg bg-background-paper p-5 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Why it was escalated</p>
            <p className="mt-2 text-base font-bold text-text-primary">{e.reason}</p>
            <p className="text-sm text-text-secondary">
              {e.med} · {e.dose}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{pharmacyName(e.pharmacyCode)}</p>
          </div>

          <PatientMediaCard
            caseRef={e.ref}
            weightPhoto="Uploaded at last review"
            idDocument="Verified at sign-up"
          />
        </>
      }
      right={
        <ReviewPanel
          ai={null}
          noReadingTitle="The reading is on the case this was raised from"
          noReadingBody="An escalation carries the case's own AI reading and SOP citation to the senior reviewing it. This screen is the patient record and what has been asked of them."
          caseRef={e.ref}
          answers={answers}
        />
      }
    />
  );
}

function LockGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2.4" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}
