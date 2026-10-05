import Link from "next/link";
import { AttentionList } from "@/components/admin/AttentionList";
import {
  DoctorIdentity,
  DoctorStatusPill,
  MiniComplianceBar,
  WorkingOn,
} from "@/components/admin/doctorBits";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ACCESS_LABEL } from "@/lib/admin/types";
import { ADMIN_DOCTORS, ATTENTION_ROWS, OVERVIEW_KPIS } from "@/lib/admin/data";

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader
        title="Oversight"
        subtitle="5 escalations awaiting review · 36 prescriptions pending across 6 pharmacies"
      />

      <div className="px-6 py-6 lg:px-8">
        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {OVERVIEW_KPIS.map((k) => (
            <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} danger={k.danger} />
          ))}
        </div>

        {/* requires your attention — merges the seeded rows with whatever is
            sitting unclaimed on the live board right now */}
        <AttentionList seeded={ATTENTION_ROWS} />

        {/* clinical team */}
        <div className="mt-6 overflow-hidden rounded-lg bg-background-paper shadow-card">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-base font-bold text-text-primary">Clinical team</h2>
            <Link
              href="/admin/doctors"
              className="rounded-lg border border-[var(--divider)] px-4 py-2 text-sm font-semibold text-text-primary hover:bg-background-neutral"
            >
              Manage doctors
            </Link>
          </div>
          {/* scrolls at its natural width below lg; fits the viewport from lg up */}
          <div className="overflow-x-auto lg:overflow-x-visible">
            <div className="min-w-[760px] lg:min-w-0">
              <div className="grid grid-cols-[1.4fr_0.7fr_0.9fr_1.1fr_1fr] [&>*]:min-w-0 border-y border-[var(--divider)] bg-grey-100">
                {["Doctor", "Status", "Queue Access", "Working On", "SOP Compliance"].map((h) => (
                  <div key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">{h}</div>
                ))}
              </div>
              {ADMIN_DOCTORS.map((d) => (
                <div key={d.name} className="grid grid-cols-[1.4fr_0.7fr_0.9fr_1.1fr_1fr] [&>*]:min-w-0 items-center border-b border-[var(--divider)] last:border-0">
                  <div className="px-5 py-3"><DoctorIdentity doctor={d} /></div>
                  <div className="px-5 py-3"><DoctorStatusPill status={d.status} /></div>
                  <div className="px-5 py-3 text-sm text-text-secondary">{ACCESS_LABEL[d.access]}</div>
                  <div className="px-5 py-3"><WorkingOn cases={d.cases} /></div>
                  <div className="px-5 py-3"><MiniComplianceBar pct={d.pct} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
