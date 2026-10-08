"use client";

import { GLP1_PRODUCTS } from "@/lib/onboarding/glp1";
import { Select } from "@/components/ui/Select";

/* ============================================================================
   What is actually being prescribed.

   The AI reading is advice, and a screen that only offers "agree" or "refuse"
   quietly makes it the prescriber. So the whole choice is on the page at once:
   every licensed product as a card, the dose beside it, the length of supply
   beside that — with the recommendation pre-selected rather than hidden behind
   a "change" link. Picking something else costs one click, which is what it
   should cost when a clinician has already decided.

   Departing from the recommendation demands a reason. Not friction for its own
   sake: the audit trail records the SOP version and the AI's basis, so a
   prescription that diverges from them is unexplainable later unless the why
   is captured now.
   ============================================================================ */

/** The four licensed products; "other" is an onboarding answer, not a script. */
const PRESCRIBABLE = GLP1_PRODUCTS.filter((p) => p.key !== "other");

/** Supply lengths the pharmacy packs. Four weeks is a titration step. */
export const SUPPLY_WEEKS = [2, 4, 8, 12];
export const DEFAULT_WEEKS = 4;

export interface Prescription {
  med: string;
  dose: string;
  weeks: number;
  /** required once it differs from the recommendation */
  reason?: string;
}

/**
 * Read the AI's recommendation back into a selection, e.g.
 * "Mounjaro 2.5 mg · 4-week starter supply".
 *
 * Returns null when the recommendation isn't a prescription at all — a
 * discontinuation, or a signpost to the lifestyle pathway. Prescribing over
 * one of those is an amendment by definition, so the reason is always asked
 * for, which is the safe direction to fail in.
 */
export function parseRecommended(rx: string): Prescription | null {
  const product = PRESCRIBABLE.find((p) => rx.toLowerCase().includes(p.name.toLowerCase()));
  if (!product) return null;
  // "Hold at Wegovy 1.7 mg · escalate for specialist sign-off" names a drug and
  // a dose but is not a recommendation to prescribe it. Pre-selecting it would
  // make "Approve & issue" read as agreeing with the AI, when the AI said stop.
  if (/^(discontinue|no prescription|stop|hold)/i.test(rx.trim())) return null;

  const dose = matchDose(rx, product.doses);
  if (!dose) return null;

  const weeks = Number(rx.match(/(\d+)\s*-?\s*week/i)?.[1] ?? DEFAULT_WEEKS);
  return { med: product.name, dose, weeks };
}

/**
 * Match the dose by value, not by text.
 *
 * Case records write "5.0 mg" where the licensed ladder says "5 mg" — the same
 * dose, spelled differently. Comparing strings made those recommendations
 * unparseable, so the screen declared a prescription amended when it was
 * identical to what was recommended, and demanded a reason for agreeing.
 */
function matchDose(rx: string, ladder: string[]): string | undefined {
  const mg = [...rx.matchAll(/(\d+(?:\.\d+)?)\s*mg/gi)].map((m) => Number(m[1]));
  return ladder.find((d) => mg.includes(Number(d.replace(/[^\d.]/g, ""))));
}

export const sameAsRecommended = (rx: Prescription, rec: Prescription | null) =>
  rec !== null && rx.med === rec.med && rx.dose === rec.dose && rx.weeks === rec.weeks;

/** A reason is what makes an amendment auditable, so it gates the button. */
export const amendmentReady = (rx: Prescription, rec: Prescription | null) =>
  sameAsRecommended(rx, rec) || (rx.reason?.trim().length ?? 0) > 0;

/**
 * What to pre-select when the reading recommends no prescription — a
 * discontinuation, a hold, a senior review. Falling back to a fixed product
 * put a drug on the screen nobody had asked for; the patient's own request is
 * at least the thing under discussion.
 */
export function fallbackFrom(med: string, dose: string): Prescription {
  const product = PRESCRIBABLE.find((p) => med.toLowerCase().includes(p.name.toLowerCase())) ?? PRESCRIBABLE[0];
  return {
    med: product.name,
    dose: matchDose(dose, product.doses) ?? product.doses[0],
    weeks: DEFAULT_WEEKS,
  };
}

export const prescriptionLabel = (rx: Prescription) =>
  `${rx.med} ${rx.dose} · ${rx.weeks}-week supply`;

export function PrescriptionPicker({
  recommended,
  recommendedText,
  value,
  onChange,
  disabled,
}: {
  /** parsed from the AI reading; null when it didn't recommend a script */
  recommended: Prescription | null;
  /** the AI's own words, shown verbatim so "departing from what?" is answered */
  recommendedText: string;
  value: Prescription;
  onChange: (next: Prescription) => void;
  disabled?: boolean;
}) {
  const product = PRESCRIBABLE.find((p) => p.name === value.med) ?? PRESCRIBABLE[0];
  const amended = !sameAsRecommended(value, recommended);

  /** Ladders differ per product, so the dose has to be re-pinned on a switch. */
  const pickMed = (name: string) => {
    const next = PRESCRIBABLE.find((p) => p.name === name)!;
    const keptDose = next.doses.includes(value.dose) ? value.dose : next.doses[0];
    onChange({ ...value, med: name, dose: keptDose });
  };

  return (
    <div
      className={`rounded-lg px-4 py-4 ${
        amended ? "bg-warning-lighter/50 ring-1 ring-warning/40" : "bg-background-neutral"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`text-[11px] font-bold uppercase tracking-wider ${
            amended ? "text-warning-darker" : "text-text-secondary"
          }`}
        >
          {amended ? "Amended prescription" : "Prescription"}
        </p>
        {amended && recommended && (
          <button
            type="button"
            onClick={() => onChange({ ...recommended })}
            className="text-xs font-bold text-text-secondary underline hover:text-text-primary"
          >
            Back to the recommendation
          </button>
        )}
        {!amended && (
          <span className="text-xs font-semibold text-success-dark">Matches the recommendation</span>
        )}
      </div>

      {/* naming what is being departed from — a warning that can't say what it
          disagrees with is just an obstacle */}
      {amended && (
        <p className="mt-1 text-xs leading-relaxed text-warning-darker">
          {recommended ? (
            <>
              The AI recommended <span className="font-bold">{recommendedText}</span>
            </>
          ) : (
            <>
              The AI did not recommend a prescription — it said{" "}
              <span className="font-bold">{recommendedText}</span>
            </>
          )}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESCRIBABLE.map((p) => {
          const on = p.name === value.med;
          const isRec = recommended?.med === p.name;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => pickMed(p.name)}
              disabled={disabled}
              aria-pressed={on}
              className={`rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                on
                  ? "border-primary bg-primary-lighter ring-1 ring-primary"
                  : "border-[var(--divider)] bg-background-paper hover:border-text-disabled"
              }`}
            >
              <span className={`block text-sm font-bold ${on ? "text-primary-darker" : "text-text-primary"}`}>
                {p.name}
              </span>
              <span className="block truncate text-[11px] text-text-secondary">{p.generic}</span>
              {isRec && (
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-success-dark">
                  Recommended
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-text-secondary">Dose</span>
          <Select
            value={value.dose}
            options={product.doses.map((d) => ({
              value: d,
              label: d,
              hint: recommended?.med === product.name && recommended.dose === d ? "recommended" : undefined,
            }))}
            onChange={(dose) => onChange({ ...value, dose })}
            disabled={disabled}
            buttonClassName="h-10 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-text-secondary">Supply</span>
          <Select
            value={String(value.weeks)}
            options={SUPPLY_WEEKS.map((w) => ({
              value: String(w),
              label: `${w} weeks`,
              hint: w === DEFAULT_WEEKS ? "standard" : undefined,
            }))}
            onChange={(w) => onChange({ ...value, weeks: Number(w) })}
            disabled={disabled}
            buttonClassName="h-10 text-sm"
          />
        </label>
      </div>

      {amended && (
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-bold text-warning-darker">
            Why this instead? <span className="font-normal">(goes on the audit trail)</span>
          </span>
          <textarea
            rows={2}
            value={value.reason ?? ""}
            onChange={(e) => onChange({ ...value, reason: e.target.value })}
            disabled={disabled}
            placeholder="e.g. tirzepatide not tolerated at 5 mg — stepping down rather than switching"
            className="w-full rounded-lg border border-[var(--divider)] bg-background-paper px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
          />
        </label>
      )}
    </div>
  );
}
