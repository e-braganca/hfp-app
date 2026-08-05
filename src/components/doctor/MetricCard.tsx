import type { QueueMetric } from "@/lib/doctor/types";

/**
 * Queue KPI tile. Light card on the neutral page, matching the stat tiles the
 * rest of the platform uses — the dark slate version made the top of the
 * queue read as a separate app.
 */
export function MetricCard({ metric }: { metric: QueueMetric }) {
  return (
    <div className="rounded-lg bg-background-paper px-5 py-4 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
        {metric.label}
      </p>
      <div className="mt-2 flex items-end gap-6">
        {metric.thisWeek !== undefined && (
          <div>
            <div className="font-mono text-3xl font-extrabold leading-none text-text-primary">
              {metric.thisWeek}
            </div>
            <div className="mt-1 text-[11px] text-text-secondary">this week</div>
          </div>
        )}
        <div>
          <div className="font-mono text-3xl font-extrabold leading-none text-primary">
            {metric.open}
          </div>
          <div className="mt-1 text-[11px] text-text-secondary">open</div>
        </div>
      </div>
    </div>
  );
}
