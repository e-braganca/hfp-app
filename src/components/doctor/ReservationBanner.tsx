"use client";

/**
 * The 60 s look. Opening a case takes it off everyone else's board, but only
 * for as long as it takes to decide whether to work it — press Claim and it's
 * yours, do nothing and it goes back. Until it's claimed the decision actions
 * on the page stay locked, so the reservation can't quietly become a decision.
 */
export function ReservationBanner({
  claimed,
  secondsLeft,
  onClaim,
  onRelease,
}: {
  claimed: boolean;
  secondsLeft: number;
  onClaim: () => void;
  onRelease: () => void;
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
      <button
        type="button"
        onClick={onClaim}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold text-white ${
          urgent ? "bg-error hover:bg-error-dark" : "bg-warning-dark hover:opacity-90"
        }`}
      >
        Claim case · {secondsLeft}s
      </button>
    </div>
  );
}
