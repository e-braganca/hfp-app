/** Light KPI card: uppercase label, big value, sub-line. Used on admin dashboards. */
export function KpiCard({
  label,
  value,
  sub,
  danger = false,
}: {
  label: string;
  value: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg bg-background-paper px-5 py-4 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-extrabold ${danger ? "text-error" : "text-text-primary"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>
    </div>
  );
}
