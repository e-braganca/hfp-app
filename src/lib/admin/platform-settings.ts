// ============================================================================
// Platform settings — operational numbers an admin can change without a
// release.
//
// The waiting-flag thresholds live here rather than as constants because they
// are an operational promise, not a clinical rule: how long the panel may let
// a case sit before someone is told about it. That number gets argued over and
// retuned, and waiting for a deploy each time would mean the flags drift out
// of step with whatever the service actually committed to.
//
// Clinical thresholds are the opposite and deliberately stay in the SOPs,
// where a change is versioned and audit-logged.
//
// localStorage + external store, same pattern as the claim board, so every
// open tab re-renders the moment a threshold moves.
// ============================================================================

export interface PlatformSettings {
  /** hours unclaimed on the board before a case is flagged amber */
  waitAmberHours: number;
  /** hours unclaimed before it goes red */
  waitRedHours: number;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  waitAmberHours: 12,
  waitRedHours: 24,
};

const KEY = "hfp-platform-settings";

let cache: PlatformSettings | undefined;
const listeners = new Set<() => void>();

function read(): PlatformSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PlatformSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  cache = undefined;
  listeners.forEach((l) => l());
}

export function subscribeSettings(cb: () => void): () => void {
  listeners.add(cb);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getSettingsSnapshot(): PlatformSettings {
  if (cache === undefined) cache = read();
  return cache;
}

export const getSettingsServerSnapshot = (): PlatformSettings => DEFAULT_SETTINGS;

/**
 * Amber must stay below red, or every amber case would also be red and the
 * two-stage warning collapses into one. Callers pass whichever field the admin
 * edited; the other is nudged only if the pair would otherwise cross.
 */
export function setPlatformSettings(patch: Partial<PlatformSettings>) {
  const next = { ...getSettingsSnapshot(), ...patch };
  next.waitAmberHours = Math.max(1, Math.round(next.waitAmberHours));
  next.waitRedHours = Math.max(next.waitAmberHours + 1, Math.round(next.waitRedHours));
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — this session only */
  }
  listeners.forEach((l) => l());
}

export function resetPlatformSettings() {
  cache = DEFAULT_SETTINGS;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}
