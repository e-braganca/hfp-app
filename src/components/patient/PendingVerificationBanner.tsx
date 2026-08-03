"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getVerificationServerSnapshot,
  getVerificationSnapshot,
  subscribeVerification,
} from "@/lib/verification";

/** Order-on-hold banner — shows while verification photos are still owed
 *  (deferred during onboarding) and routes to the catch-up wizard. */
export function PendingVerificationBanner() {
  const pending = useSyncExternalStore(
    subscribeVerification,
    getVerificationSnapshot,
    getVerificationServerSnapshot,
  );
  if (!pending || (!pending.weightPhoto && !pending.idDoc)) return null;

  const missing = [pending.weightPhoto && "a live weight photo", pending.idDoc && "an ID photo"]
    .filter(Boolean)
    .join(" and ");

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-2 border-warning/60 bg-warning-lighter px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-warning-darker">Your order is on hold</p>
        <p className="mt-0.5 text-sm leading-relaxed text-warning-darker">
          We still need {missing}{" "}
          before a prescriber can review it. Takes about a minute — nothing is charged until it&rsquo;s done.
        </p>
      </div>
      <Link
        href="/patient/verify"
        className="shrink-0 rounded-lg bg-warning-dark px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        Provide photos now
      </Link>
    </div>
  );
}
