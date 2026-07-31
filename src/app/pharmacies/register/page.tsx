"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, UploadIcon } from "@/components/ui/icons";
import { PHONE_COUNTRIES } from "@/lib/onboarding/constants";
import {
  COVERAGE_AREAS,
  SUPPLY_MEDS,
  saveApplication,
  type PharmacyApplication,
} from "@/lib/pharmacy-applications";

/* ============================================================================
   Pharmacy partner registration (/pharmacies/register) — same structural
   skeleton as the patient onboarding (brand panel left, stepped form right),
   compressed to 5 steps. Submitting queues the application for admin review
   on Pharmacies & SOPs (localStorage in the demo).
   ============================================================================ */

const STEPS = ["intro", "business", "location", "meds", "sop", "review"] as const;
type StepKey = (typeof STEPS)[number];

const PHASES: { label: string; steps: number[] }[] = [
  { label: "Your business", steps: [1] },
  { label: "Coverage", steps: [2] },
  { label: "Medications", steps: [3] },
  { label: "Clinical SOP", steps: [4, 5] },
];

const EMAIL_RE = /.+@.+\..+/;

export default function PharmacyRegisterPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [business, setBusiness] = useState("");
  const [respName, setRespName] = useState("");
  const [respEmail, setRespEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("+44");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coverage, setCoverage] = useState<string[]>([]);
  const [meds, setMeds] = useState<string[]>([]);
  const [sopFile, setSopFile] = useState("");

  const key: StepKey = STEPS[step];
  const total = STEPS.length;

  const canContinue =
    key === "business"
      ? business.trim() !== "" && respName.trim() !== "" && EMAIL_RE.test(respEmail) && phone.replace(/\D/g, "").length >= 9
      : key === "location"
        ? address.trim().length > 6 && coverage.length > 0
        : key === "meds"
          ? meds.length > 0
          : key === "sop"
            ? sopFile !== ""
            : true;

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = () => {
    const app: PharmacyApplication = {
      id: `PA-${Date.now().toString(36).toUpperCase()}`,
      business: business.trim(),
      responsibleName: respName.trim(),
      responsibleEmail: respEmail.trim(),
      phone: `${phoneCountry} ${phone.trim()}`,
      address: address.trim(),
      coverage,
      meds,
      sopFileName: sopFile,
      submittedAt: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    };
    saveApplication(app);
    setSubmitted(true);
  };

  const inputCls =
    "h-12 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none";
  const chipCls = (on: boolean) =>
    `rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
      on
        ? "border-primary bg-primary-lighter text-primary-dark"
        : "border-[var(--divider)] bg-background-paper text-text-secondary hover:border-primary-light hover:text-text-primary"
    }`;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
      {/* brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-darker via-primary-dark to-primary p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Link href="/pharmacies"><img src="/brand/logo-white.svg" alt="Prescriptr" className="h-5 w-auto" /></Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary-lighter">Partner application</p>
          <h2 className="mt-3 max-w-sm text-4xl font-extrabold leading-tight tracking-tight">
            Ten minutes to join the panel.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/70">
            Your application is reviewed by our clinical team within 5 working days.
          </p>
          <ol className="mt-8 space-y-4">
            {PHASES.map((p, i) => {
              const state = submitted
                ? "done"
                : p.steps.includes(step)
                  ? "active"
                  : Math.max(...p.steps) < step
                    ? "done"
                    : "upcoming";
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
                  <span className={`text-sm font-semibold ${state === "upcoming" ? "text-white/45" : "text-white"}`}>{p.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="text-xs text-white/50">CQC-regulated prescribers · ISO 27001 · fixed per-script pricing</p>
      </aside>

      {/* form column */}
      <div className="flex min-h-screen flex-col bg-background-neutral">
        <div className="sticky top-0 z-10 bg-background-neutral px-6 pt-5 lg:px-16">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>{submitted ? " " : `Step ${step + 1} of ${total}`}</span>
            <Link href="/pharmacies" className="hover:text-text-primary">Back to partners page</Link>
          </div>
          {!submitted && (
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-grey-200">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${step === 0 ? 0 : Math.round((step / (total - 1)) * 100)}%` }}
              />
            </div>
          )}
          <div className="mt-4 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-dark.svg" alt="Prescriptr" className="h-5 w-auto" />
          </div>
        </div>

        <main className="flex flex-1 items-center px-6 py-10 lg:px-16">
          <div className="mx-auto w-full max-w-lg">
            {submitted ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-lighter text-success-dark">
                  <CheckIcon width={28} height={28} />
                </div>
                <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text-primary">Application received</h1>
                <p className="mx-auto mt-2 max-w-md text-base text-text-secondary">
                  Thanks, {respName.split(" ")[0]}. Our clinical team will review {business} — GPhC registration,
                  sourcing and your SOP — and reply to{" "}
                  <span className="font-semibold text-text-primary">{respEmail}</span> within 5 working days.
                </p>
                <div className="mx-auto mt-6 max-w-md space-y-3 rounded-xl border border-[var(--divider)] bg-background-paper p-5 text-left">
                  {[
                    "Compliance review of your registration and sourcing.",
                    "Your SOP is parsed and configured — you approve the thresholds.",
                    "Go live: orders in, signed decisions out, audit trail on.",
                  ].map((t, i) => (
                    <div key={t} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-lighter font-mono text-xs font-bold text-primary-dark">
                        {i + 1}
                      </span>
                      <p className="text-sm text-text-primary">{t}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/pharmacies"
                  className="mt-6 inline-block rounded-xl bg-primary px-7 py-3.5 text-sm font-extrabold text-white hover:bg-primary-dark"
                >
                  Back to partners page
                </Link>
              </div>
            ) : (
              <>
                {key === "intro" && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">Partner application</p>
                    <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-text-primary">
                      Submit your pharmacy
                    </h1>
                    <p className="mt-2 text-base text-text-secondary">
                      Five quick sections: your business, where you dispense, what you supply, and your clinical SOP.
                      Nothing is shared until our clinical team has reviewed it.
                    </p>
                    <div className="mt-6 space-y-3 rounded-xl border border-[var(--divider)] bg-background-paper p-5">
                      {[
                        "Have your GPhC registration number to hand",
                        "Your clinical SOP document (PDF) — we parse and version it",
                        "A named superintendent pharmacist as clinical contact",
                      ].map((t) => (
                        <div key={t} className="flex gap-3 text-sm text-text-primary">
                          <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-primary" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {key === "business" && (
                  <div>
                    <StepHeading eyebrow="Your business" title="Who are we partnering with?" />
                    <div className="space-y-4">
                      <Field label="Business name">
                        <input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Willowbrook Pharmacy Ltd" className={inputCls} />
                      </Field>
                      <Field label="Responsible person">
                        <input value={respName} onChange={(e) => setRespName(e.target.value)} placeholder="Superintendent pharmacist or director" className={inputCls} />
                      </Field>
                      <Field label="Email">
                        <input type="email" value={respEmail} onChange={(e) => setRespEmail(e.target.value)} placeholder="name@pharmacy.co.uk" className={inputCls} />
                      </Field>
                      <Field label="Phone number">
                        <div className="flex gap-2">
                          <div className="relative shrink-0">
                            <select
                              aria-label="Country code"
                              value={phoneCountry}
                              onChange={(e) => setPhoneCountry(e.target.value)}
                              className="h-12 appearance-none rounded-xl border-2 border-[var(--divider)] bg-background-paper pl-3 pr-8 font-mono text-base font-semibold text-text-primary focus:border-primary focus:outline-none"
                            >
                              {PHONE_COUNTRIES.map((c) => (
                                <option key={c.dial + c.label} value={c.dial}>{c.flag} {c.dial}</option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary">▾</span>
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                            placeholder="020 7946 0018"
                            className="h-12 min-w-0 flex-1 rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 text-base text-text-primary focus:border-primary focus:outline-none"
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                )}

                {key === "location" && (
                  <div>
                    <StepHeading eyebrow="Coverage" title="Where do you dispense from — and to?" />
                    <div className="space-y-4">
                      <Field label="Registered address">
                        <textarea
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={"Unit 4, Riverside Business Park\nLondon SE1 9RT"}
                          className="w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper p-4 text-base text-text-primary focus:border-primary focus:outline-none"
                        />
                      </Field>
                      <Field label="Coverage area — where you can deliver cold-chain">
                        <div className="flex flex-wrap gap-2">
                          {COVERAGE_AREAS.map((c) => (
                            <button key={c} type="button" aria-pressed={coverage.includes(c)} onClick={() => toggle(coverage, setCoverage, c)} className={chipCls(coverage.includes(c))}>
                              {coverage.includes(c) ? "✓ " : ""}{c}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </div>
                  </div>
                )}

                {key === "meds" && (
                  <div>
                    <StepHeading
                      eyebrow="Medications"
                      title="What can you supply?"
                      sub="Select everything you can source MHRA-compliantly and dispatch cold-chain where required."
                    />
                    <div className="flex flex-wrap gap-2">
                      {SUPPLY_MEDS.map((m) => (
                        <button key={m} type="button" aria-pressed={meds.includes(m)} onClick={() => toggle(meds, setMeds, m)} className={chipCls(meds.includes(m))}>
                          {meds.includes(m) ? "✓ " : ""}{m}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-text-secondary">
                      Ozempic is licensed for type 2 diabetes in the UK — listing it here covers T2DM supply only, not
                      weight-loss prescribing.
                    </p>
                  </div>
                )}

                {key === "sop" && (
                  <div>
                    <StepHeading
                      eyebrow="Clinical SOP"
                      title="Upload your SOP document"
                      sub="Your rulebook — eligibility thresholds, titration, contraindications. We parse it, version it, and every prescribing decision is checked against it."
                    />
                    {sopFile ? (
                      <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary-lighter/40 px-4 py-3.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded bg-error-lighter text-[10px] font-bold text-error-dark">PDF</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-text-primary">{sopFile}</p>
                          <p className="text-xs text-text-secondary">14 pages · uploaded just now · READY</p>
                        </div>
                        <button type="button" onClick={() => setSopFile("")} className="text-sm font-bold text-text-secondary hover:text-text-primary">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSopFile(`${(business.trim().split(" ")[0] || "Pharmacy")}_SOP_v1.0.pdf`)}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--divider)] bg-background-paper px-4 py-12 text-center transition-colors hover:border-primary-light"
                      >
                        <UploadIcon className="text-text-disabled" />
                        <span className="text-sm font-semibold text-text-primary">Drop your SOP PDF here, or click to browse</span>
                        <span className="text-xs text-text-secondary">PDF up to 25 MB · demo accepts a mock file</span>
                      </button>
                    )}
                    <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-xs leading-relaxed text-primary-dark">
                      No SOP yet, or it needs work? Submit what you have — our clinical team helps partners bring their
                      SOP up to panel standard during review.
                    </p>
                  </div>
                )}

                {key === "review" && (
                  <div>
                    <StepHeading eyebrow="Review" title="Check your application" />
                    <div className="overflow-hidden rounded-xl border border-[var(--divider)] bg-background-paper">
                      {(
                        [
                          ["Business", business],
                          ["Responsible person", respName],
                          ["Contact", `${respEmail} · ${phoneCountry} ${phone}`],
                          ["Address", address.replace(/\n/g, ", ")],
                          ["Coverage", coverage.join(", ")],
                          ["Can supply", meds.join(", ")],
                          ["SOP document", sopFile],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-6 border-b border-[var(--divider)] px-4 py-3 text-sm last:border-0">
                          <span className="shrink-0 text-text-secondary">{k}</span>
                          <span className="text-right font-semibold text-text-primary">{v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-sm text-primary-dark">
                      On submit, your application enters clinical review. We&rsquo;ll confirm GPhC registration and
                      sourcing, then configure and validate your SOP with you.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {!submitted && (
          <div
            className="sticky bottom-0 flex items-center gap-3 border-t border-[var(--divider)] bg-background-neutral px-6 py-4 lg:px-16"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                aria-label="Back"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--divider)] bg-background-paper text-text-primary hover:bg-background-neutral"
              >
                ←
              </button>
            )}
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => (key === "review" ? submit() : setStep((s) => s + 1))}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
            >
              {key === "intro" ? "Start application" : key === "review" ? "Submit application" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-text-primary">{title}</h1>
      {sub && <p className="mt-2 text-base text-text-secondary">{sub}</p>}
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
