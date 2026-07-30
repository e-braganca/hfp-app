import type { QueueMetric } from "@/lib/doctor/types";

/** Dark slate KPI tile used across the top of the Work Queue. */
export function MetricCard({ metric }: { metric: QueueMetric }) {
  return (
    <div className="rounded-lg bg-primary-dark px-6 py-5 text-white shadow-z8">
      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-white/70">
        {metric.label}
      </p>
      <div className="mt-2 flex items-end justify-center gap-6">
        {metric.thisWeek !== undefined && (
          <div className="text-center">
            <div className="font-mono text-3xl font-extrabold leading-none">
              {metric.thisWeek}
            </div>
            <div className="mt-1 text-[11px] text-white/60">this week</div>
          </div>
        )}
        <div className="text-center">
          <div className="font-mono text-3xl font-extrabold leading-none">
            {metric.open}
          </div>
          <div className="mt-1 text-[11px] text-white/60">open</div>
        </div>
      </div>
    </div>
  );
}
