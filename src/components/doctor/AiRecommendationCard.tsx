import type { ReactNode } from "react";
import type { AiRecommendation } from "@/lib/doctor/types";

/**
 * The SOP-grounded AI recommendation "hero" card shown on order/case detail
 * and in the escalation drawer. Presentational — the decision actions are
 * passed in by the parent, which owns the client-side decision state machine.
 *
 * The card fills its grid cell and pins the actions to its own bottom edge, so
 * on the review pages the decision is always in the same place regardless of
 * how much the reading above it runs on.
 */
export function AiRecommendationCard({
  ai,
  actions,
  sop,
}: {
  ai: AiRecommendation;
  actions?: ReactNode;
  /** the rule this reading was scored against, quoted in full */
  sop?: { rule: string; version: string; quote: string };
}) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg bg-background-paper shadow-card">
      {/* gradient header */}
      <div className="flex shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-6 py-4 text-white">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
            AI eligibility check
          </p>
          <p className="mt-0.5 text-sm text-white/85">{ai.basis}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
          <span className="h-2 w-2 rounded-full bg-secondary-light" />
          High confidence · {ai.score.confidence}%
        </span>
      </div>

      {/* reading — scrolls only if the viewport is too short for it */}
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-primary">
          {ai.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          {ai.body}
        </p>

        <ul className="mt-5 space-y-3">
          {ai.checks.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm text-text-primary">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
              <span className="leading-relaxed">{c}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-lg bg-background-neutral px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Recommended prescription
          </p>
          <p className="mt-1 text-base font-bold text-text-primary">
            {ai.recommendedRx}
          </p>
        </div>

        {sop && (
          <div className="mt-4 rounded-lg border border-[var(--divider)] bg-grey-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                {sop.rule}
              </p>
              <span className="shrink-0 rounded-md bg-background-paper px-2 py-0.5 font-mono text-[11px] font-bold text-text-secondary">
                {sop.version}
              </span>
            </div>
            <p className="mt-1.5 text-sm italic leading-relaxed text-text-secondary">
              “{sop.quote}”
            </p>
          </div>
        )}
      </div>

      {actions && (
        <div className="shrink-0 border-t border-[var(--divider)] px-6 py-4">{actions}</div>
      )}
    </section>
  );
}

/** Shared audit-trail footnote used under decision actions. */
export function AuditNote() {
  return (
    <p className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
      </svg>
      Your decision and the active SOP version are recorded to the audit trail
    </p>
  );
}
