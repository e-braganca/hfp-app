"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useQueueClock } from "@/components/doctor/queueHooks";
import {
  SEED_WAIT_HOURS,
  getBoardClockServerSnapshot,
  getBoardClockSnapshot,
  subscribeBoardClock,
  syncBoardClock,
  waitedHours,
} from "@/lib/shared/board-clock";
import {
  getSettingsServerSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  type PlatformSettings,
} from "@/lib/admin/platform-settings";
import { waitFlagFor, type WaitFlag } from "@/lib/admin/queue-sla";
import {
  getInfoRequestsServerSnapshot,
  getInfoRequestsSnapshot,
  isAwaitingPatient,
  subscribeInfoRequests,
} from "@/lib/doctor/info-requests";
import type { LiveCase } from "@/lib/shared/live-cases";

/** Thresholds, live across tabs. */
export function usePlatformSettings(): PlatformSettings {
  return useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getSettingsServerSnapshot);
}

export interface WaitClock {
  now: number;
  settings: PlatformSettings;
  /** hours the patient has been waiting on a decision */
  hoursFor: (ref: string) => number;
  flagFor: (ref: string) => WaitFlag;
  /** why the clock is parked on the patient, or null when it is running */
  /** true while the patient owes us something — the clock is stopped */
  parked: (ref: string) => boolean;
  flagged: (c: LiveCase) => WaitFlag;
}

/**
 * The waiting clock, reconciled against the live queue on every tick.
 *
 * Reconciliation runs in an effect rather than during render because it
 * writes, and a store mutation inside a render pass is a bug waiting to
 * happen. It is a no-op once the queue is steady, so the 1 s tick costs
 * nothing.
 */
export function useWaitClock(cases: LiveCase[]): WaitClock {
  const now = useQueueClock();
  const settings = usePlatformSettings();
  const timers = useSyncExternalStore(subscribeBoardClock, getBoardClockSnapshot, getBoardClockServerSnapshot);
  const infoRequests = useSyncExternalStore(
    subscribeInfoRequests,
    getInfoRequestsSnapshot,
    getInfoRequestsServerSnapshot,
  );

  const refs = useMemo(() => [...new Set(cases.map((c) => c.ref))], [cases]);

  useEffect(() => {
    const parked = new Set(refs.filter((r) => isAwaitingPatient(infoRequests[r])));
    syncBoardClock(refs, parked, SEED_WAIT_HOURS);
  }, [refs, infoRequests, now]);

  const hoursFor = (ref: string) => waitedHours(timers, ref, now);
  const parked = (ref: string): boolean => isAwaitingPatient(infoRequests[ref]);

  /**
   * Claiming does not clear the flag. The patient is still waiting, and a case
   * sat on for a day by one prescriber has failed them as badly as one nobody
   * picked up. Only a decision — or an information request, which resets the
   * clock — ends the wait.
   */
  const flagFor = (ref: string): WaitFlag =>
    parked(ref) ? "none" : waitFlagFor(hoursFor(ref), settings);

  return { now, settings, hoursFor, flagFor, parked, flagged: (c) => flagFor(c.ref) };
}
