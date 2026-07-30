import Link from "next/link";
import {
  DoctorIdentity,
  DoctorStatusPill,
  MiniComplianceBar,
  QueueAccessBadge,
  WorkingOn,
} from "@/components/admin/doctorBits";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ADMIN_DOCTORS, ATTENTION_ROWS, OVERVIEW_KPIS } from "@/lib/admin/data";
import type { AttentionKind } from "@/lib/admin/types";
import type { Rag } from "@/lib/doctor/types";

const RAG_TEXT: Record<Rag, string> = {
  green: "text-success-dark",
  amber: "text-warning-dark",
  yellow: "text-warning-dark",
  red: "text-error",
};

const KIND_BADGE: Record<AttentionKind, { label: string; cls: string }> = {
  escalated: { label: "Escalated", cls: "bg-primary-dark text-white" },
  overdue: { label: "Overdue", cls: "bg-warning-lighter text-warning-darker" },
  compliance: { label: "Compliance", cls: "bg-warning-lighter text-warning-darker" },
};

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

        {/* requires your attention */}
        <div className="mt-6 overflow-hidden rounded-lg bg-background-paper shadow-card">
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            <h2 className="text-base font-bold text-text-primary">Requires your attention</h2>
            <span className="rounded-full bg-error-lighter px-2 py-0.5 text-xs font-bold text-error-dark">
              {ATTENTION_ROWS.length}
            </span>
          </div>
          {ATTENTION_ROWS.map((r, i) => {
            const badge = KIND_BADGE[r.kind];
            return (
              <div key={i} className="flex items-center gap-4 border-t border-[var(--divider)] px-5 py-3.5">
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
                  {badge.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{r.title}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {r.sub}
                    {r.waited && (
                      <>
                        {" · "}
                        <span className={`font-semibold ${r.waitedRag ? RAG_TEXT[r.waitedRag] : ""}`}>{r.waited}</span>
                      </>
                    )}
                  </p>
                </div>
                <Link
                  href={r.href}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold ${
                    r.action === "Review"
                      ? "bg-primary-dark text-white hover:bg-primary-darker"
                      : "border border-[var(--divider)] text-text-primary hover:bg-background-neutral"
                  }`}
                >
                  {r.action}
                </Link>
              </div>
            );
          })}
        </div>

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
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.4fr_0.7fr_0.9fr_1.1fr_1fr] border-y border-[var(--divider)] bg-grey-100">
                {["Doctor", "Status", "Queue Access", "Working On", "SOP Compliance"].map((h) => (
                  <div key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">{h}</div>
                ))}
              </div>
              {ADMIN_DOCTORS.map((d) => (
                <div key={d.name} className="grid grid-cols-[1.4fr_0.7fr_0.9fr_1.1fr_1fr] items-center border-b border-[var(--divider)] last:border-0">
                  <div className="px-5 py-3"><DoctorIdentity doctor={d} /></div>
                  <div className="px-5 py-3"><DoctorStatusPill status={d.status} /></div>
                  <div className="px-5 py-3"><QueueAccessBadge filter={d.filter} /></div>
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
