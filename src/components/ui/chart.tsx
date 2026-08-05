"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer, Tooltip } from "recharts";

/* ============================================================================
   Chart shell — Recharts wired to this app's design tokens.

   Recharts owns axes, scales, tooltips and responsiveness; the look stays
   ours. Colours come from the same CSS variables the rest of the platform
   reads, so a change to the sage palette moves the charts with it, and the
   RAG colours in a chart are the RAG colours everywhere else.
   ============================================================================ */

export const CHART = {
  line: "var(--primary-main)",
  lineSoft: "var(--primary-light)",
  target: "var(--color-secondary)",
  grid: "var(--divider)",
  axis: "var(--color-text-disabled)",
  fill: "var(--primary-main-12)",
} as const;

/** Shared axis styling — set once so every chart agrees on tick weight. */
export const axisProps = {
  stroke: CHART.axis,
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" },
} as const;

export function ChartFrame({ height = 260, children }: { height?: number; children: React.ReactElement }) {
  return (
    <div style={{ height }} className="mt-4 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipRow {
  label: string;
  value: string;
  colour?: string;
}

/**
 * Tooltip in the app's card idiom rather than Recharts' default white box.
 * Takes a formatter so each chart says what its numbers mean — "92.4 kg", not
 * a bare number a patient has to interpret.
 */
export function ChartTooltip({
  format,
}: {
  format: (payload: Record<string, unknown>) => { title: string; rows: TooltipRow[] } | null;
}) {
  return (
    <Tooltip
      cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const data = payload[0].payload as Record<string, unknown>;
        const out = format(data);
        if (!out) return null;
        return (
          <div className="rounded-lg border border-[var(--divider)] bg-background-paper px-3 py-2 shadow-dialog">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{out.title}</p>
            {out.rows.map((r) => (
              <p key={r.label} className="mt-0.5 flex items-center gap-2 text-sm">
                {r.colour && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.colour }} />}
                <span className="text-text-secondary">{r.label}</span>
                <span className="ml-auto font-mono font-bold text-text-primary">{r.value}</span>
              </p>
            ))}
          </div>
        );
      }}
    />
  );
}

/** Legend rows, kept out of Recharts so they read as part of the card. */
export function ChartLegend({ items }: { items: { label: ReactNode; colour: string; dashed?: boolean }[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-secondary">
      {items.map((i, n) => (
        <span key={n} className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-5 rounded-full"
            style={
              i.dashed
                ? { backgroundImage: `repeating-linear-gradient(90deg, ${i.colour} 0 4px, transparent 4px 8px)` }
                : { background: i.colour }
            }
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
