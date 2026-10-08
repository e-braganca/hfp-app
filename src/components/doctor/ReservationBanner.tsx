"use client";

/**
 * The 60 s look. Opening a case takes it off everyone else's board, but only
 * for as long as it takes to decide whether to work it — press Claim and it's
 * yours, do nothing and it goes back. Until it's claimed the decision actions
 * on the page stay locked, so the reservation can't quietly become a decision.
 *
 * Skip is the third answer, and the honest one for "not this, but keep going":
 * it opens the next case so the clinician never passes back through the list
 * to carry on working. It sits in both states, because wanting to move on is
 * not something only an unclaimed case provokes. Leaving the run entirely is
 * the back link in the breadcrumb, which is where a way out belongs.
 */
export function ReservationBanner({
  claimed,
  secondsLeft,
  onClaim,
  onSkip,
}: {
  claimed: boolean;
  secondsLeft: number;
  onClaim: () => void;
  /**
   * Open the next case without going via the queue. A reservation goes back
   * on the board; a claim stays yours and comes round again.
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
          <span className="font-bold">Claimed by you.</span> It&rsquo;s off the shared board until you decide it.
        </p>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            title="Keep it, and open the longest-waiting case you can work"
            className="shrink-0 rounded-lg border border-success-light bg-background-paper px-4 py-2 text-sm font-bold text-success-darker hover:bg-success-lighter"
          >
            Skip
          </button>
        )}
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
