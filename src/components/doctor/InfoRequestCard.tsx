"use client";

import { useSyncExternalStore } from "react";
import {
  askedAgo,
  getInfoRequestsServerSnapshot,
  getInfoRequestsSnapshot,
  subscribeInfoRequests,
} from "@/lib/doctor/info-requests";
import {
  RFI_STATE_LABEL,
  RFI_STATE_PILL,
  rfiItem,
  type RfiResponseItem,
} from "@/lib/shared/rfi-items";
import { useQueueClock } from "./queueHooks";

/* ============================================================================
   What we asked the patient for, and what came back.

   Item by item, because the question a prescriber actually has on returning to
   a chased case is "can I decide yet?" — and that is answered by which of the
   things we asked for are still missing, not by the fact that an email was
   sent. A thread of replies can't answer it without being re-read in full.

   Outstanding items sort to the top: they are the reason the case is still
   here.
   ============================================================================ */

export function useInfoRequest(caseRef: string) {
  const requests = useSyncExternalStore(
    subscribeInfoRequests,
    getInfoRequestsSnapshot,
    getInfoRequestsServerSnapshot,
  );
  return requests[caseRef] ?? null;
}

/** Count of things the patient still owes us — drives the tab badge. */
export function useOutstandingCount(caseRef: string) {
  const r = useInfoRequest(caseRef);
  return r ? r.items.filter((i) => i.state === "outstanding").length : 0;
}


function Row({ item }: { item: RfiResponseItem }) {
  const meta = rfiItem(item.id);
  return (
    <li className="flex flex-wrap items-start gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text-primary">{meta?.label ?? item.id}</p>

        {item.state === "outstanding" ? (
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{meta?.ask}</p>
        ) : (
          <>
            {item.reply && <p className="mt-0.5 text-sm text-text-primary">{item.reply}</p>}
            {item.attachment && (
              <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-primary-dark">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M8 7v9a4 4 0 0 0 8 0V6a2.5 2.5 0 0 0-5 0v9.5a1 1 0 0 0 2 0V7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                {item.attachment}
              </p>
            )}
            {item.at && <p className="mt-0.5 text-[11px] text-text-disabled">Received {item.at}</p>}
          </>
        )}
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${RFI_STATE_PILL[item.state]}`}
      >
        {RFI_STATE_LABEL[item.state]}
      </span>
    </li>
  );
}

/**
 * The same content without the card around it, for the review panel's tab.
 * A tab is always present, so unlike the card it has to say something when
 * nothing has been asked yet.
 */
export function InfoRequestBody({ caseRef }: { caseRef: string }) {
  const now = useQueueClock();
  const request = useInfoRequest(caseRef);

  if (!request) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--divider)] px-5 py-10 text-center">
        <p className="text-sm font-semibold text-text-primary">Nothing has been asked of this patient</p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-text-secondary">
          Use <span className="font-semibold">Request more info</span> below to ask for photos, a medication list
          or anything else the record is missing. What you ask for shows up here, item by item, with whatever comes
          back.
        </p>
      </div>
    );
  }

  const items = [...request.items].sort(
    (a, b) => Number(a.state !== "outstanding") - Number(b.state !== "outstanding"),
  );
  const outstanding = items.filter((i) => i.state === "outstanding").length;
  const done = items.length - outstanding;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--divider)]">
      <div className={`px-5 py-3.5 ${outstanding === 0 ? "bg-success-lighter" : "bg-warning-lighter"}`}>
        <p className={`text-sm font-bold ${outstanding === 0 ? "text-success-darker" : "text-warning-darker"}`}>
          {outstanding === 0
            ? "Everything we asked for is in"
            : `Waiting on the patient — ${outstanding} of ${items.length} still outstanding`}
        </p>
        <p className={`text-xs ${outstanding === 0 ? "text-success-dark" : "text-warning-dark"}`}>
          {request.by} · asked {askedAgo(request, now)}
          {done > 0 && ` · ${done} supplied`}
        </p>
      </div>
      <ul className="divide-y divide-[var(--divider)]">
        {items.map((i) => (
          <Row key={i.id} item={i} />
        ))}
      </ul>
      {request.note && (
        <p className="border-t border-[var(--divider)] bg-background-neutral px-5 py-3 text-xs leading-relaxed text-text-secondary">
          <span className="font-bold">Note sent with the request: </span>
          {request.note}
        </p>
      )}
    </div>
  );
}
