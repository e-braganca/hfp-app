import { PageHeader } from "@/components/ui/PageHeader";
import { PharmacyLabel } from "@/components/ui/PharmacyLabel";
import { StatTile } from "@/components/ui/StatTile";
import { PATIENTS } from "@/lib/doctor/data";
import type { PatientStatus } from "@/lib/doctor/types";

const STATUS_PILL: Record<PatientStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-success-lighter text-success-darker" },
  review: { label: "In review", cls: "bg-warning-lighter text-warning-darker" },
  paused: { label: "Paused", cls: "bg-grey-200 text-text-secondary" },
};

export default function PatientsPage() {
  const total = PATIENTS.length;
  const active = PATIENTS.filter((p) => p.status === "active").length;
  const review = PATIENTS.filter((p) => p.status === "review").length;
  const paused = PATIENTS.filter((p) => p.status === "paused").length;

  // scrolls at its natural width below lg; fluid (and truncating) from lg up
  const cols = "grid-cols-[1.2fr_0.55fr_0.45fr_1.15fr_1.5fr_0.95fr_1fr] [&>*]:min-w-0";

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Unified patient record across all connected pharmacies"
      />

      <div className="px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile value={total} label="Total patients" />
          <StatTile value={active} label="Active treatments" tone="success" />
          <StatTile value={review} label="In review" tone="warning" />
          <StatTile value={paused} label="Paused" tone="muted" />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg bg-background-paper shadow-card">
          <div className="overflow-x-auto lg:overflow-x-visible">
            <div className="min-w-[880px] lg:min-w-0">
              <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
                <Head>Patient</Head>
                <Head>Age / Sex</Head>
                <Head>BMI</Head>
                <Head>Pharmacy</Head>
                <Head>Medication / Dose</Head>
                <Head>Status</Head>
                <Head>Last Review</Head>
              </div>
              {PATIENTS.map((p) => {
                const s = STATUS_PILL[p.status];
                return (
                  <div
                    key={p.ref}
                    className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 hover:bg-grey-100`}
                  >
                    <div className="px-4 py-4">
                      <div className="truncate text-sm font-bold text-text-primary" title={p.name}>{p.name}</div>
                      <div className="font-mono text-xs text-text-secondary">{p.ref}</div>
                    </div>
                    <div className="px-4 py-4 text-sm text-text-secondary">{p.age} · {p.sex[0]}</div>
                    <div className="px-4 py-4 text-sm text-text-secondary">{p.bmi}</div>
                    <div className="px-4 py-4"><PharmacyLabel code={p.pharmacyCode} /></div>
                    <div className="px-4 py-4">
                      <div className="truncate text-sm font-semibold text-text-primary" title={p.med}>{p.med}</div>
                      <div className="text-xs text-text-secondary">{p.dose}</div>
                    </div>
                    <div className="px-4 py-4">
                      <span className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="truncate px-4 py-4 text-sm text-text-secondary">{p.lastReview}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
      {children}
    </div>
  );
}
