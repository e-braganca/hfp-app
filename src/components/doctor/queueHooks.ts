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
  const everHeld = useRef(false);
  useEffect(() => {
    if (hold && mine) {
      everHeld.current = true;
      return;
    }
    if (hold && !mine) {
      router.replace("/doctor/queue");
      return;
    }
    if (everHeld.current) {
      router.replace("/doctor/queue");
      return;
    }
    if (reserve(ref, me.name, me.initials)) everHeld.current = true;
    else router.replace("/doctor/queue");
  }, [hold, mine, ref, me.name, me.initials, router]);

  return {
    me,
    claimed,
    reserved: !!mine && !claimed,
    secondsLeft,
    claimCase: () => claim(ref, me.name, me.initials),
    releaseCase: () => {
      release(ref, me.name);
      router.push("/doctor/queue");
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
