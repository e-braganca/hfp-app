import { CohortTrendChart } from "@/components/ui/CohortTrendChart";
import { ComplianceBar } from "@/components/ui/ComplianceBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExportIcon } from "@/components/ui/icons";
import {
  CLINICIAN_COMPLIANCE,
  COHORT_TREND,
  PHARMACY_COMPLIANCE,
} from "@/lib/doctor/data";

/**
 * Compliance & Governance dashboard — shared verbatim by doctor and admin
 * (the legacy build injected identical markup into both shells).
 */
export function ComplianceView() {
  return (
    <>
      <PageHeader
        title="Compliance & Governance"
        subtitle="Clinical oversight across all clinicians and pharmacies"
      />

      <div className="px-6 py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-background-paper px-5 py-4 shadow-card">
          <p className="flex items-center gap-3 text-sm text-text-primary">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>
              <strong>North-star metric:</strong> SOP compliance ≥ 90% per pharmacy — evidence exportable for CQC audit
            </span>
          </p>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            <ExportIcon width={16} height={16} />
            Export report
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Clinician SOP compliance">
            {CLINICIAN_COMPLIANCE.map((c) => (
              <ComplianceBar key={c.name} name={c.name} pct={c.pct} />
            ))}
          </Panel>
          <Panel title="Pharmacy SOP compliance">
            {PHARMACY_COMPLIANCE.map((p) => (
              <ComplianceBar key={p.name} name={p.name} pct={p.pct} />
            ))}
          </Panel>
        </div>

        <div className="mt-6 rounded-lg bg-background-paper p-6 shadow-card">
          <p className="text-sm font-bold text-text-primary">Weight-loss outcomes — cohort trend</p>
          <p className="text-xs text-text-secondary">
            Share of patients meeting the 6-month ≥ 5% weight-loss target, by cohort week.
          </p>
          <div className="mt-4">
            <CohortTrendChart data={COHORT_TREND} />
          </div>
        </div>
      </div>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-background-paper p-6 shadow-card">
      <div className="flex items-center justify-between border-b border-[var(--divider)] pb-3">
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
      </div>
      <div className="mt-2 divide-y divide-[var(--divider)]">{children}</div>
    </div>
  );
}
