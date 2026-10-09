// ============================================================================
// What the AI's reading actually asks for.
//
// Most readings end in a prescription. Some end in stopping: discontinue at a
// six-month review, hold this cycle, send it to a senior before restarting.
// Those were invisible to the screen — it looked for a drug and a dose, found
// none, and fell back to pre-selecting whatever the patient had asked for. So
// the one thing a prescriber could not do was agree with the reading, while
// prescribing against it was a click and a sentence. That is the wrong way
// round, and this is the type that lets a screen tell the difference.
// ============================================================================

export type ReadingOutcome = "prescribe" | "discontinue" | "hold" | "senior";

/**
 * Read from the recommendation's own words.
 *
 * "Wegovy 1.0 mg · hold dose · 4-week supply" is a prescription — holding the
 * dose is continuing at it — so only a reading that *opens* with the verb is
 * an instruction to stop.
 */
export function readingOutcome(recommendedRx: string): ReadingOutcome {
  const rx = recommendedRx.trim();
  if (/^(discontinue|stop)\b/i.test(rx)) return "discontinue";
  if (/^(hold|no prescription)\b/i.test(rx)) return "hold";
  if (/^senior review\b/i.test(rx) || /\bescalate\b/i.test(rx)) return "senior";
  return "prescribe";
}

/** What the prescriber is being asked to do, in the words the button uses. */
export const OUTCOME_SUMMARY: Partial<Record<ReadingOutcome, string>> = {
  discontinue: "stop treatment and signpost the patient elsewhere",
  hold: "issue nothing this cycle",
  senior: "put it in front of a senior before anything is issued",
};
