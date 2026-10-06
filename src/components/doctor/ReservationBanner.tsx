"use client";

/**
 * The 60 s look. Opening a case takes it off everyone else's board, but only
 * for as long as it takes to decide whether to work it — press Claim and it's
 * yours, do nothing and it goes back. Until it's claimed the decision actions
 * on the page stay locked, so the reservation can't quietly become a decision.
 *
 * Skip is the third answer, and the honest one for "not this, but keep going":
 * it hands the case back immediately rather than parking it for the rest of
 * the minute, and opens the next one so the clinician never passes through the
 * list to carry on working.
 */
export function ReservationBanner({
  claimed,
  secondsLeft,
  onClaim,
  onRelease,
  onSkip,
}: {
  claimed: boolean;
  secondsLeft: number;
  onClaim: () => void;
  onRelease: () => void;
  /**
   * Hand this one back and open the next, without going via the queue.
   *
   * Deliberately takes no label: naming the next case here would promise a
   * case that another prescriber may claim while this one is still being read.
   * The destination is resolved when the button is pressed.
   */
  onSkip?: () => void;
}) {
  if (claimed) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-success-lighter px-4 py-3 ring-1 ring-success-light/50">
        <p className="text-sm text-success-darker">
          <span className="font-bold">Claimed by you.</span> It&rsquo;s off the shared board until you decide or release it.
        </p>
        <button
          type="button"
          onClick={onRelease}
          className="shrink-0 text-sm font-bold text-success-darker underline hover:no-underline"
        >
          Release back to queue
        </button>
      </div>
    );
  }

  const urgent = secondsLeft <= 15;
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 ring-1 ${
        urgent ? "bg-error-lighter ring-error/40" : "bg-warning-lighter ring-warning/40"
      }`}
    >
      <p className={`text-sm ${urgent ? "text-error-dark" : "text-warning-darker"}`}>
        <span className="font-bold">Reserved while you look.</span> Claim it to keep it — otherwise it returns to the
        queue and the decision stays locked.
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            title="Put it back on the board and open the next case"
            className={`rounded-lg border bg-background-paper px-4 py-2 text-sm font-bold ${
              urgent
                ? "border-error/40 text-error-dark hover:bg-error-lighter"
                : "border-warning/50 text-warning-darker hover:bg-warning-lighter"
            }`}
          >
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={onClaim}
          className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${
            urgent ? "bg-error hover:bg-error-dark" : "bg-warning-dark hover:opacity-90"
          }`}
        >
          Claim case · {secondsLeft}s
        </button>
      </div>
    </div>
  );
}
