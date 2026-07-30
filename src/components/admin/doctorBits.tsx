// Small, reusable admin doctor UI bits — shared by the Overview team table and
// the Doctors management page.
import { RAG_FILL, complianceRag } from "@/lib/doctor/rag";
import type { AdminDoctor, DoctorStatus, QueueFilter } from "@/lib/admin/types";

export function DoctorStatusPill({ status }: { status: DoctorStatus }) {
  const map = {
    active: { label: "Active", cls: "bg-success-lighter text-success-darker" },
    suspended: { label: "Suspended", cls: "bg-error-lighter text-error-dark" },
    onboarding: { label: "Onboarding", cls: "bg-warning-lighter text-warning-darker" },
  }[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${map.cls}`}>{map.label}</span>;
}

export function QueueAccessBadge({ filter }: { filter: QueueFilter }) {
  return filter === "green" ? (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-success-lighter px-2.5 py-1 text-xs font-semibold text-success-darker">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      Green-only
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-grey-200 px-2.5 py-1 text-xs font-semibold text-text-primary">
      Full queue
    </span>
  );
}

export function DoctorIdentity({ doctor }: { doctor: AdminDoctor }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-xs font-bold text-primary-dark">
        {doctor.initials}
      </span>
      <div>
        <p className="text-sm font-bold text-text-primary">{doctor.name}</p>
        <p className="font-mono text-xs text-text-secondary">
          {doctor.gmc === "pending" ? "GMC pending" : `GMC ${doctor.gmc}`}
        </p>
      </div>
    </div>
  );
}

export function WorkingOn({ cases }: { cases: AdminDoctor["cases"] }) {
  if (cases.length === 0) return <span className="text-xs text-text-disabled">No cases</span>;
  const shown = cases.slice(0, 2);
  const more = cases.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((c) => (
        <span key={c.ref} className="rounded-md bg-background-neutral px-2 py-0.5 font-mono text-xs font-semibold text-text-primary">
          {c.ref}
        </span>
      ))}
      {more > 0 && <span className="text-xs text-text-secondary">+{more} more</span>}
    </div>
  );
}

export function MiniComplianceBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-text-disabled">Onboarding</span>;
  const rag = complianceRag(pct);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-background-neutral">
        <div className={`h-full rounded-full ${RAG_FILL[rag]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-sm font-bold text-text-primary">{pct}%</span>
    </div>
  );
}

export function CaseCategoryPill({ cat }: { cat: string }) {
  return (
    <span className="rounded-md bg-grey-200 px-2 py-0.5 text-xs font-semibold text-text-secondary">{cat}</span>
  );
}
