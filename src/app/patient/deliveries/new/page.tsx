"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StepperBar } from "@/components/ui/StepperBar";
import { CameraIcon, CheckIcon } from "@/components/ui/icons";
import { CameraCapture, YesNo } from "@/components/onboarding/parts";
import { TREATMENT, WEIGHT_LOG } from "@/lib/patient/data";
import { kgToStLb, numOf, stLbToKg, trim1, WEIGHT_UNITS, type WeightUnit } from "@/lib/onboarding/units";

/* ============================================================================
   Re-order wizard (FC-14) — a quick 4-step repeat request. Deliberately
   lighter than onboarding (no brand panel): the patient is known; what the
   prescriber needs fresh is the check-in, the weight and a live photo.
   Nothing ships until the prescriber approves — same rule as everywhere.
   ============================================================================ */

const STEPS = ["Your order", "Quick check-in", "Weight & photo", "Confirm"] as const;

const CHECKIN_QUESTIONS = [
  { key: "meds", q: "Started any new medication since your last order?" },
  { key: "sideEffects", q: "Any side effects beyond mild nausea or constipation?" },
  { key: "pregnancy", q: "Pregnant, breastfeeding, or planning a pregnancy?" },
] as const;

// The side effects that actually change what a prescriber does with a GLP-1
// repeat (hold the dose, slow titration, or stop). "Other" opens free text.
const SIDE_EFFECTS = [
  "Severe or persistent vomiting",
  "Severe stomach pain",
  "Persistent diarrhoea",
  "Dizziness or heart palpitations",
  "Injection-site reaction",
  "Low mood or anxiety changes",
] as const;
const OTHER = "Other";

export default function NewDeliveryPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // step 1 — dose
  const [doseChoice, setDoseChoice] = useState<"same" | "review" | null>(null);
  const [doseNote, setDoseNote] = useState("");
  // step 2 — check-in
  const [checkin, setCheckin] = useState<Record<string, "yes" | "no">>({});
  const [effects, setEffects] = useState<string[]>([]);
  const [effectsOther, setEffectsOther] = useState("");
  // step 3 — weight + photo
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [kgStr, setKgStr] = useState("");
  const [st, setSt] = useState("");
  const [lb, setLb] = useState("");
  const [lbTotal, setLbTotal] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const lastKg = WEIGHT_LOG[WEIGHT_LOG.length - 1].kg;
  const kg =
    unit === "kg"
      ? numOf(kgStr)
      : unit === "stlb"
        ? numOf(st) === null && numOf(lb) === null
          ? null
          : stLbToKg(numOf(st), numOf(lb))
        : numOf(lbTotal) === null
          ? null
          : (numOf(lbTotal) as number) / 2.2046226218;
  const kgValid = kg !== null && kg > 25 && kg < 400;

  const flagged = CHECKIN_QUESTIONS.some((q) => checkin[q.key] === "yes");
  const bigLoss = kgValid && (lastKg - kg!) / lastKg > 0.1;
  const bigGain = kgValid && (kg! - lastKg) / lastKg > 0.07;

  // a "yes" on side effects must be specified — that detail is what the
  // prescriber acts on (hold dose, slow titration, stop)
  const effectsComplete =
    checkin.sideEffects !== "yes" ||
    (effects.length > 0 && (!effects.includes(OTHER) || effectsOther.trim().length > 0));

  const effectsSummary = effects
    .map((e) => (e === OTHER ? effectsOther.trim() || "other" : e.toLowerCase()))
    .join(", ");

  const toggleEffect = (e: string) =>
    setEffects((es) => (es.includes(e) ? es.filter((x) => x !== e) : [...es, e]));

  const canContinue =
    step === 0
      ? doseChoice !== null
      : step === 1
        ? CHECKIN_QUESTIONS.every((q) => checkin[q.key]) && effectsComplete
        : step === 2
          ? kgValid && photoUrl !== ""
          : true;

  const switchUnit = (u: WeightUnit) => {
    if (kg !== null && u !== unit) {
      if (u === "kg") setKgStr(trim1(kg));
      else if (u === "stlb") {
        const p = kgToStLb(kg);
        setSt(String(p.st));
        setLb(String(p.lb));
      } else setLbTotal(String(Math.round(kg * 2.2046226218)));
    }
    setUnit(u);
  };

  const inputCls =
    "h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 font-mono text-lg font-bold text-text-primary focus:border-primary focus:outline-none";

  if (submitted) {
    return (
      <div>
        <PageHeader title="Renew your prescription" subtitle={`${TREATMENT.med} · repeat order`} />
        <div className="px-6 py-10 lg:px-8">
          <div className="mx-auto max-w-xl rounded-lg bg-background-paper p-8 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-lighter text-success-dark">
              <CheckIcon width={24} height={24} />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-text-primary">Request sent to your prescriber</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
              {flagged || bigLoss || bigGain
                ? "Your check-in raised something the prescriber will look at personally — you may get a message before it's approved."
                : "Everything looks routine, so this should be reviewed quickly — usually within 24 hours."}{" "}
              You&rsquo;ll only be charged when it&rsquo;s approved.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/patient/deliveries" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
                Back to deliveries
              </Link>
              <Link href="/patient" className="rounded-lg border border-[var(--divider)] px-5 py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Renew your prescription" subtitle={`${TREATMENT.med} · repeat order`} />

      <div className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          {/* stepper */}
          <StepperBar steps={STEPS} current={step} />

          <div className="mt-6 rounded-lg bg-background-paper p-6 shadow-card">
            {step === 0 && (
              <>
                <h2 className="text-lg font-extrabold text-text-primary">Confirm your order</h2>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--divider)] px-4 py-3">
                  <div>
                    <p className="text-base font-extrabold text-text-primary">{TREATMENT.shortName} {TREATMENT.dose}</p>
                    <p className="font-mono text-[11px] tracking-wide text-text-secondary">4 doses · {TREATMENT.pharmacy}</p>
                  </div>
                  <p className="font-mono text-lg font-extrabold text-text-primary">
                    £{TREATMENT.priceMo}
                    <span className="text-xs font-bold text-text-secondary">/mo</span>
                  </p>
                </div>
                <div className="mt-4 space-y-2.5">
                  <ChoiceCard
                    label={`Continue at ${TREATMENT.dose}`}
                    desc="Same dose as your current supply — the routine option."
                    selected={doseChoice === "same"}
                    onClick={() => setDoseChoice("same")}
                  />
                  <ChoiceCard
                    label="Ask my prescriber to review my dose"
                    desc="Tell them how the current dose feels; they'll decide the next step."
                    selected={doseChoice === "review"}
                    onClick={() => setDoseChoice("review")}
                  />
                </div>
                {doseChoice === "review" && (
                  <textarea
                    rows={3}
                    value={doseNote}
                    onChange={(e) => setDoseNote(e.target.value)}
                    placeholder="e.g. appetite coming back in the last week of the cycle…"
                    className="mt-3 w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none"
                  />
                )}
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-extrabold text-text-primary">Quick check-in</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  A &ldquo;yes&rdquo; doesn&rsquo;t block your order — it routes it to your prescriber with context.
                </p>
                <div className="mt-2 divide-y divide-[var(--divider)]">
                  {CHECKIN_QUESTIONS.map((q) => (
                    <div key={q.key} className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-text-primary">{q.q}</span>
                        <YesNo value={checkin[q.key]} onChange={(v) => setCheckin((c) => ({ ...c, [q.key]: v }))} />
                      </div>
                      {q.key === "sideEffects" && checkin.sideEffects === "yes" && (
                        <div className="mt-3 rounded-xl bg-background-neutral p-4">
                          <p className="text-sm font-semibold text-text-primary">Which of these?</p>
                          <p className="mt-0.5 text-xs text-text-secondary">
                            Select all that apply — this is what your prescriber acts on.
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {[...SIDE_EFFECTS, OTHER].map((e) => {
                              const on = effects.includes(e);
                              return (
                                <button
                                  key={e}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => toggleEffect(e)}
                                  className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                                    on
                                      ? "border-primary bg-primary-lighter text-primary-dark"
                                      : "border-[var(--divider)] bg-background-paper text-text-secondary hover:border-primary-light hover:text-text-primary"
                                  }`}
                                >
                                  {on ? "✓ " : ""}{e}
                                </button>
                              );
                            })}
                          </div>
                          {effects.includes(OTHER) && (
                            <input
                              type="text"
                              value={effectsOther}
                              onChange={(e) => setEffectsOther(e.target.value)}
                              placeholder="Describe what you're experiencing…"
                              className="mt-3 h-11 w-full rounded-lg border border-[var(--divider)] bg-background-paper px-3 text-sm focus:border-primary focus:outline-none"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {flagged && (
                  <p className="rounded-lg bg-warning-lighter px-3 py-2.5 text-xs leading-relaxed text-warning-darker">
                    Thanks for the honesty — your prescriber will review this personally before approving.
                  </p>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-text-primary">Today&rsquo;s weight</h2>
                  <div role="group" aria-label="Weight unit" className="flex gap-0.5 rounded-full bg-[var(--divider)]/40 p-0.5">
                    {WEIGHT_UNITS.map((u) => (
                      <button
                        key={u.key}
                        type="button"
                        aria-pressed={u.key === unit}
                        onClick={() => switchUnit(u.key)}
                        className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                          u.key === unit ? "bg-background-paper text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`mt-3 grid gap-2 ${unit === "stlb" ? "grid-cols-2" : "grid-cols-1"}`}>
                  {unit === "kg" && (
                    <div className="relative">
                      <input type="number" inputMode="decimal" placeholder={String(lastKg)} value={kgStr} onChange={(e) => setKgStr(e.target.value)} className={inputCls} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">kg</span>
                    </div>
                  )}
                  {unit === "stlb" && (
                    <>
                      <div className="relative">
                        <input type="number" inputMode="decimal" placeholder="14" value={st} onChange={(e) => setSt(e.target.value)} className={inputCls} />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">st</span>
                      </div>
                      <div className="relative">
                        <input type="number" inputMode="decimal" placeholder="7" value={lb} onChange={(e) => setLb(e.target.value)} className={inputCls} />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">lb</span>
                      </div>
                    </>
                  )}
                  {unit === "lb" && (
                    <div className="relative">
                      <input type="number" inputMode="decimal" placeholder="203" value={lbTotal} onChange={(e) => setLbTotal(e.target.value)} className={inputCls} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">lb</span>
                    </div>
                  )}
                </div>
                {kgValid && unit !== "kg" && <p className="mt-1.5 font-mono text-xs text-text-secondary">= {trim1(kg!)} kg</p>}
                {(bigLoss || bigGain) && (
                  <p className="mt-2 rounded-lg bg-warning-lighter px-3 py-2.5 text-xs leading-relaxed text-warning-darker">
                    {bigLoss ? "More than 10% down" : "More than 7% up"} since your last order — your pharmacy&rsquo;s
                    protocol asks the prescriber to confirm before issuing.
                  </p>
                )}

                <h3 className="mt-6 text-sm font-extrabold text-text-primary">Live weight photo</h3>
                <p className="mb-3 mt-0.5 text-xs text-text-secondary">Full-length, taken now — it verifies the number above.</p>
                <CameraCapture
                  icon={<CameraIcon width={26} height={26} />}
                  captureLabel="Open camera"
                  facing="user"
                  imageUrl={photoUrl}
                  onCapture={setPhotoUrl}
                  onRetake={() => setPhotoUrl("")}
                  note="Must be taken live on your camera now — gallery uploads aren't accepted."
                />
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-extrabold text-text-primary">Confirm your request</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-[var(--divider)]">
                  {[
                    ["Order", `${TREATMENT.shortName} ${TREATMENT.dose} · 4 doses`],
                    ["Dose", doseChoice === "same" ? "Continue current dose" : "Prescriber dose review requested"],
                    [
                      "Check-in",
                      flagged
                        ? checkin.sideEffects === "yes" && effectsSummary
                          ? `Flagged — ${effectsSummary}`
                          : "Flagged for prescriber attention"
                        : "All clear",
                    ],
                    ["Weight", `${trim1(kg ?? 0)} kg · live photo attached`],
                    ["Price", `£${TREATMENT.priceMo}/mo · charged on approval only`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-[var(--divider)] px-4 py-3 text-sm last:border-0">
                      <span className="text-text-secondary">{k}</span>
                      <span className="text-right font-semibold text-text-primary">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-xs leading-relaxed text-primary-dark">
                  A prescriber reviews this against {TREATMENT.pharmacy}&rsquo;s protocol before anything is dispensed
                  or charged.
                </p>
              </>
            )}

            {/* footer */}
            <div className="mt-6 flex items-center justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral"
                >
                  Back
                </button>
              ) : (
                <Link
                  href="/patient/deliveries"
                  className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral"
                >
                  Cancel
                </Link>
              )}
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => (step === STEPS.length - 1 ? setSubmitted(true) : setStep((s) => s + 1))}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
              >
                {step === STEPS.length - 1 ? "Send to prescriber" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChoiceCard({ label, desc, selected, onClick }: { label: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors ${
        selected ? "border-primary bg-primary-lighter" : "border-[var(--divider)] bg-background-paper hover:border-primary-light"
      }`}
    >
      <span className="flex-1">
        <span className="block text-sm font-extrabold text-text-primary">{label}</span>
        <span className="mt-0.5 block text-xs text-text-secondary">{desc}</span>
      </span>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-primary bg-primary text-white" : "border-grey-300"
        }`}
      >
        {selected && <CheckIcon width={12} height={12} />}
      </span>
    </button>
  );
}
