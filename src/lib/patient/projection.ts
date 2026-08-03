// ============================================================================
// Weight-loss target & projection.
//
// The target is derived from the manufacturer trial average for the patient's
// medication, applied to their programme start weight. The curve is an
// exponential approach to that target rather than a straight line, because
// real GLP-1 weight loss is steep early and flattens toward the plateau —
// a linear line would over-promise in month two and under-promise at the end.
//
// IMPORTANT: this is an estimate from trial averages, not a prediction for an
// individual, and not a promise. Every surface that renders it must say so.
// Figures need clinical sign-off before any patient-facing release.
// ============================================================================

export interface TrialOutcome {
  /** mean total body-weight loss, as a fraction (0.209 = 20.9%) */
  pct: number;
  /** trial duration the figure was measured over */
  weeks: number;
  /** citation shown next to the projection */
  source: string;
}

/** Highest-dose trial averages, alongside diet and exercise. */
export const TRIAL_OUTCOMES: Record<string, TrialOutcome> = {
  Mounjaro: { pct: 0.209, weeks: 72, source: "SURMOUNT-1 · tirzepatide 15 mg · 72 weeks" },
  Wegovy: { pct: 0.149, weeks: 68, source: "STEP-1 · semaglutide 2.4 mg · 68 weeks" },
};
const FALLBACK: TrialOutcome = { pct: 0.15, weeks: 68, source: "GLP-1 trial average · 68 weeks" };

export const outcomeFor = (med: string): TrialOutcome =>
  TRIAL_OUTCOMES[Object.keys(TRIAL_OUTCOMES).find((k) => med.includes(k)) ?? ""] ?? FALLBACK;

/** Milestones worth marking: 5% is the SOP continuation gate at 6 months. */
export interface Milestone {
  pct: number;
  label: string;
  kg: number;
  /** weeks from programme start, or null if beyond the trial average */
  weeks: number | null;
  date: string | null;
  reached: boolean;
}

export interface Projection {
  startKg: number;
  targetKg: number;
  targetBmi: number;
  totalPct: number;
  horizonWeeks: number;
  source: string;
  /** projected weight at a given week from start */
  at: (week: number) => number;
  milestones: Milestone[];
  /** kg ahead (+) or behind (−) the trial pace right now */
  paceKg: number;
  targetDate: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parses the seed date format, e.g. "17 Jun 2026". */
export function parseSeedDate(s: string): Date {
  const [d, m, y] = s.trim().split(/\s+/);
  return new Date(Date.UTC(Number(y), Math.max(MONTHS.indexOf(m), 0), Number(d)));
}

const formatDate = (d: Date) =>
  `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

export function buildProjection({
  startKg,
  currentKg,
  heightCm,
  med,
  startDate,
  weeksElapsed,
}: {
  startKg: number;
  currentKg: number;
  heightCm: number;
  med: string;
  startDate: string;
  weeksElapsed: number;
}): Projection {
  const outcome = outcomeFor(med);
  const totalLoss = startKg * outcome.pct;
  const targetKg = startKg - totalLoss;
  // 95% of the total loss lands at the trial horizon
  const k = 3 / outcome.weeks;
  const at = (week: number) => startKg - totalLoss * (1 - Math.exp(-k * Math.max(week, 0)));

  const start = parseSeedDate(startDate);
  const dateAtWeek = (w: number) => formatDate(new Date(start.getTime() + w * 7 * 86_400_000));
  /** inverse of the curve: weeks until a given fraction of body weight is lost */
  const weeksFor = (pct: number) => {
    const frac = pct / outcome.pct;
    if (frac >= 1) return null; // beyond the trial average — can't promise it
    return Math.ceil(-Math.log(1 - frac) / k);
  };

  const lostPct = (startKg - currentKg) / startKg;
  const milestones: Milestone[] = [
    { pct: 0.05, label: "5% — continuation review" },
    { pct: 0.1, label: "10%" },
    { pct: outcome.pct, label: `${(outcome.pct * 100).toFixed(1)}% — trial average` },
  ].map((m) => {
    const weeks = m.pct === outcome.pct ? outcome.weeks : weeksFor(m.pct);
    return {
      ...m,
      kg: startKg * (1 - m.pct),
      weeks,
      date: weeks === null ? null : dateAtWeek(weeks),
      reached: lostPct >= m.pct,
    };
  });

  return {
    startKg,
    targetKg,
    targetBmi: targetKg / (heightCm / 100) ** 2,
    totalPct: outcome.pct,
    horizonWeeks: outcome.weeks,
    source: outcome.source,
    at,
    milestones,
    paceKg: at(weeksElapsed) - currentKg, // positive = losing faster than the trial pace
    targetDate: dateAtWeek(outcome.weeks),
  };
}
