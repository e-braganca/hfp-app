import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner with Prescriptr — prescribing capacity for UK pharmacies",
  description:
    "Add CQC-regulated, doctor-led GLP-1 prescribing to your pharmacy at a fixed per-script fee. SOP-grounded reviews, full audit trail, live in weeks.",
};

/* ============================================================================
   Pharmacy partner landing (/pharmacies) — the B2B front door. This is HFP's
   actual business: prescribing-as-a-service for online pharmacies. Same
   editorial-clinical language as the patient landing; the hero art is the
   partner's own dashboard card, because the product IS the oversight.
   NOTE: all stats are MOCK values pending client validation.
   ============================================================================ */

const STATS = [
  { value: "20+ yrs", label: "founder track record in UK telemedicine*" },
  { value: "38,400", label: "prescriptions signed on the platform*" },
  { value: "14", label: "senior GMC / GPhC prescribers active*" },
  { value: "96%", label: "of patients reorder month on month*" },
];

const VALUE_PROPS = [
  {
    title: "Prescribing capacity without the payroll",
    body: "A bench of senior UK prescribers signs your scripts at a fixed per-script fee. No recruitment, no rotas, no locum gaps — capacity scales with your order volume.",
    mono: "PAY PER SCRIPT · NO MINIMUMS",
  },
  {
    title: "Your SOP, enforced by design",
    body: "We don't prescribe from a generic rulebook. Your SOP is parsed, versioned and read on every single case — the AI screens against it, a named prescriber decides.",
    mono: "RAG-GROUNDED · HUMAN-SIGNED",
  },
  {
    title: "A CQC-ready audit trail, for free",
    body: "Every decision is logged with the SOP version active at the time. When the inspector asks why order #4471 was approved, the answer is one click.",
    mono: "VERSIONED · EXPORTABLE",
  },
  {
    title: "Live in weeks, not quarters",
    body: "Submit your details and SOP document; we validate, configure your thresholds and train the prescriber panel on your rules. Most partners go live inside a month.",
    mono: "SOP UPLOAD → VALIDATE → LIVE",
  },
];

const STEPS = [
  { n: "01", title: "Submit your pharmacy", body: "Ten minutes: business details, coverage area, the medications you dispense, and your clinical SOP document." },
  { n: "02", title: "Compliance review", body: "Our clinical team validates your GPhC registration, sourcing and SOP. We come back within 5 working days." },
  { n: "03", title: "SOP configuration", body: "Your thresholds — BMI floors, titration rules, max doses — are configured and validated against sample cases. You approve the parameters." },
  { n: "04", title: "Go live", body: "Orders flow into the prescriber queue, decisions flow back with the audit trail. You dispense; we keep every script inside your SOP." },
];

const REQUIREMENTS = [
  "GPhC-registered UK pharmacy (distance-selling registration for online supply)",
  "MHRA-compliant sourcing for the medications you list",
  "Cold-chain dispatch capability for GLP-1 pens",
  "A written clinical SOP for weight-management prescribing (we'll help refine it)",
  "A named superintendent pharmacist as our clinical contact",
];

export default function PharmacyLanding() {
  return (
    <div className="bg-background-paper text-text-primary">
      <TopBar />
      <Hero />
      <StatsBar />
      <ValueProps />
      <HowItWorks />
      <Requirements />
      <FinalCta />
      <Footer />
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-primary-darker/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Link href="/"><img src="/brand/logo-white.svg" alt="Prescriptr" className="h-4 w-auto" /></Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-white/70 md:flex">
          <a href="#why" className="transition-colors hover:text-white">Why partner</a>
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#requirements" className="transition-colors hover:text-white">Requirements</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="hidden rounded-lg border border-white/25 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:block"
          >
            Partner sign in
          </Link>
          <Link
            href="/pharmacies/register"
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-primary-darker transition-colors hover:bg-primary-lighter"
          >
            Submit your Pharmacy
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-darker via-primary-dark to-primary text-white">
      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-4 lg:pb-24 lg:pt-24">
        <div>
          <p className="lp-rise font-mono text-xs font-bold tracking-[0.25em] text-primary-lighter" style={{ "--d": "0s" } as React.CSSProperties}>
            FOR UK PHARMACIES · PRESCRIBING-AS-A-SERVICE
          </p>
          <h1
            className="lp-rise mt-5 max-w-xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl"
            style={{ "--d": "0.08s" } as React.CSSProperties}
          >
            Sell weight-loss care.{" "}
            <span className="relative inline-block">
              We sign the scripts.
              <span aria-hidden className="absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-warning-light/80" />
            </span>
          </h1>
          <p className="lp-rise mt-6 max-w-md text-lg leading-relaxed text-white/75" style={{ "--d": "0.16s" } as React.CSSProperties}>
            Join the Prescriptr panel and plug senior, CQC-regulated prescribers into your GLP-1 offer — reviewed
            against your own SOP, at a fixed fee per script.
          </p>
          <div className="lp-rise mt-9 flex flex-wrap items-center gap-3" style={{ "--d": "0.24s" } as React.CSSProperties}>
            <Link
              href="/pharmacies/register"
              className="group rounded-xl bg-white px-7 py-4 text-base font-extrabold text-primary-darker shadow-z16 transition-transform hover:-translate-y-0.5"
            >
              Submit your Pharmacy
              <span aria-hidden className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#how"
              className="rounded-xl border border-white/30 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              How it works
            </a>
          </div>
          <div className="lp-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/60" style={{ "--d": "0.32s" } as React.CSSProperties}>
            <span>CQC-regulated prescribers</span>
            <span className="hidden h-3 w-px bg-white/25 sm:block" />
            <span>ISO 27001 · NHS DSP Toolkit</span>
            <span className="hidden h-3 w-px bg-white/25 sm:block" />
            <span>Fixed per-script pricing</span>
          </div>
        </div>

        {/* the partner's own dashboard card as hero art */}
        <div className="lp-rise relative hidden min-w-0 lg:block" style={{ "--d": "0.3s" } as React.CSSProperties}>
          <PartnerCard />
        </div>
      </div>
    </section>
  );
}

/** Stylised partner dashboard tile — what a pharmacy sees once live. */
function PartnerCard() {
  return (
    <div className="lp-drift relative mx-auto w-[400px]">
      <div className="rounded-2xl bg-background-paper p-6 text-text-primary shadow-dialog">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-extrabold">Your Pharmacy</p>
            <p className="font-mono text-[11px] tracking-widest text-text-secondary">PARTNER DASHBOARD</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-success-lighter px-2.5 py-1 text-[11px] font-extrabold text-success-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> LIVE · SOP v1.0
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["TODAY", "23", "orders signed"],
            ["TURNAROUND", "4.1h", "median review"],
            ["COMPLIANCE", "99%", "against your SOP"],
          ].map(([k, v, s]) => (
            <div key={k} className="rounded-xl bg-background-neutral p-3">
              <p className="font-mono text-[10px] font-bold tracking-widest text-text-secondary">{k}</p>
              <p className="mt-1 font-mono text-2xl font-extrabold">{v}</p>
              <p className="text-[11px] text-text-secondary">{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 rounded-xl border border-[var(--divider)] p-4">
          {[
            ["PT-4471 · Mounjaro 2.5 mg", "Approved · Dr. Hart"],
            ["PT-4470 · Wegovy 0.25 mg", "Approved · Dr. Reyes"],
            ["PT-4468 · Mounjaro 2.5 mg", "In review"],
          ].map(([l, r]) => (
            <div key={l} className="flex items-center justify-between text-[12.5px]">
              <span className="font-mono text-text-secondary">{l}</span>
              <span className={`font-bold ${r === "In review" ? "text-warning-dark" : "text-success-dark"}`}>{r}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-darker px-4 py-3 text-white">
          <p className="text-[13px] font-bold">Every decision audit-logged to your SOP version</p>
          <span className="text-xl">✓</span>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[11px] tracking-widest text-white/50">
        YOUR ORDERS · OUR PRESCRIBERS · YOUR RULES
      </p>
    </div>
  );
}

function StatsBar() {
  return (
    <section className="border-b border-[var(--divider)] bg-background-paper">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-mono text-4xl font-extrabold tracking-tight text-primary">{s.value}</p>
              <p className="mt-1.5 max-w-[190px] text-[13px] leading-snug text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-secondary">*Illustrative figures for preview — final numbers to be confirmed.</p>
      </div>
    </section>
  );
}

function ValueProps() {
  return (
    <section id="why" className="bg-background-paper">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold tracking-[0.25em] text-primary">WHY PARTNER</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            The prescribing layer your pharmacy is missing.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            GLP-1 demand is the biggest opportunity UK online pharmacy has seen — and the fastest way to lose a GPhC
            registration if prescribing is sloppy. We built the layer that keeps it safe.
          </p>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--divider)] bg-[var(--divider)] md:grid-cols-2">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="group bg-background-paper p-8 transition-colors hover:bg-primary-lighter/30">
              <h3 className="text-lg font-extrabold leading-snug">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{v.body}</p>
              <p className="mt-5 font-mono text-[10px] font-bold tracking-[0.18em] text-primary">{v.mono}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="bg-background-neutral">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold tracking-[0.25em] text-primary">HOW IT WORKS</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">From application to first script.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-[var(--divider)] bg-background-paper p-7 shadow-card">
              <p className="font-mono text-4xl font-extrabold text-primary-lighter">{s.n}</p>
              <h3 className="mt-4 text-lg font-extrabold leading-snug">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Requirements() {
  return (
    <section id="requirements" className="relative overflow-hidden bg-primary-darker text-white">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-primary/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.25em] text-primary-lighter">WHAT WE NEED FROM YOU</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            We&rsquo;re selective, on purpose.
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">
            Every partner shares one audit trail and one reputation with the regulator. The bar below is what keeps the
            whole panel&rsquo;s compliance above 99% — and it&rsquo;s what your patients are buying.
          </p>
        </div>
        <ul className="space-y-4 self-center">
          {REQUIREMENTS.map((r) => (
            <li key={r} className="flex items-start gap-3 rounded-xl bg-white/5 px-5 py-4 text-sm leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-light/25 text-secondary-light">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {r}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-background-paper">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark to-primary px-8 py-16 text-center text-white shadow-primary">
          <p className="font-mono text-xs font-bold tracking-[0.25em] text-primary-lighter">10-MINUTE APPLICATION · REVIEWED IN 5 WORKING DAYS</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Put your pharmacy on the panel.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pharmacies/register"
              className="rounded-xl bg-white px-8 py-4 text-base font-extrabold text-primary-darker shadow-z16 transition-transform hover:-translate-y-0.5"
            >
              Submit your Pharmacy →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-primary-darker text-white/60">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-white.svg" alt="Prescriptr" className="h-4 w-auto" />
            <p className="mt-4 text-[13px] leading-relaxed">
              Prescription fulfilment by senior doctors. Prescriptr is the consumer service of Health Finder Pro Ltd,
              a UK telemedicine provider.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-[13px]">
            <div>
              <p className="font-mono text-[11px] font-bold tracking-widest text-white/40">PARTNERS</p>
              <ul className="mt-3 space-y-2">
                <li><Link className="transition-colors hover:text-white" href="/pharmacies/register">Submit your Pharmacy</Link></li>
                <li><a className="transition-colors hover:text-white" href="#requirements">Requirements</a></li>
                <li><Link className="transition-colors hover:text-white" href="/login">Partner sign in</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] font-bold tracking-widest text-white/40">PATIENTS</p>
              <ul className="mt-3 space-y-2">
                <li><Link className="transition-colors hover:text-white" href="/">Weight-loss treatment</Link></li>
                <li><Link className="transition-colors hover:text-white" href="/onboarding">Start assessment</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-[12px] leading-relaxed">
          <p className="font-mono text-[11px] tracking-wide text-white/40">
            © 2026 Health Finder Pro Ltd · CQC-regulated provider · ISO 27001 · NHS Data Security &amp; Protection Toolkit
          </p>
        </div>
      </div>
    </footer>
  );
}
