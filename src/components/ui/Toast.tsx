"use client";

import { useEffect } from "react";
import { CheckIcon } from "./icons";

/**
 * Bottom-centre confirmation toast.
 *
 * It still clears itself, but it can also be dismissed: the toast sits over
 * the bottom of the table, and waiting out three and a half seconds to read
 * the row underneath is the kind of small obstruction that adds up over a
 * shift. The timer is also restarted whenever the message changes, so a run of
 * quick actions doesn't leave the last one cut short.
 */
export function Toast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 lg:left-[calc(50%+132px)]">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2.5 rounded-full bg-primary-darker py-3 pl-5 pr-2.5 text-sm font-semibold text-white shadow-dialog"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <CheckIcon width={14} height={14} />
        </span>
        {message}
        <button
          type="button"
          onClick={onDone}
          aria-label="Dismiss"
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
