"use client";

import { useState, type ReactNode } from "react";
import { ConsultationAnswersBody } from "./ConsultationAnswersCard";
import { InfoRequestBody, useOutstandingCount } from "./InfoRequestCard";
import { submittedLabel, type ConsultationAnswers } from "@/lib/doctor/consultation";
import type { AiRecommendation } from "@/lib/doctor/types";

/* ============================================================================
   The working surface of a review.

   Three readings of the same case — what the AI made of it, what we asked the
   patient for, and what the patient told us at onboarding — stacked behind
   tabs rather than spread between a column and a card. They answer the same
   question from different angles, and hunting for the third one in the left
   rail while the first is on the right made comparing them a scrolling
   exercise.

   The decision actions sit outside the tabs and never move. A prescriber who
   switches to the patient's answers to check the AI's homework must be able to
   act on what they find without navigating back.
   ============================================================================ */

type Tab = "ai" | "info" | "answers";

export function ReviewPanel({
  ai,
  sop,
  prescription,
  actions,
  caseRef,
  answers,
}: {
  ai: AiRecommendation;
  /** the rule this reading was scored against, quoted in full */
  sop?: { rule: string; version: string; quote: string };
  /** the prescription control, when this screen can issue one */
  prescription?: ReactNode;
  actions?: ReactNode;
  caseRef: string;
  answers: ConsultationAnswers;
}) {
  const [tab, setTab] = useState<Tab>("ai");
  const outstanding = useOutstandingCount(caseRef);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "ai", label: "AI eligibility" },
    { id: "info", label: "Requested information", badge: outstanding || undefined },
    { id: "answers", label: "Patient answers" },
  ];

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg bg-background-paper shadow-card">
      {/* the gradient stays as the panel's identity; the tabs live in it so
          switching view never looks like navigating away from the case */}
      <div className="shrink-0 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-6 pt-3">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition-colors ${
                  on ? "border-white text-white" : "border-transparent text-white/60 hover:text-white/90"
                }`}
              >
                {t.label}
                {t.badge != null && (
                  <span className="rounded-full bg-warning px-1.5 py-0.5 text-[11px] font-bold text-warning-darker">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {tab === "ai" && <AiTab ai={ai} sop={sop} prescription={prescription} />}
        {tab === "info" && <InfoRequestBody caseRef={caseRef} />}
        {tab === "answers" && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-text-primary">Patient answers</h2>
              {/* only when we actually know it — a bare em dash is a row of
                  vertical space that tells the prescriber nothing */}
              {answers.submittedAt !== "—" && (
                <p className="text-sm text-text-secondary">{submittedLabel(answers.submittedAt)}</p>
              )}
            </div>
            <div className="mt-4 border-t border-[var(--divider)] pt-5">
              <ConsultationAnswersBody answers={answers} />
            </div>
          </>
        )}
      </div>

      {actions && (
        <div className="shrink-0 border-t border-[var(--divider)] bg-background-paper px-6 py-4">{actions}</div>
      )}
    </section>
  );
}

function AiTab({
  ai,
  sop,
  prescription,
}: {
  ai: AiRecommendation;
  sop?: { rule: string; version: string; quote: string };
  prescription?: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">{ai.basis}</p>
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-success-lighter px-3 py-1.5 text-xs font-bold text-success-darker">
          <span className="h-2 w-2 rounded-full bg-success" />
          High confidence · {ai.score.confidence}%
        </span>
      </div>

      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary">{ai.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{ai.body}</p>

      <ul className="mt-5 space-y-2.5">
        {ai.checks.map((c, i) => (
          <li key={i} className="flex gap-3 text-sm text-text-primary">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
            <span className="leading-relaxed">{c}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {prescription ?? (
          <div className="rounded-lg bg-background-neutral px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Recommended prescription
            </p>
            <p className="mt-1 text-base font-bold text-text-primary">{ai.recommendedRx}</p>
          </div>
        )}
      </div>

      {sop && (
        <div className="mt-4 rounded-lg border border-[var(--divider)] bg-grey-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{sop.rule}</p>
            <span className="font-mono text-[11px] text-text-disabled">{sop.version}</span>
          </div>
          <p className="mt-1.5 text-sm italic leading-relaxed text-text-primary">&ldquo;{sop.quote}&rdquo;</p>
        </div>
      )}
    </>
  );
}
