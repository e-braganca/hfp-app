"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  actingClinician,
  getActingServerSnapshot,
  getActingSnapshot,
  setActing,
  subscribeActing,
} from "@/lib/doctor/acting-clinician";
import {
  claim,
  getClaimsServerSnapshot,
  getClaimsSnapshot,
  holdFor,
  release,
  reserve,
  subscribeClaims,
  sweepExpired,
} from "@/lib/doctor/queue-claims";
import {
  getInfoRequestsServerSnapshot,
  getInfoRequestsSnapshot,
  isAwaitingPatient,
  subscribeInfoRequests,
} from "@/lib/doctor/info-requests";
import { markSkipped, nextCase } from "@/lib/doctor/case-order";
import {
  SEED_PAUSED,
  SEED_WAIT_HOURS,
  getBoardClockServerSnapshot,
  getBoardClockSnapshot,
  subscribeBoardClock,
  syncBoardClock,
} from "@/lib/shared/board-clock";
import { liveCases } from "@/lib/shared/live-cases";
import type { Clinician } from "@/lib/doctor/clinicians";

/** The board, live across tabs. */
export function useClaims() {
  return useSyncExternalStore(subscribeClaims, getClaimsSnapshot, getClaimsServerSnapshot);
}

/** Who this tab is, and how to switch. */
export function useActing(): [Clinician, (name: string) => void] {
  const name = useSyncExternalStore(subscribeActing, getActingSnapshot, getActingServerSnapshot);
  return [actingClinician(name), setActing];
}

/**
 * The reservation a detail page runs under. Opening a case reserves it; the
 * clinician has RESERVE_SECONDS to press Claim or the case goes back on the
 * board and they are returned to the queue. Until it's claimed the decision
 * actions stay locked — a 60 s look is not a decision.
 */
export function useCaseHold(ref: string) {
  const claims = useClaims();
  const [me] = useActing();
  const now = useQueueClock();
  const router = useRouter();

  const hold = holdFor(claims, ref);
  const mine = hold?.by === me.name;
  const claimed = mine && hold?.kind === "claimed";
  const secondsLeft = hold?.expiresAt ? Math.max(0, Math.ceil((hold.expiresAt - now) / 1000)) : 0;

  // Reserve on arrival (deep link, refresh, or straight from the board). Once
  // we've held it, losing the hold means the 60 s lapsed — go back to the
  // queue rather than silently reserving it again, which would make the
  // countdown immortal.
  /**
   * Both flags are keyed to the ref, not booleans.
   *
   * Next reuses this component across /doctor/orders/[ref], so a plain boolean
   * survived the navigation: after skipping, the hook arrived at the next case
   * still believing it had already held it, decided the reservation must have
   * lapsed, and bounced straight back to the queue. Keyed to the ref, the hook
   * is correct whether the component remounts or is reused.
   */
  const heldRef = useRef<string | null>(null);
  const leavingRef = useRef<string | null>(null);

  useEffect(() => {
    if (leavingRef.current === ref) return;
    if (hold && mine) {
      heldRef.current = ref;
      return;
    }
    if (hold && !mine) {
      router.replace("/doctor/queue");
      return;
    }
    // "we held this and lost it" has to be judged against the live store, not
    // the render's snapshot. The snapshot lags the reservation we just took by
    // a tick, so a second effect pass would read null, conclude the 60 s had
    // lapsed and bounce — which is exactly what happens on every client-side
    // hop between two cases, where this component is reused.
    if (heldRef.current === ref && !holdFor(getClaimsSnapshot(), ref)) {
      router.replace("/doctor/queue");
      return;
    }
    if (reserve(ref, me.name, me.initials)) heldRef.current = ref;
    else router.replace("/doctor/queue");
  }, [hold, mine, ref, me.name, me.initials, router]);

  return {
    me,
    claimed,
    reserved: !!mine && !claimed,
    secondsLeft,
    claimCase: () => claim(ref, me.name, me.initials),
    /**
     * Not this one, next — the only thing Skip ever means.
     *
     * What happens to the case behind you depends on whether it was yours. A
     * reservation is a look, so skipping hands it straight back. A claim is a
     * decision to work it, and skipping past it for now should not quietly
     * undo that: it stays yours and comes back round, which is why the work
     * order includes cases you are already holding.
     */
    skipTo: (href: string) => {
      leavingRef.current = ref;
      markSkipped(ref);
      if (!claimed) release(ref, me.name);
      router.push(href);
    },
    /** Already decided; the hold can stay as it is. */
    leaveTo: (href: string) => {
      leavingRef.current = ref;
      router.push(href);
    },
  };
}

/**
 * A 1 s clock that also expires stale reservations. One instance per screen
 * is enough — the sweep writes through the shared store, so every subscriber
 * re-renders together.
 */
export function useQueueClock(active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      sweepExpired();
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

/**
 * Where "next case" goes, and how to get there.
 *
 * The destination is resolved when the button is pressed, never when it is
 * drawn. A clinician can sit on a finished case for minutes, and in that time
 * another prescriber may claim whatever was next — naming it on the button
 * would promise a case we no longer have, and send them to a screen that
 * bounces them straight back. `hasNext` is only for deciding whether to offer
 * the button at all; if the queue empties in between, the click lands on the
 * work queue, which is the honest answer.
 *
 * Also keeps the waiting clock ticking on the prescriber side. It used to be
 * wound only by the admin screens, which meant a clinician who never opened
 * Oversight was ordering their work by a clock nobody had started.
 */
export function useNextCase(currentRef: string) {
  const claims = useClaims();
  const [me] = useActing();
  const now = useQueueClock();
  const timers = useSyncExternalStore(
    subscribeBoardClock,
    getBoardClockSnapshot,
    getBoardClockServerSnapshot,
  );
  const infoRequests = useSyncExternalStore(
    subscribeInfoRequests,
    getInfoRequestsSnapshot,
    getInfoRequestsServerSnapshot,
  );

  useEffect(() => {
    const refs = [...new Set(liveCases().map((c) => c.ref))];
    const parked = new Set(refs.filter((r) => SEED_PAUSED[r] || isAwaitingPatient(infoRequests[r])));
    syncBoardClock(refs, parked, SEED_WAIT_HOURS);
  }, [infoRequests, now]);

  /** Read the board as it is right now, not as it was when we rendered. */
  const resolveHref = () => {
    const live = nextCase(currentRef, {
      timers: getBoardClockSnapshot(),
      now: Date.now(),
      claims: getClaimsSnapshot(),
      infoRequests: getInfoRequestsSnapshot(),
      me,
    });
    return live?.href ?? "/doctor/queue";
  };

  return {
    hasNext: nextCase(currentRef, { timers, now, claims, infoRequests, me }) !== null,
    resolveHref,
  };
}
