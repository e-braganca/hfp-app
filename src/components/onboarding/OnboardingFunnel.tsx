"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CameraIcon, CheckIcon, IdIcon } from "@/components/ui/icons";
import {
  CONDITIONS,
  ETHNIC_GROUPS,
  MEDS,
  PHASES,
  PHONE_COUNTRIES,
  SAFETY_QUESTIONS,
  STEPS,
  TREATMENT_OPTIONS,
} from "@/lib/onboarding/constants";
import {
  addressSummary,
  age,
  bmi,
  bmiThreshold,
  canContinue,
  computeOutcome,
  emptyAnswers,
  ethnicityLabel,
  ukPostcodeValid,
  expiryMonthInvalid,
  formatCardExpiry,
  formatCardNumber,
  formatCvc,
  hardContra,
  measureSummary,
  withCanonicalDob,
  withCanonicalMeasures,
  withHeightUnit,
  withWeightUnit,
  type Answers,
  type Outcome,
} from "@/lib/onboarding/logic";
import {
  HEIGHT_UNITS,
  WEIGHT_UNITS,
  type HeightUnit,
  type WeightUnit,
} from "@/lib/onboarding/units";
import { setPendingVerification } from "@/lib/verification";
import {
  CameraCapture,
  OptionCard,
  ResultRing,
  StepHeading,
  SummaryCard,
  YesNo,
} from "./parts";

const TOTAL = STEPS.length; // 13

export function OnboardingFunnel() {
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [a, setAnswers] = useState<Answers>(emptyAnswers);

  const setA = (patch: Partial<Answers>) => setAnswers((prev) => ({ ...prev, ...patch }));
  /** measure fields feed the canonical cm/kg on every keystroke */
  const setMeasure = (patch: Partial<Answers>) =>
    setAnswers((prev) => withCanonicalMeasures({ ...prev, ...patch }));
  /** dob part fields feed the canonical ISO dob the same way */
  const setDob = (patch: Partial<Answers>) =>
    setAnswers((prev) => withCanonicalDob({ ...prev, ...patch }));
  const key = STEPS[step];

  const next = () => {
    if (key === "safety") {
      const o = computeOutcome(a);
      if (o) {
        setOutcome(o);
        return;
      }
    }
    if (key === "payment") {
      // deferred captures put the order on hold — the patient dashboard picks
      // this up and routes to the catch-up wizard
      if (!a.weightPhoto || !a.idDoc) {
        setPendingVerification({
          weightPhoto: !a.weightPhoto,
          idDoc: !a.idDoc,
          deferredAt: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        });
      } else {
        setPendingVerification(null);
      }
      setOutcome("submitted");
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL - 1));
  };

  const back = () => {
    if (outcome && outcome !== "submitted") {
      setOutcome(null);
      setStep(STEPS.indexOf("safety"));
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const progress = step === 0 ? 0 : Math.round((step / (TOTAL - 1)) * 100);
  const ctaLabel =
    key === "intro"
      ? "Begin assessment"
      : key === "account"
        ? "Create account & continue"
        : key === "address"
          ? "Save delivery address"
          : key === "review"
            ? "Continue to payment"
            : key === "payment"
              ? "Confirm order"
              : "Continue";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
      <LeftPanel step={step} outcome={outcome} />

      <div className="flex min-h-screen flex-col bg-background-neutral">
        {/* top bar */}
        <div className="sticky top-0 z-10 bg-background-neutral px-6 pt-5 lg:px-16">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>{outcome ? " " : `Step ${step + 1} of ${TOTAL}`}</span>
            <a href="#" className="hover:text-text-primary">Need help?</a>
          </div>
          {!outcome && (
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-grey-200">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
          {/* mobile wordmark */}
          <div className="mt-4 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-dark.svg" alt="Prescriptr" className="h-5 w-auto" />
          </div>
        </div>

        {/* content */}
        <main className="flex flex-1 items-center px-6 py-10 lg:px-16">
          <div className="mx-auto w-full max-w-lg">
            {outcome
              ? renderOutcome(outcome, a, back)
              : renderStep(key, a, setA, setMeasure, setDob, next)}
          </div>
        </main>

        {/* footer */}
        {!outcome && (
          <div
            className="sticky bottom-0 flex items-center gap-3 border-t border-[var(--divider)] bg-background-neutral px-6 py-4 lg:px-16"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                aria-label="Back"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--divider)] bg-background-paper text-text-primary hover:bg-background-neutral"
              >
                <ArrowLeft width={18} height={18} />
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!canContinue(key, a)}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
            >
              {ctaLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Left brand / phase panel ---------------------------------------------

function LeftPanel({ step, outcome }: { step: number; outcome: Outcome }) {
  const phaseState = (steps: number[]): "done" | "active" | "upcoming" => {
    if (outcome === "submitted") return "done";
    if (steps.includes(step)) return "active";
    if (Math.max(...steps) < step) return "done";
    return "upcoming";
  };

  return (
    // sticky so the phase list stays visible on long steps (the ethnicity list runs past one screen)
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-darker via-primary-dark to-primary p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-white.svg" alt="Prescriptr" className="h-5 w-auto self-start" />

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary-lighter">
          GLP-1 Weight Management
        </p>
        <h2 className="mt-3 max-w-sm text-4xl font-extrabold leading-tight tracking-tight">
          A few questions between you and clinical care.
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/70">
          A GPhC-registered prescriber reviews every answer before anything is dispensed.
        </p>

        <ol className="mt-8 space-y-4">
          {PHASES.map((p, i) => {
            const state = phaseState(p.steps);
            return (
              <li key={p.label} className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    state === "done"
                      ? "bg-white/25 text-white"
                      : state === "active"
                        ? "bg-white text-primary-darker"
                        : "bg-white/10 text-white/50"
                  }`}
                >
                  {state === "done" ? <CheckIcon width={15} height={15} /> : i + 1}
                </span>
                <span className={`text-sm font-semibold ${state === "upcoming" ? "text-white/45" : "text-white"}`}>
                  {p.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div>
        <p className="text-sm font-semibold text-warning-light">★★★★★ Rated 4.9 / 5 by 2,400+ patients</p>
        <p className="mt-1 text-xs text-white/50">GPhC-registered prescribers · CQC-regulated UK pharmacy</p>
      </div>
    </aside>
  );
}

// ---- Step content ---------------------------------------------------------

function renderStep(
  key: string,
  a: Answers,
  setA: (p: Partial<Answers>) => void,
  setMeasure: (p: Partial<Answers>) => void,
  setDob: (p: Partial<Answers>) => void,
  next: () => void,
) {
  switch (key) {
    case "intro":
      return (
        <div>
          <StepHeading
            eyebrow="Start your assessment"
            title="Start your weight-loss consultation"
            sub="A few questions to check if a clinically-supervised GLP-1 treatment (Wegovy or Mounjaro) is right and safe for you."
          />
          <ul className="space-y-3">
            {["Takes about 5 minutes", "Reviewed by a UK prescriber, not a bot", "Your data is encrypted and private"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-base font-semibold text-text-primary">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-lighter text-primary-dark">
                  <CheckIcon width={15} height={15} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      );

    case "sex":
      return (
        <div>
          <StepHeading eyebrow="About you" title="What sex were you registered at birth?" sub="This affects clinical dosing and safety checks." />
          <div className="space-y-3">
            {(["female", "male"] as const).map((s) => (
              <OptionCard key={s} label={s === "female" ? "Female" : "Male"} selected={a.sex === s} onClick={() => setA({ sex: s })} />
            ))}
          </div>
        </div>
      );

    case "dob": {
      const yrs = age(a);
      const parts = [
        { field: "dobDay" as const, label: "Day", placeholder: "DD", max: 2, width: "" },
        { field: "dobMonth" as const, label: "Month", placeholder: "MM", max: 2, width: "" },
        { field: "dobYear" as const, label: "Year", placeholder: "YYYY", max: 4, width: "flex-[1.6]" },
      ];
      return (
        <div>
          <StepHeading eyebrow="About you" title="What's your date of birth?" sub="Treatment is available for adults aged 18–74." />
          <div className="flex gap-3">
            {parts.map((p) => (
              <label key={p.field} className={`block flex-1 ${p.width}`}>
                <span className="mb-1.5 block text-sm text-text-secondary">{p.label}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete={p.field === "dobDay" ? "bday-day" : p.field === "dobMonth" ? "bday-month" : "bday-year"}
                  maxLength={p.max}
                  placeholder={p.placeholder}
                  value={a[p.field]}
                  onChange={(e) => setDob({ [p.field]: e.target.value.replace(/\D/g, "") })}
                  className="h-14 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-center font-mono text-xl font-bold text-text-primary focus:border-primary focus:outline-none"
                />
              </label>
            ))}
          </div>
          {yrs !== null && yrs >= 18 && (
            <p className="mt-3 text-sm text-text-secondary">
              You are <span className="font-bold text-text-primary">{yrs}</span> years old.
            </p>
          )}
          {yrs !== null && yrs < 18 && (
            <p className="mt-3 rounded-lg bg-error-lighter px-4 py-3 text-sm font-semibold text-error-dark">
              You must be 18 or over to use this service.
            </p>
          )}
        </div>
      );
    }

    case "measure": {
      const b = bmi(a);
      const th = bmiThreshold(a);
      return (
        <div>
          <StepHeading eyebrow="About you" title="Your height and weight" sub="We use these to calculate your BMI, a key eligibility factor." />
          {/* always stacked: the layout stays put when the unit switch changes */}
          <div className="flex flex-col gap-5">
            <MeasureField
              label="Height"
              units={HEIGHT_UNITS}
              current={a.heightUnit}
              onUnit={(u) => setA(withHeightUnit(a, u as HeightUnit))}
              parts={
                a.heightUnit === "cm"
                  ? [{ field: "heightCm", placeholder: "175", suffix: "cm" }]
                  : [
                      { field: "heightFt", placeholder: "5", suffix: "ft" },
                      { field: "heightIn", placeholder: "9", suffix: "in" },
                    ]
              }
              answers={a}
              onChange={setMeasure}
            />
            <MeasureField
              label="Weight"
              units={WEIGHT_UNITS}
              current={a.weightUnit}
              onUnit={(u) => setA(withWeightUnit(a, u as WeightUnit))}
              parts={
                a.weightUnit === "kg"
                  ? [{ field: "weightKg", placeholder: "92", suffix: "kg" }]
                  : a.weightUnit === "stlb"
                    ? [
                        { field: "weightSt", placeholder: "14", suffix: "st" },
                        { field: "weightLb", placeholder: "7", suffix: "lb" },
                      ]
                    : [{ field: "weightLbTotal", placeholder: "203", suffix: "lb" }]
              }
              answers={a}
              onChange={setMeasure}
            />
          </div>
          {b !== null && (
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-[var(--divider)] bg-background-paper px-5 py-4">
              <div>
                <div className="font-mono text-3xl font-extrabold text-text-primary">{b.toFixed(1)}</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Your BMI</div>
              </div>
              <p className="text-sm text-text-secondary">
                {bmiCategory(b)}. {b >= th ? "Above the treatment threshold." : "Below the current threshold for your profile."}
              </p>
            </div>
          )}
        </div>
      );
    }

    case "ethnicity":
      return (
        <div>
          <StepHeading eyebrow="About you" title="What's your ethnic background?" sub="For some backgrounds the BMI threshold is adjusted to 27.5, reflecting higher metabolic risk. If you'd rather not say, we use the standard threshold of 30." />
          <div className="space-y-2.5">
            {ETHNIC_GROUPS.map(({ group, options }) => (
              <div key={group} className="space-y-2.5 pt-3 first:pt-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                  {group}
                </p>
                {options.map((o) => (
                  <OptionCard key={o.key} label={o.label} selected={a.ethnicity === o.key} onClick={() => setA({ ethnicity: o.key })} />
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case "conditions": {
      const toggle = (k: string) =>
        setA({ conditions: a.conditions.includes(k) ? a.conditions.filter((c) => c !== k) : [...a.conditions, k] });
      return (
        <div>
          <StepHeading eyebrow="About you" title="Do you have any of these conditions?" sub="Select all that apply. Some lower the BMI threshold to 27." />
          <div className="space-y-2.5">
            {CONDITIONS.map((o) => (
              <OptionCard key={o.key} label={o.label} selected={a.conditions.includes(o.key)} onClick={() => toggle(o.key)} />
            ))}
            <OptionCard label="None of these" selected={a.conditions.length === 0} onClick={() => setA({ conditions: [] })} />
          </div>
        </div>
      );
    }

    case "meds":
      return (
        <div>
          <StepHeading eyebrow="About you" title="Are you currently taking any of these?" sub="Be honest — this is a safety check, not a disqualifier." />
          <div className="space-y-3">
            {MEDS.map((o) => (
              <OptionCard key={o.key} label={o.label} selected={a.meds === o.key} onClick={() => setA({ meds: o.key as Answers["meds"] })} />
            ))}
          </div>
          {a.meds === "glp1" && (
            <p className="mt-4 rounded-lg bg-warning-lighter px-4 py-3 text-sm text-warning-darker">
              Let the prescriber know your current dose — they’ll continue your titration safely rather than restarting.
            </p>
          )}
        </div>
      );

    case "safety":
      return (
        <div>
          <StepHeading eyebrow="Safety screening" title="A few important safety questions" sub="These help us rule out situations where GLP-1 treatment isn't safe." />
          <div className="divide-y divide-[var(--divider)]">
            {SAFETY_QUESTIONS.map((q) => (
              <div key={q.key} className="flex items-center justify-between gap-4 py-4">
                <span className="text-sm text-text-primary">{q.q}</span>
                <YesNo value={a.safety[q.key]} onChange={(v) => setA({ safety: { ...a.safety, [q.key]: v } })} />
              </div>
            ))}
          </div>
        </div>
      );

    case "eligible":
      return (
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-lighter px-3 py-1 text-xs font-bold text-success-darker">
            <CheckIcon width={13} height={13} /> Eligible
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-text-primary">Good news, you meet the criteria</h1>
          <p className="mt-2 text-base text-text-secondary">
            Based on your answers you’re eligible for a prescriber to review your consultation. Create your account to
            save this result, then we’ll verify your identity and current weight.
          </p>
          <div className="mt-6">
            <SummaryCard
              rows={[
                { label: "BMI", value: `${bmi(a)?.toFixed(1)} kg/m²` },
                { label: "Age", value: age(a) },
                { label: "Safety screening", value: "No contraindications flagged" },
              ]}
            />
          </div>
        </div>
      );

    case "photo":
      return (
        <div>
          <StepHeading eyebrow="Verification" title="Take a live weight photo" sub="A full-length photo taken right now on your camera." />
          <CameraCapture
            icon={<CameraIcon width={26} height={26} />}
            captureLabel="Open camera"
            facing="user"
            imageUrl={a.weightPhotoUrl}
            onCapture={(url) => setA({ weightPhoto: true, weightPhotoUrl: url, weightPhotoDeferred: false })}
            onRetake={() => setA({ weightPhoto: false, weightPhotoUrl: "" })}
            note="Must be taken live on your camera now — gallery uploads aren't accepted."
          />
          {!a.weightPhoto && (
            <DeferChoice
              deferred={a.weightPhotoDeferred}
              onToggle={(v) => setA({ weightPhotoDeferred: v })}
              what="weight photo"
            />
          )}
        </div>
      );

    case "id":
      return (
        <div>
          <StepHeading eyebrow="Verification" title="Verify your identity" sub="Photograph your passport or UK driving licence." />
          <CameraCapture
            icon={<IdIcon width={26} height={26} />}
            captureLabel="Capture ID"
            facing="environment"
            imageUrl={a.idDocUrl}
            onCapture={(url) => setA({ idDoc: true, idDocUrl: url, idDocDeferred: false })}
            onRetake={() => setA({ idDoc: false, idDocUrl: "" })}
            note="A prescriber will visually confirm your ID matches your weight photo before issuing."
          />
          {!a.idDoc && (
            <DeferChoice
              deferred={a.idDocDeferred}
              onToggle={(v) => setA({ idDocDeferred: v })}
              what="ID photo"
            />
          )}
        </div>
      );

    case "account":
      return (
        <div>
          <StepHeading
            eyebrow="Your account"
            title="Create your account to continue"
            sub="Your eligibility result is saved to it, and it's where you'll track your treatment after approval."
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input
                  type="text"
                  autoComplete="given-name"
                  value={a.firstName}
                  onChange={(e) => setA({ firstName: e.target.value })}
                  placeholder="Alex"
                  className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Last name">
                <input
                  type="text"
                  autoComplete="family-name"
                  value={a.lastName}
                  onChange={(e) => setA({ lastName: e.target.value })}
                  placeholder="Morgan"
                  className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
                />
              </Field>
            </div>
            <Field label="Email address">
              <input
                type="email"
                autoComplete="email"
                value={a.email}
                onChange={(e) => setA({ email: e.target.value })}
                placeholder="you@email.com"
                className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
              />
            </Field>
            <Field label="Mobile number">
              <div className="flex gap-2">
                <div className="relative shrink-0">
                  <select
                    aria-label="Country code"
                    value={a.mobileCountry}
                    onChange={(e) => setA({ mobileCountry: e.target.value })}
                    className="h-12 appearance-none rounded-xl border-2 border-[var(--divider)] bg-background-paper pl-3 pr-8 font-mono text-base font-semibold text-text-primary focus:border-primary focus:outline-none"
                  >
                    {PHONE_COUNTRIES.map((c) => (
                      <option key={c.dial + c.label} value={c.dial}>
                        {c.flag} {c.dial}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary">▾</span>
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={a.mobile}
                  onChange={(e) => setA({ mobile: e.target.value.replace(/[^\d\s]/g, "") })}
                  placeholder={a.mobileCountry === "+44" ? "07123 456789" : "Mobile number"}
                  className="h-12 min-w-0 flex-1 rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Password">
              <input
                type="password"
                autoComplete="new-password"
                value={a.password}
                onChange={(e) => setA({ password: e.target.value })}
                placeholder="At least 8 characters"
                className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
              />
              {a.password.length > 0 && a.password.length < 8 && (
                <p className="mt-1.5 text-xs font-semibold text-warning-dark">
                  {8 - a.password.length} more character{8 - a.password.length === 1 ? "" : "s"} needed — minimum is 8.
                </p>
              )}
            </Field>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={a.consent}
                onChange={(e) => setA({ consent: e.target.checked })}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary-main)]"
              />
              I consent to a GPhC-registered prescriber reviewing my information — including my ethnicity answer, which
              is health data — to assess suitability for treatment.
            </label>
          </div>
        </div>
      );

    case "address": {
      const badPostcode = a.postcode.trim() !== "" && !ukPostcodeValid(a.postcode);
      return (
        <div>
          <StepHeading
            eyebrow="Delivery"
            title="Where should we deliver your treatment?"
            sub="If a prescriber approves you, this is where your medication ships — cold-chain and signed for, so use an address where someone can receive it."
          />
          <div className="space-y-4">
            <Field label="Address line 1">
              <input
                type="text"
                autoComplete="address-line1"
                value={a.addr1}
                onChange={(e) => setA({ addr1: e.target.value })}
                placeholder="42 Bramble Road"
                className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
              />
            </Field>
            <Field label="Address line 2 (optional)">
              <input
                type="text"
                autoComplete="address-line2"
                value={a.addr2}
                onChange={(e) => setA({ addr2: e.target.value })}
                placeholder="Flat 3"
                className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
              />
            </Field>
            <div className="grid grid-cols-[1.4fr_1fr] gap-3">
              <Field label="Town / City">
                <input
                  type="text"
                  autoComplete="address-level2"
                  value={a.city}
                  onChange={(e) => setA({ city: e.target.value })}
                  placeholder="Manchester"
                  className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label="Postcode">
                <input
                  type="text"
                  autoComplete="postal-code"
                  maxLength={8}
                  value={a.postcode}
                  onChange={(e) => setA({ postcode: e.target.value.toUpperCase() })}
                  placeholder="M1 4BT"
                  className={`h-12 w-full rounded-xl border-2 bg-background-paper px-4 font-mono text-base text-text-primary focus:outline-none ${
                    badPostcode ? "border-error focus:border-error" : "border-[var(--divider)] focus:border-primary"
                  }`}
                />
                {badPostcode && (
                  <p className="mt-1.5 text-xs font-semibold text-error-dark">Enter a valid UK postcode, e.g. M1 4BT.</p>
                )}
              </Field>
            </div>
            <Field label="Delivery notes (optional)">
              <input
                type="text"
                value={a.deliveryNote}
                onChange={(e) => setA({ deliveryNote: e.target.value })}
                placeholder="Safe place, buzzer code, best time…"
                className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
              />
            </Field>
          </div>
          <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-xs leading-relaxed text-primary-dark">
            We only deliver within the UK, and nothing ships until a prescriber approves your consultation.
          </p>
        </div>
      );
    }

    case "treatment":
      return (
        <div>
          <StepHeading
            eyebrow="Treatment"
            title="Which treatment would you prefer?"
            sub="This is a preference, not a prescription — your prescriber confirms the right treatment for your profile before anything is dispensed."
          />
          <div className="space-y-3">
            {TREATMENT_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setA({ treatment: t.key })}
                className={`flex w-full items-start gap-4 rounded-xl border-2 px-5 py-4 text-left transition-colors ${
                  a.treatment === t.key
                    ? "border-primary bg-primary-lighter"
                    : "border-[var(--divider)] bg-background-paper hover:border-primary-light"
                }`}
              >
                <span className="flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-base font-extrabold text-text-primary">{t.name}</span>
                    <span className="font-mono text-[11px] tracking-wide text-text-secondary">{t.generic}</span>
                    {t.tag && (
                      <span className="rounded-full bg-warning-lighter px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-warning-darker">
                        {t.tag}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-text-secondary">{t.desc}</span>
                </span>
                <span className="whitespace-nowrap pt-0.5 font-mono text-sm font-bold text-text-primary">
                  {t.priceMo ? `£${t.priceMo}/mo` : "price at review"}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-text-secondary">
            Looking for Ozempic? In the UK it’s licensed for type 2 diabetes, not weight loss — Wegovy is the same
            active ingredient (semaglutide) licensed for weight management.
          </p>
        </div>
      );

    case "payment": {
      const chosen = TREATMENT_OPTIONS.find((t) => t.key === a.treatment);
      return (
        <div>
          <StepHeading
            eyebrow="Checkout"
            title="Confirm your order"
            sub="Your card is saved now but only charged after a prescriber approves your treatment. Declined? You pay nothing."
          />
          <div className="mb-5 flex items-center justify-between rounded-xl border border-[var(--divider)] bg-background-paper px-5 py-4">
            <div>
              <p className="text-base font-extrabold text-text-primary">{chosen?.name ?? "Treatment"}</p>
              <p className="font-mono text-[11px] tracking-wide text-text-secondary">{chosen?.generic}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xl font-extrabold text-text-primary">
                {chosen?.priceMo ? `£${chosen.priceMo}` : "£—"}
                <span className="text-xs font-bold text-text-secondary">/mo</span>
              </p>
              <p className="text-[11px] text-text-secondary">charged on approval only</p>
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Card number">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={a.cardNumber}
                onChange={(e) => setA({ cardNumber: formatCardNumber(e.target.value) })}
                placeholder="4242 4242 4242 4242"
                className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 font-mono text-base text-text-primary focus:border-primary focus:outline-none"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={5}
                  value={a.cardExpiry}
                  onChange={(e) => setA({ cardExpiry: formatCardExpiry(e.target.value, a.cardExpiry) })}
                  placeholder="MM/YY"
                  className={`h-12 w-full rounded-xl border-2 bg-background-paper px-4 font-mono text-base text-text-primary focus:outline-none ${
                    expiryMonthInvalid(a.cardExpiry)
                      ? "border-error focus:border-error"
                      : "border-[var(--divider)] focus:border-primary"
                  }`}
                />
                {expiryMonthInvalid(a.cardExpiry) && (
                  <p className="mt-1.5 text-xs font-semibold text-error-dark">Month must be between 01 and 12.</p>
                )}
              </Field>
              <Field label="CVC">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={a.cardCvc}
                  onChange={(e) => setA({ cardCvc: formatCvc(e.target.value) })}
                  placeholder="123"
                  className="h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 font-mono text-base text-text-primary focus:border-primary focus:outline-none"
                />
              </Field>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-xs leading-relaxed text-primary-dark">
            Demo checkout — no payment details are processed or stored. In production this is a tokenised card
            authorisation; the charge only fires when the prescriber approves.
          </p>
        </div>
      );
    }

    case "review":
      return (
        <div>
          <StepHeading eyebrow="Almost done" title="Check your answers" sub="Make sure everything's right before a prescriber reviews it." />
          <SummaryCard
            rows={[
              { label: "Name", value: `${a.firstName} ${a.lastName}`.trim() || "—" },
              { label: "Sex at birth", value: a.sex === "female" ? "Female" : "Male" },
              { label: "Age", value: age(a) },
              { label: "Height / weight", value: measureSummary(a) },
              { label: "BMI", value: `${bmi(a)?.toFixed(1)} kg/m²` },
              { label: "Ethnic background", value: ethnicityLabel(a) },
              { label: "Conditions", value: a.conditions.length ? a.conditions.map((c) => CONDITIONS.find((x) => x.key === c)?.label).join(", ") : "None" },
              {
                label: "Verification",
                value:
                  a.weightPhoto && a.idDoc
                    ? "Weight photo + ID captured"
                    : `On hold — ${[!a.weightPhoto && "weight photo", !a.idDoc && "ID photo"]
                        .filter(Boolean)
                        .join(" + ")} from your dashboard`,
              },
              {
                label: "Treatment preference",
                value: TREATMENT_OPTIONS.find((t) => t.key === a.treatment)?.name ?? "—",
              },
              { label: "Contact", value: `${a.email} · ${a.mobileCountry} ${a.mobile}` },
              { label: "Delivery address", value: addressSummary(a) || "—" },
            ]}
          />
          <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-sm text-primary-dark">
            After payment is confirmed, your consultation enters clinical triage where it’s auto-scored against the pharmacy’s SOP and reviewed by a prescriber — usually within 24 hours.
          </p>
        </div>
      );

    default:
      return null;
  }
}

type MeasurePart = { field: keyof Answers; placeholder: string; suffix: string };

/** One labelled measurement + its unit switch; one or two boxes depending on the unit. */
function MeasureField({
  label,
  units,
  current,
  onUnit,
  parts,
  answers,
  onChange,
}: {
  label: string;
  units: { key: string; label: string }[];
  current: string;
  onUnit: (u: string) => void;
  parts: MeasurePart[];
  answers: Answers;
  onChange: (p: Partial<Answers>) => void;
}) {
  return (
    <div className="flex-1">
      <div className="mb-1.5 flex min-h-7 items-center justify-between gap-3">
        <span className="text-sm text-text-secondary">{label}</span>
        <div role="group" aria-label={`${label} unit`} className="flex gap-0.5 rounded-full bg-[var(--divider)]/40 p-0.5">
          {units.map((u) => (
            <button
              key={u.key}
              type="button"
              aria-pressed={u.key === current}
              onClick={() => onUnit(u.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                u.key === current
                  ? "bg-background-paper text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>
      <div className={parts.length > 1 ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
        {parts.map((p) => (
          <span key={p.field} className="relative flex items-center">
            <input
              type="number"
              inputMode="decimal"
              placeholder={p.placeholder}
              aria-label={`${label} (${p.suffix})`}
              value={answers[p.field] as string}
              onChange={(e) => onChange({ [p.field]: e.target.value } as Partial<Answers>)}
              className="h-14 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 pr-12 text-xl font-bold text-text-primary focus:border-primary focus:outline-none"
            />
            <span className="pointer-events-none absolute right-4 text-sm text-text-secondary">{p.suffix}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-primary">{label}</span>
      {children}
    </label>
  );
}

function bmiCategory(b: number): string {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Healthy weight";
  if (b < 30) return "Overweight";
  if (b < 35) return "Obesity class I";
  if (b < 40) return "Obesity class II";
  return "Obesity class III";
}

// ---- Outcome screens ------------------------------------------------------

function renderOutcome(outcome: Exclude<Outcome, null>, a: Answers, back: () => void) {
  if (outcome === "submitted") {
    const onHold = !a.weightPhoto || !a.idDoc;
    return (
      <div className="text-center">
        <ResultRing tone="ok" />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text-primary">Consultation submitted</h1>
        <p className="mx-auto mt-2 max-w-md text-base text-text-secondary">
          Thank you! A prescriber registered with the GPhC is currently reviewing your responses. Expect an email from us at{" "}
          <span className="font-semibold text-text-primary">{a.email || "your inbox"}</span> within the next 24 hours.
        </p>
        {onHold && (
          <p className="mx-auto mt-4 max-w-md rounded-lg bg-warning-lighter px-4 py-3 text-left text-sm leading-relaxed text-warning-darker">
            <span className="font-bold">One thing left:</span> your order is on hold until you take the{" "}
            {[!a.weightPhoto && "weight photo", !a.idDoc && "ID photo"].filter(Boolean).join(" and ")} — you can do it
            any time from your dashboard. No review or charge happens before that.
          </p>
        )}
        <div className="mt-6 space-y-3 rounded-xl border border-[var(--divider)] bg-background-paper p-5 text-left">
          {[
            "A prescriber reviews your consultation against the pharmacy's clinical SOP.",
            "If approved, your card is charged and your treatment ships cold-chain to your door.",
            "You'll manage doses, repeats and check-ins from your patient dashboard.",
          ].map((t, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-lighter font-mono text-xs font-bold text-primary-dark">
                {i + 1}
              </span>
              <p className="text-sm text-text-primary">{t}</p>
            </div>
          ))}
        </div>
        <Link
          href="/patient"
          className="mt-6 inline-block rounded-xl bg-primary px-7 py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-primary-dark"
        >
          Go to your dashboard →
        </Link>
      </div>
    );
  }

  if (outcome === "blocked") {
    const hc = hardContra(a);
    return (
      <div className="text-center">
        <ResultRing tone="blocked" />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text-primary">We can’t continue right now</h1>
        <p className="mx-auto mt-2 max-w-md text-base text-text-secondary">
          One of your safety answers means GLP-1 weight-loss treatment isn’t suitable for you at this time. Your safety comes first.
        </p>
        {hc && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[var(--divider)] bg-background-paper p-5 text-left">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-error-lighter text-error">!</span>
            <p className="text-sm text-text-primary">
              Flagged: {hc.q.replace(/^You /, "you ").toLowerCase()}. Please speak to your GP about weight-management options that are safe for you.
            </p>
          </div>
        )}
        <LeadCapture reason="If new treatments or guidance make this suitable for you, we can let you know." />
        <BackToAnswers onClick={back} />
      </div>
    );
  }

  if (outcome === "declined-bmi") {
    const b = bmi(a);
    return (
      <div className="text-center">
        <ResultRing tone="info" />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text-primary">You don’t meet the criteria yet</h1>
        <p className="mx-auto mt-2 max-w-md text-base text-text-secondary">
          Your BMI is <span className="font-semibold text-text-primary">{b?.toFixed(1)}</span>. The threshold for your profile is{" "}
          <span className="font-semibold text-text-primary">{bmiThreshold(a)}</span>. GLP-1 treatment isn’t available below that.
        </p>
        <LeadCapture reason="Thresholds and licensed treatments change. Leave your email and we'll tell you if you become eligible." />
        <BackToAnswers onClick={back} />
      </div>
    );
  }

  // declined-age
  const yrs = age(a);
  return (
    <div className="text-center">
      <ResultRing tone="info" />
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text-primary">Outside the treatable age range</h1>
      <p className="mx-auto mt-2 max-w-md text-base text-text-secondary">
        {yrs !== null ? <>You’re <span className="font-semibold text-text-primary">{yrs}</span>. </> : null}
        Treatment through this service is for adults aged 18–74.
      </p>
      <LeadCapture reason="Leave your email and we'll let you know if our service becomes available for you." />
      <BackToAnswers onClick={back} />
    </div>
  );
}

/**
 * Optional contact capture on dead-end outcomes — the person can't proceed
 * today, but eligibility rules and licensed treatments change. Local state
 * only; in production this posts to the CRM/waitlist.
 */
function LeadCapture({ reason }: { reason: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const valid = /.+@.+\..+/.test(email);

  if (sent) {
    return (
      <div className="mx-auto mt-6 max-w-md rounded-xl bg-success-lighter px-5 py-4 text-sm font-semibold text-success-darker">
        Thanks — we&rsquo;ll only contact you if something changes for your profile.
      </div>
    );
  }
  return (
    <div className="mx-auto mt-6 max-w-md rounded-xl border border-[var(--divider)] bg-background-paper p-5 text-left">
      <p className="text-sm font-extrabold text-text-primary">Keep me posted</p>
      <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{reason}</p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="h-11 min-w-0 flex-1 rounded-lg border-2 border-[var(--divider)] bg-background-paper px-3 text-sm text-text-primary focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => setSent(true)}
          className="rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
        >
          Notify me
        </button>
      </div>
      <p className="mt-2 text-[11px] text-text-secondary">No marketing — one email if your eligibility changes. Unsubscribe any time.</p>
    </div>
  );
}

/** "I'll do this later" escape hatch on the capture steps — camera stays the
 *  default; deferring puts the order on hold after payment, never skips it. */
function DeferChoice({
  deferred,
  onToggle,
  what,
}: {
  deferred: boolean;
  onToggle: (v: boolean) => void;
  what: string;
}) {
  if (deferred) {
    return (
      <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-warning-lighter px-4 py-3">
        <p className="text-sm leading-relaxed text-warning-darker">
          <span className="font-bold">Skipped for now.</span> You can finish your order, but it stays{" "}
          <span className="font-bold">on hold</span> — no prescriber review and no charge — until you take the {what}{" "}
          from your dashboard.
        </p>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className="shrink-0 text-sm font-bold text-warning-darker underline hover:no-underline"
        >
          Take it now
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onToggle(true)}
      className="mt-3 text-sm font-semibold text-text-secondary underline hover:text-text-primary"
    >
      I&rsquo;ll take the {what} later
    </button>
  );
}

function BackToAnswers({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 rounded-lg border border-[var(--divider)] bg-background-paper px-5 py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral"
    >
      Back to my answers
    </button>
  );
}
