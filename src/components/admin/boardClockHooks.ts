"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useClaims, useQueueClock } from "@/components/doctor/queueHooks";
import {
  getBoardClockServerSnapshot,
  getBoardClockSnapshot,
  seedBoardClockIfEmpty,
  subscribeBoardClock,
  syncBoardClock,
  waitedHours,
} from "@/lib/admin/board-clock";
import {
  getSettingsServerSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  type PlatformSettings,
} from "@/lib/admin/platform-settings";
import {
  SEED_PAUSED,
  SEED_WAIT_HOURS,
  waitFlagFor,
  type BoardPauseReason,
  type WaitFlag,
} from "@/lib/admin/queue-sla";
import { holdFor } from "@/lib/doctor/queue-claims";
import type { LiveCase } from "@/lib/admin/live-cases";

/** Thresholds, live across tabs. */
export function usePlatformSettings(): PlatformSettings {
  return useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getSettingsServerSnapshot);
}

export interface WaitClock {
  now: number;
  settings: PlatformSettings;
  /** hours free on the board, accumulated across every spell */
  hoursFor: (ref: string) => number;
  flagFor: (ref: string) => WaitFlag;
  /** why the clock is parked, or null when it is running / held */
  pausedReason: (ref: string) => BoardPauseReason | null;
  flagged: (c: LiveCase) => WaitFlag;
}

/**
 * The waiting clock, reconciled against the live board on every tick.
 *
 * Reconciliation runs in an effect rather than during render because it
 * writes: a case that just came free needs its spell opened, and doing that
 * mid-render would be a store mutation inside a render pass. It is a no-op
 * once the board is steady, so the 1 s tick costs nothing.
 */
export function useWaitClock(cases: LiveCase[]): WaitClock {
  const claims = useClaims();
  const now = useQueueClock();
  const settings = usePlatformSettings();
  const timers = useSyncExternalStore(subscribeBoardClock, getBoardClockSnapshot, getBoardClockServerSnapshot);

  useEffect(() => {
    seedBoardClockIfEmpty(SEED_WAIT_HOURS);
  }, []);

  const refs = useMemo(() => [...new Set(cases.map((c) => c.ref))], [cases]);

  useEffect(() => {
    const free = new Set(refs.filter((r) => !holdFor(claims, r) && !SEED_PAUSED[r]));
    syncBoardClock(refs, free);
  }, [refs, claims, now]);

  const hoursFor = (ref: string) => waitedHours(timers, ref, now);
  const pausedReason = (ref: string) => (holdFor(claims, ref) ? null : (SEED_PAUSED[ref] ?? null));

  /** Claimed clears the flag outright — the story's rule, and the honest one. */
  const flagFor = (ref: string): WaitFlag => {
    if (holdFor(claims, ref)) return "none";
    return waitFlagFor(hoursFor(ref), settings);
  };

  return { now, settings, hoursFor, flagFor, pausedReason, flagged: (c) => flagFor(c.ref) };
}
