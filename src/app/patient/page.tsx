import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";

export const metadata: Metadata = { title: "Your dashboard — Prescriptr" };

/* ============================================================================
   Patient dashboard — PLACEHOLDER (FC-13…18 to be designed properly).
   Mirrors the admin/doctor shell so the platform feels coherent; the mock
   data below sketches the tracking surface: dose schedule, deliveries,
   weight trend, prescriber touchpoints. Everything is static.
   ============================================================================ */

const DOSES = [
  { week: "Week 1–4", dose: "2.5 mg", state: "done" },
  { week: "Week 5–8", dose: "5 mg", state: "current" },
  { week: "Week 9–12", dose: "7.5 mg", state: "next" },
  { week: "Week 13+", dose: "10 mg", state: "future" },
];

const WEIGHTS = [96.2, 95.4, 94.8, 94.1, 93.6, 92.9, 92.4];

export default function PatientDashboard() {
  return (
    <div>
      <PageHeader title="Good morning, Alex" subtitle="Mounjaro (tirzepatide) · week 6 of your programme" />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        {/* headline numbers */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value="5 mg" label="Current weekly dose" />
          <StatTile value="–3.8 kg" label="Since starting · 6 weeks" tone="success" />
          <StatTile value="Fri" label="Next injection day" />
          <StatTile value="12 Aug" label="Next delivery arrives" tone="muted" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* weight trend */}
          <section id="weight" className="rounded-lg bg-background-paper p-6 shadow-card">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold text-text-primary">Weight trend</h2>
              <span className="font-mono text-xs text-text-secondary">weekly check-in · kg</span>
            </div>
            <Sparkline values={WEIGHTS} />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                Started <span className="font-mono font-bold text-text-primary">96.2</span>
              </span>
              <span className="text-text-secondary">
                Today <span className="font-mono font-bold text-success-dark">92.4</span>
              </span>
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                Log this week&rsquo;s weight
              </button>
            </div>
          </section>

          {/* dose schedule */}
          <section id="treatment" className="rounded-lg bg-background-paper p-6 shadow-card">
            <h2 className="text-base font-bold text-text-primary">Titration schedule</h2>
            <ol className="mt-4 space-y-3">
              {DOSES.map((d) => (
                <li key={d.week} className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      d.state === "done"
                        ? "bg-success"
                        : d.state === "current"
                          ? "bg-primary ring-4 ring-[var(--primary-main-24)]"
                          : "bg-grey-300"
                    }`}
                  />
                  <span className={`flex-1 text-sm ${d.state === "current" ? "font-bold text-text-primary" : "text-text-secondary"}`}>
                    {d.week}
                  </span>
                  <span className="font-mono text-sm font-bold text-text-primary">{d.dose}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-lg bg-primary-lighter px-3 py-2.5 text-xs leading-relaxed text-primary-dark">
              Dose increases are confirmed by your prescriber at each review — never change your dose on your own.
            </p>
          </section>
        </div>

        {/* deliveries */}
        <section id="deliveries" className="rounded-lg bg-background-paper p-6 shadow-card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-text-primary">Deliveries</h2>
            <span className="font-mono text-xs text-text-secondary">cold-chain · signed for</span>
          </div>
          <div className="mt-4 divide-y divide-[var(--divider)] text-sm">
            {[
              ["12 Aug 2026", "Mounjaro 5 mg · 4 doses", "Preparing", "warning"],
              ["15 Jul 2026", "Mounjaro 5 mg · 4 doses", "Delivered", "success"],
              ["17 Jun 2026", "Mounjaro 2.5 mg · 4 doses", "Delivered", "success"],
            ].map(([date, what, status, tone]) => (
              <div key={date as string} className="flex items-center justify-between gap-4 py-3">
                <span className="font-mono text-xs text-text-secondary">{date}</span>
                <span className="flex-1 text-text-primary">{what}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                    tone === "success" ? "bg-success-lighter text-success-dark" : "bg-warning-lighter text-warning-dark"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* placeholder notice */}
        <p className="rounded-lg border border-dashed border-[var(--divider)] px-4 py-3 text-center font-mono text-[11px] tracking-wide text-text-secondary">
          PATIENT PLATFORM PLACEHOLDER · FULL TRACKING EXPERIENCE (FC-13…18) TO BE DESIGNED
        </p>
      </div>
    </div>
  );
}

/** Tiny dependency-free SVG sparkline for the weight series. */
function Sparkline({ values }: { values: number[] }) {
  const w = 560;
  const h = 120;
  const pad = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => pad + (i * (w - pad * 2)) / (values.length - 1);
  const y = (v: number) => pad + ((max - v) * (h - pad * 2)) / (max - min || 1);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" role="img" aria-label="Weight trend, declining from 96.2 to 92.4 kg">
      <polyline
        points={`${points} ${x(last)},${h - pad} ${x(0)},${h - pad}`}
        fill="var(--primary-main-12)"
        stroke="none"
      />
      <polyline points={points} fill="none" stroke="var(--primary-main)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(values[last])} r="4" fill="var(--primary-main)" />
    </svg>
  );
}
