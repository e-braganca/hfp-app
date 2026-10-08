"use client";

/* ============================================================================
   What a decided case says back.

   Lived in OrderReview and was imported from there by two other screens, which
   made a screen a module — anything importing the outcome also pulled in the
   new-order review and everything it touches.
   ============================================================================ */

export function OutcomePanel({
  tone,
  title,
  body,
  onNext,
}: {
  tone: "success" | "error" | "warning" | "slate";
  title: string;
  body: string;
  /**
   * Keep working without passing through the queue. No label: which case is
   * next is only known when this is pressed, since someone else may claim it
   * while this screen sits open.
   */
  onNext?: () => void;
}) {
  const toneCls = {
    success: "bg-success-lighter text-success-dark",
    error: "bg-error-lighter text-error-dark",
    warning: "bg-warning-lighter text-warning-dark",
    slate: "bg-background-neutral text-text-secondary",
  }[tone];
  return (
    <div className="rounded-lg bg-background-neutral p-6 text-center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${toneCls}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="mt-3 text-base font-bold text-text-primary">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">{body}</p>
      {/* next case leads, because the common path after deciding one case is
          deciding another — the queue is the way out, not the way on */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Next case &rarr;
          </button>
        )}
        <a
          href="/doctor/queue"
          className={`rounded-lg px-5 py-2.5 text-sm font-bold ${
            onNext
              ? "border border-[var(--divider)] text-text-primary hover:bg-background-neutral"
              : "bg-primary text-white hover:bg-primary-dark"
          }`}
        >
          Back to Work Queue
        </a>
      </div>
    </div>
  );
}
