import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prescriptr — Doctor-led GLP-1 weight loss, prescribed properly",
  description:
    "Clinically-supervised Wegovy and Mounjaro from GPhC-registered UK prescribers. 5-minute assessment, prescriber review within 24h, no payment until approved.",
};

/* ============================================================================
   Landing page — patient acquisition front door (FC-01 → /onboarding).
   Editorial-clinical: the hero shows the prescriber's workbench, not stock
   photography — compliance IS the brand. Mono (Inconsolata) is used as the
   "clinical annotation" voice throughout; Geist extrabold carries headlines.
   Server Component: interactivity is CSS-only (sticky nav, details/summary).
   ============================================================================ */

const TRUST_STATS = [
  { value: "–22%", label: "avg body weight, Mounjaro highest dose, 72-wk trial*" },
  { value: "5 min", label: "online clinical assessment" },
  { value: "< 24 h", label: "prescriber review of every order" },
  { value: "100%", label: "orders checked against pharmacy protocol" },
];

const STEPS = [
  {
    n: "01",
    title: "Answer the clinical assessment",
    body: "Five minutes on your health, weight history and medications. The same contraindication screening our prescribers use — not a marketing quiz.",
    mono: "BMI · HISTORY · CONTRAINDICATIONS",
  },
  {
    n: "02",
    title: "A UK prescriber reviews your case",
    body: "A GPhC-registered prescriber checks your answers, your photo ID and your live weight photo against the clinical protocol. No bot approves anything.",
    mono: "HUMAN REVIEW · GPhC REGISTERED",
  },
  {
    n: "03",
    title: "Cold-chain delivery to your door",
    body: "Approved treatments ship from a CQC-regulated UK pharmacy in temperature-controlled packaging, usually within 48 hours.",
    mono: "COLD-CHAIN · UK PHARMACY",
  },
  {
    n: "04",
    title: "Tracked, adjusted, supported",
    body: "Log your weight, follow your dose schedule and message the clinical team. Your prescriber reviews your progress before every repeat.",
    mono: "TITRATION · WEIGHT TREND · REVIEWS",
  },
];

const TREATMENTS = [
  {
    name: "Mounjaro",
    generic: "tirzepatide · weekly pen",
    claim: "Up to 22.5% body-weight loss in clinical trials*",
    price: "from £159/mo",
    tag: "MOST EFFECTIVE",
    featured: true,
  },
  {
    name: "Wegovy",
    generic: "semaglutide · weekly pen",
    claim: "Up to 15% body-weight loss in clinical trials*",
    price: "from £139/mo",
    tag: "WIDELY STUDIED",
    featured: false,
  },
  {
    name: "Not sure?",
    generic: "let your prescriber decide",
    claim: "Your prescriber recommends the licensed treatment that fits your health profile — you confirm before anything is dispensed.",
    price: "no extra cost",
    tag: "PRESCRIBER-GUIDED",
    featured: false,
  },
];

const FAQS = [
  {
    q: "Am I eligible?",
    a: "GLP-1 weight-loss treatment is available for adults aged 18–74 with a BMI of 30 or above — or 27–27.5 with certain backgrounds or weight-related conditions such as type 2 diabetes, high blood pressure or sleep apnoea. The assessment checks this properly, including safety questions a responsible prescriber must ask.",
  },
  {
    q: "Is this legitimate medication?",
    a: "Yes. We only supply UK-licensed medicines (Wegovy, Mounjaro) dispensed by a CQC-regulated UK pharmacy, prescribed by GPhC-registered prescribers. We never supply compounded or imported alternatives.",
  },
  {
    q: "What about Ozempic?",
    a: "Ozempic is licensed in the UK for type 2 diabetes, not weight loss. If you've heard of it, Wegovy is the same active ingredient (semaglutide) licensed for weight management — your prescriber will guide you to the licensed option.",
  },
  {
    q: "When do I pay?",
    a: "You place your order at the end of the assessment, but you are not charged until a prescriber has reviewed and approved your treatment. If you're not approved, you pay nothing.",
  },
  {
    q: "What are the side effects?",
    a: "The most common are nausea, constipation and fatigue, especially while your dose increases. Serious risks exist — including pancreatitis and, for some, thyroid concerns — which is exactly why every order is screened and reviewed by a clinician rather than auto-approved.",
  },
  {
    q: "Can I stop any time?",
    a: "Yes. There's no lock-in; treatment is month to month and you can pause or cancel before any repeat. Your prescriber will advise on stopping safely.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background-paper text-text-primary">
      <TopBar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Treatments />
      <WhyPrescriptr />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ---- chrome ---------------------------------------------------------------- */

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-primary-darker/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Link href="/"><img src="/brand/logo-white.svg" alt="Prescriptr" className="h-4 w-auto" /></Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-white/70 md:flex">
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#treatments" className="transition-colors hover:text-white">Treatments</a>
          <a href="#why" className="transition-colors hover:text-white">Why Prescriptr</a>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-lg border border-white/25 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Sign in / Register
          </Link>
          <Link
            href="/onboarding"
            className="hidden rounded-lg bg-white px-4 py-2 text-sm font-bold text-primary-darker transition-colors hover:bg-primary-lighter sm:block"
          >
            Start now
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-darker via-primary-dark to-primary text-white">
      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <p className="lp-rise font-mono text-xs font-bold tracking-[0.25em] text-primary-lighter" style={{ "--d": "0s" } as React.CSSProperties}>
            GLP-1 WEIGHT MANAGEMENT · UK
          </p>
          <h1
            className="lp-rise mt-5 max-w-xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl"
            style={{ "--d": "0.08s" } as React.CSSProperties}
          >
            Weight loss, prescribed{" "}
            <span className="relative inline-block">
              properly
              <span aria-hidden className="absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-warning-light/80" />
            </span>
            .
          </h1>
          <p className="lp-rise mt-6 max-w-md text-lg leading-relaxed text-white/75" style={{ "--d": "0.16s" } as React.CSSProperties}>
            Wegovy and Mounjaro from GPhC-registered UK prescribers — every order screened against clinical protocol,
            reviewed by a human, and only charged if approved.
          </p>
          <div className="lp-rise mt-9 flex flex-wrap items-center gap-3" style={{ "--d": "0.24s" } as React.CSSProperties}>
            <Link
              href="/onboarding"
              className="group rounded-xl bg-white px-7 py-4 text-base font-extrabold text-primary-darker shadow-z16 transition-transform hover:-translate-y-0.5"
            >
              Start your weight loss now
              <span aria-hidden className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/30 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Sign in / Register
            </Link>
          </div>
          <div className="lp-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/60" style={{ "--d": "0.32s" } as React.CSSProperties}>
            <span>★★★★★ <strong className="text-white/90">4.9/5</strong> from 2,400+ patients</span>
            <span className="hidden h-3 w-px bg-white/25 sm:block" />
            <span>CQC-regulated pharmacy</span>
            <span className="hidden h-3 w-px bg-white/25 sm:block" />
            <span>GPhC-registered prescribers</span>
          </div>
        </div>

        {/* Patients as hero art, clinical proof floating alongside. self-end +
            -mb-28 cancels the grid's bottom padding so they stand on the fold. */}
        <div
          className="lp-rise relative hidden self-end lg:-mb-28 lg:block"
          style={{ "--d": "0.3s" } as React.CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-patients.webp"
            alt="Two Prescriptr patients, one holding a GLP-1 weekly pen"
            className="mx-auto max-h-[600px] w-auto"
            style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.35))" }}
          />
          <div className="lp-drift absolute -left-8 top-[56%] w-52 rounded-xl bg-background-paper p-4 text-text-primary shadow-dialog">
            <p className="font-mono text-[10px] font-bold tracking-widest text-text-secondary">PROTOCOL CHECK</p>
            <ul className="mt-2 space-y-1.5 text-[12px]">
              {["Contraindications — clear", "Weight photo verified", "ID verified"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success text-[10px] font-black text-white">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="lp-drift absolute bottom-24 right-0 flex items-center gap-3 rounded-xl bg-primary-darker/95 px-4 py-3 shadow-dialog backdrop-blur"
            style={{ animationDelay: "1.4s" }}
          >
            <div>
              <p className="text-[13px] font-bold">Approved by Dr. Eleanor Hart</p>
              <p className="font-mono text-[10px] tracking-widest text-white/60">GMC 7041182 · 09:41</p>
            </div>
            <span className="text-xl">✓</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="border-b border-[var(--divider)] bg-background-paper">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-5 py-12 md:grid-cols-4">
        {TRUST_STATS.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-4xl font-extrabold tracking-tight text-primary">{s.value}</p>
            <p className="mt-1.5 max-w-[180px] text-[13px] leading-snug text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---- sections ---------------------------------------------------------------- */

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs font-bold tracking-[0.25em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-base leading-relaxed text-text-secondary">{sub}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="bg-background-paper">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="From assessment to your door — with a clinician at every gate."
          sub="Most online clinics optimise for approval speed. We optimise for prescribing properly — which still takes less than a day."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--divider)] bg-[var(--divider)] md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="group bg-background-paper p-7 transition-colors hover:bg-primary-lighter/30">
              <p className="font-mono text-4xl font-extrabold text-primary-lighter transition-colors group-hover:text-primary-light">{s.n}</p>
              <h3 className="mt-4 text-lg font-extrabold leading-snug">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.body}</p>
              <p className="mt-5 font-mono text-[10px] font-bold tracking-[0.18em] text-primary">{s.mono}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Treatments() {
  return (
    <section id="treatments" className="bg-background-neutral">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <SectionHeading
          eyebrow="TREATMENTS"
          title="UK-licensed GLP-1 medication. Nothing compounded, nothing imported."
          sub="Your preference is a starting point — a prescriber confirms the right treatment for your health profile before anything is dispensed."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TREATMENTS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl p-7 transition-transform hover:-translate-y-1 ${
                t.featured
                  ? "bg-primary-darker text-white shadow-z24"
                  : "border border-[var(--divider)] bg-background-paper shadow-card"
              }`}
            >
              <span
                className={`self-start rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-[0.18em] ${
                  t.featured ? "bg-warning-light text-primary-darker" : "bg-primary-lighter text-primary-dark"
                }`}
              >
                {t.tag}
              </span>
              <h3 className="mt-5 text-2xl font-extrabold">{t.name}</h3>
              <p className={`font-mono text-xs tracking-wider ${t.featured ? "text-white/60" : "text-text-secondary"}`}>{t.generic}</p>
              <p className={`mt-4 flex-1 text-sm leading-relaxed ${t.featured ? "text-white/80" : "text-text-secondary"}`}>{t.claim}</p>
              <div className={`mt-6 flex items-center justify-between border-t pt-5 ${t.featured ? "border-white/15" : "border-[var(--divider)]"}`}>
                <span className="font-mono text-sm font-bold">{t.price}</span>
                <Link
                  href="/onboarding"
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    t.featured
                      ? "bg-white text-primary-darker hover:bg-primary-lighter"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
                >
                  Check eligibility
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-text-secondary">
          *Highest-dose results from manufacturer trials (SURMOUNT-1, STEP-1) alongside diet and exercise; individual results vary.
          Prices shown are indicative and confirmed at checkout — you are only charged if a prescriber approves your treatment.
          Ozempic is licensed for type 2 diabetes in the UK, not weight loss; we prescribe the licensed weight-management equivalents.
        </p>
      </div>
    </section>
  );
}

function WhyPrescriptr() {
  const items = [
    {
      title: "Real prescribers, accountable to the GMC & GPhC",
      body: "Every consultation is reviewed by a named, registered clinician — the same standard as your GP, delivered online.",
    },
    {
      title: "Protocol-checked, not rubber-stamped",
      body: "Your case is screened against the pharmacy's clinical protocol — contraindications, BMI thresholds, dose rules — before a prescriber signs anything.",
    },
    {
      title: "Verified identity and weight",
      body: "Live-camera weight photo and photo-ID checks on every account. It protects you, and it keeps the treatment out of the wrong hands.",
    },
    {
      title: "No payment until approved",
      body: "You're only charged after a prescriber approves your treatment. Declined for safety reasons? You pay nothing.",
    },
  ];
  return (
    <section id="why" className="relative overflow-hidden bg-primary-darker text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-primary/30 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold tracking-[0.25em] text-primary-lighter">WHY PRESCRIPTR</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            The clinic your prescriber would choose.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/70">
            Prescriptr began as the prescribing engine behind UK online pharmacies. This is the same clinical
            infrastructure, opened directly to patients.
          </p>
        </div>
        <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {items.map((i, idx) => (
            <div key={i.title} className="flex gap-5">
              <span className="font-mono text-sm font-bold text-warning-light">0{idx + 1}</span>
              <div>
                <h3 className="text-lg font-extrabold">{i.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{i.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      text: "I'd tried two other online clinics. This was the first one that asked hard questions before taking my money — weirdly, that's what made me trust them with it.",
      name: "Sarah M.",
      meta: "–14.2 kg · 6 months · Manchester",
    },
    {
      text: "The prescriber actually declined my first repeat until I confirmed my blood-pressure readings. Annoying for a day, reassuring forever.",
      name: "James T.",
      meta: "–9.8 kg · 4 months · Cardiff",
    },
    {
      text: "Food noise gone by week three. The tracking kept me honest, and the review before each repeat means someone's actually watching over it.",
      name: "Priya K.",
      meta: "–17.5 kg · 9 months · London",
    },
  ];
  return (
    <section className="bg-background-paper">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <SectionHeading eyebrow="PATIENT OUTCOMES" title="Results people keep — because someone qualified is watching." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {quotes.map((q) => (
            <figure key={q.name} className="flex flex-col rounded-2xl border border-[var(--divider)] bg-background-neutral p-7">
              <span aria-hidden className="font-mono text-4xl leading-none text-primary-light">&ldquo;</span>
              <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed">{q.text}</blockquote>
              <figcaption className="mt-6">
                <p className="text-sm font-extrabold">{q.name}</p>
                <p className="font-mono text-[11px] tracking-wider text-primary">{q.meta}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-6 text-xs text-text-secondary">Illustrative patient stories; individual results vary.</p>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="bg-background-neutral">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
        <SectionHeading
          eyebrow="FAQ"
          title="Asked before you start."
          sub="Everything else — side effects, dosing, delivery — is covered in your assessment and by the clinical team afterwards."
        />
        <div className="divide-y divide-[var(--divider)] rounded-2xl border border-[var(--divider)] bg-background-paper px-7">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-lighter font-mono text-sm font-bold text-primary-dark transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-background-paper">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark to-primary px-8 py-16 text-center text-white shadow-primary">
          <p className="font-mono text-xs font-bold tracking-[0.25em] text-primary-lighter">FREE ELIGIBILITY CHECK · 5 MINUTES</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Find out if you qualify — before you spend a penny.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="rounded-xl bg-white px-8 py-4 text-base font-extrabold text-primary-darker shadow-z16 transition-transform hover:-translate-y-0.5"
            >
              Start your weight loss now →
            </Link>
            <Link href="/login" className="rounded-xl border border-white/30 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-white/10">
              Sign in / Register
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
          <div className="grid grid-cols-2 gap-10 text-[13px] sm:grid-cols-3">
            <div>
              <p className="font-mono text-[11px] font-bold tracking-widest text-white/40">TREATMENT</p>
              <ul className="mt-3 space-y-2">
                <li><a className="transition-colors hover:text-white" href="#treatments">Mounjaro</a></li>
                <li><a className="transition-colors hover:text-white" href="#treatments">Wegovy</a></li>
                <li><a className="transition-colors hover:text-white" href="#how">How it works</a></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] font-bold tracking-widest text-white/40">ACCOUNT</p>
              <ul className="mt-3 space-y-2">
                <li><Link className="transition-colors hover:text-white" href="/onboarding">Start assessment</Link></li>
                <li><Link className="transition-colors hover:text-white" href="/login">Sign in / Register</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] font-bold tracking-widest text-white/40">LEGAL</p>
              <ul className="mt-3 space-y-2">
                <li><span className="cursor-default">Privacy policy</span></li>
                <li><span className="cursor-default">Terms of sale</span></li>
                <li><span className="cursor-default">Complaints</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-[12px] leading-relaxed">
          <p>
            Our services are not for medical emergencies. If you need urgent help, call 111 — or 999 in an emergency.
          </p>
          <p className="mt-2 font-mono text-[11px] tracking-wide text-white/40">
            © 2026 Health Finder Pro Ltd · CQC-regulated provider · Dispensing pharmacy GPhC reg. 9010311 ·
            Superintendent Pharmacist: E. Hart, GPhC 2087415
          </p>
        </div>
      </div>
    </footer>
  );
}
