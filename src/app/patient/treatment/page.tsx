import Link from "next/link";
import type { Metadata } from "next";
import { DoseLogPanel } from "@/components/patient/DoseLogPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { DOSE_SCHEDULE, TREATMENT } from "@/lib/patient/data";

export const metadata: Metadata = { title: "My treatment — Prescriptr" };

/* ============================================================================
   My treatment (FC-17) — the plan, how to take it, and when to seek help.
   Content mirrors what the prescriber side enforces (titration by review,
   red-flag symptoms), so both sides of the platform tell the same story.
   ============================================================================ */

const HOW_TO = [
  { title: "Inject once a week", body: `Same day each week (yours is ${TREATMENT.injectionDay}), any time of day, with or without food. Rotate between stomach, thigh and upper arm.` },
  { title: "Store it cold", body: "Keep pens in the fridge (2–8 °C). A pen in use can stay below 30 °C for up to 30 days. Never freeze; keep away from light." },
  { title: "Missed a dose?", body: "If it's within 4 days, take it as soon as you remember. More than 4 days — skip it and take the next one on your usual day. Never double up." },
];

const RED_FLAGS = [
  "Severe, persistent stomach pain (with or without vomiting) — possible pancreatitis",
  "Signs of an allergic reaction — swelling of face or throat, trouble breathing",
  "Severe or persistent vomiting or diarrhoea — dehydration risk",
  "A lump or swelling in your neck, hoarseness, trouble swallowing",
];

export default function TreatmentPage() {
  return (
    <div>
      <PageHeader title="My treatment" subtitle={`${TREATMENT.med} · started ${TREATMENT.startedOn}`} />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* current plan */}
          <section className="rounded-lg bg-background-paper p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Current plan</p>
                <h2 className="mt-1 text-2xl font-extrabold text-text-primary">
                  {TREATMENT.shortName} <span className="font-mono">{TREATMENT.dose}</span>
                </h2>
                <p className="font-mono text-xs tracking-wide text-text-secondary">{TREATMENT.med.match(/\((.+)\)/)?.[1]} · weekly pen</p>
              </div>
              <span className="rounded-full bg-success-lighter px-3 py-1 text-xs font-extrabold text-success-dark">
                Week {TREATMENT.week} · on track
              </span>
            </div>

            <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--divider)] sm:grid-cols-3">
              {[
                ["Injection day", TREATMENT.injectionDay],
                ["Prescriber", TREATMENT.prescriber],
                ["Next review", TREATMENT.nextReview],
              ].map(([k, v]) => (
                <div key={k} className="bg-background-paper p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{k}</p>
                  <p className="mt-1 text-sm font-bold text-text-primary">{v}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-extrabold text-text-primary">Titration schedule</h3>
            <ol className="mt-3 space-y-3">
              {DOSE_SCHEDULE.map((d) => (
                <li key={d.week} className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      d.state === "done" ? "bg-success" : d.state === "current" ? "bg-primary ring-4 ring-[var(--primary-main-24)]" : "bg-grey-300"
                    }`}
                  />
                  <span className={`flex-1 text-sm ${d.state === "current" ? "font-bold text-text-primary" : "text-text-secondary"}`}>{d.week}</span>
                  <span className="font-mono text-sm font-bold text-text-primary">{d.dose}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-xs leading-relaxed text-primary-dark">
              Each dose increase is confirmed by {TREATMENT.prescriber} at review — your weight log and check-ins are
              what they look at, so keep them fresh.
            </p>
          </section>

          {/* right column */}
          <div className="space-y-6">
            <section className="rounded-lg bg-background-paper p-6 shadow-card">
              <h2 className="text-base font-bold text-text-primary">Taking it right</h2>
              <div className="mt-3 space-y-4">
                {HOW_TO.map((h) => (
                  <div key={h.title}>
                    <p className="text-sm font-extrabold text-text-primary">{h.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{h.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border-2 border-error/30 bg-background-paper p-6 shadow-card">
              <h2 className="text-base font-bold text-error-dark">Stop and seek help if…</h2>
              <ul className="mt-3 space-y-2">
                {RED_FLAGS.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm leading-relaxed text-text-primary">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-error" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-text-secondary">
                Call 111 for urgent advice, or 999 in an emergency. Then message the clinical team so your prescriber
                knows.
              </p>
            </section>
          </div>
        </div>

        <DoseLogPanel />

        {/* actions */}
        <section className="rounded-lg bg-background-paper p-6 shadow-card">
          <h2 className="text-base font-bold text-text-primary">Need a change?</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary">
            Dose feels wrong, side effects dragging on, or you want to pause? Don&rsquo;t adjust anything yourself —
            ask for a dose review when you renew, or message the clinical team and your prescriber will get back to
            you.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/patient/deliveries/new" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
              Renew your prescription
            </Link>
            <button
              type="button"
              className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral"
            >
              Message the clinical team
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
