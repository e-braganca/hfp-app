"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { CHART, ChartFrame, ChartTooltip, axisProps } from "./chart";

/**
 * Share of a cohort hitting the 6-month ≥5% weight-loss target, week by week.
 * The 90% governance target is drawn in, because the number only means
 * anything against the line it's supposed to clear.
 */
export function CohortTrendChart({ data, target = 90 }: { data: number[]; target?: number }) {
  const rows = data.map((pct, i) => ({ week: i + 1, pct }));
  const min = Math.max(0, Math.floor(Math.min(...data) / 10) * 10 - 10);

  return (
    <ChartFrame height={200}>
      <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -4 }}>
        <defs>
          <linearGradient id="cohortFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.line} stopOpacity={0.22} />
            <stop offset="100%" stopColor={CHART.line} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="week" {...axisProps} tickFormatter={(w: number) => `wk ${w}`} interval="preserveStartEnd" />
        <YAxis {...axisProps} domain={[min, 100]} width={48} tickFormatter={(v: number) => `${v}%`} />

        <ReferenceLine
          y={target}
          stroke={CHART.target}
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={{
            value: `target ${target}%`,
            position: "insideTopLeft",
            fill: "var(--color-secondary-dark)",
            fontSize: 10,
            fontFamily: "var(--font-mono)",
          }}
        />

        <Area
          type="monotone"
          dataKey="pct"
          stroke={CHART.line}
          strokeWidth={2.5}
          fill="url(#cohortFill)"
          dot={{ r: 2.5, fill: CHART.line, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: CHART.line, stroke: "var(--background-paper)", strokeWidth: 2 }}
          isAnimationActive={false}
        />

        <ChartTooltip
          format={(d) => ({
            title: `Cohort week ${d.week}`,
            rows: [
              { label: "Meeting target", value: `${d.pct}%`, colour: CHART.line },
              {
                label: "vs 90% target",
                value: `${(d.pct as number) >= target ? "+" : ""}${((d.pct as number) - target).toFixed(0)} pts`,
              },
            ],
          })}
        />
      </AreaChart>
    </ChartFrame>
  );
}
