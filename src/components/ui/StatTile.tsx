/** Light KPI tile (Patients page): big number + caption. */
export function StatTile({
  value,
  label,
  tone = "default",
}: {
  value: number | string;
  label: string;
  tone?: "default" | "success" | "warning" | "muted";
}) {
  const toneCls = {
    default: "text-text-primary",
    success: "text-success-dark",
    warning: "text-warning-dark",
    muted: "text-text-secondary",
  }[tone];
  return (
    <div className="rounded-lg bg-background-paper px-5 py-4 shadow-card">
      <div className={`font-mono text-3xl font-extrabold ${toneCls}`}>{value}</div>
      <div className="mt-1 text-sm text-text-secondary">{label}</div>
    </div>
  );
}
