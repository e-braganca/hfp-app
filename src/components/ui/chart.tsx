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

/* ---- callouts on the plot -------------------------------------------------
   The two numbers a reader actually wants — where they are now and where
   they're heading — printed on the line itself instead of being locked behind
   a hover. Hover is a pointer affordance: on a phone there is nothing to hover
   with, so anything only reachable that way is, for half the users, not shown.
   -------------------------------------------------------------------------- */

const PILL_H = 20;
/** 11px Inconsolata is monospaced, so character count sizes the box exactly. */
const CHAR_W = 6.4;

/** A value badge drawn in SVG so it tracks the point through resizes. */
export function ChartPill({
  x,
  y,
  text,
  colour,
  anchor = "middle",
  solid = false,
}: {
  x: number;
  y: number;
  text: string;
  colour: string;
  anchor?: "start" | "middle" | "end";
  solid?: boolean;
}) {
  const w = Math.round(text.length * CHAR_W + 16);
  const left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return (
    <g>
      <rect
        x={left}
        y={y - PILL_H / 2}
        width={w}
        height={PILL_H}
        rx={PILL_H / 2}
        fill={solid ? colour : "var(--color-background-paper)"}
        stroke={colour}
        strokeWidth={solid ? 0 : 1.25}
      />
      <text
        x={left + w / 2}
        y={y + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fontFamily="var(--font-mono)"
        fill={solid ? "#fff" : colour}
      >
        {text}
      </text>
    </g>
  );
}

interface DotArgs {
  cx?: number;
  cy?: number;
  index?: number;
}

/**
 * Dot renderer that calls one point out by value. `at` is usually the last
 * real reading — "you are here" — and the rest of the series keeps whatever
 * plain dots it had.
 */
export function valueDots({
  at,
  text,
  colour,
  r = 0,
  dy = -18,
  anchor = "middle",
}: {
  at: number;
  text: string;
  colour: string;
  /** radius for the ordinary points; 0 draws none */
  r?: number;
  /** where the pill sits relative to the point — negative is above */
  dy?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return function Dots({ cx, cy, index }: DotArgs) {
    // null gaps in the series arrive with no coordinates
    if (cx == null || cy == null) return <g key={`dot-${index}`} />;
    return (
      <g key={`dot-${index}`}>
        {r > 0 && <circle cx={cx} cy={cy} r={r} fill={colour} />}
        {index === at && (
          <>
            <circle cx={cx} cy={cy} r={4.5} fill={colour} stroke="var(--color-background-paper)" strokeWidth={2} />
            <ChartPill x={cx} y={cy + dy} text={text} colour={colour} anchor={anchor} solid />
          </>
        )}
      </g>
    );
  };
}

/**
 * Label for a ReferenceLine, in the same badge idiom. Pass it straight to
 * `label` — Recharts clones it with the line's viewBox.
 */
export function referencePill({
  text,
  side = "right",
  dy = 0,
  colour = "var(--color-secondary-dark)",
}: {
  text: string;
  side?: "left" | "right";
  /** nudge off the line — negative sits above it */
  dy?: number;
  colour?: string;
}) {
  function Label({ viewBox }: { viewBox?: { x?: number; y?: number; width?: number; height?: number } }) {
    const { x = 0, y = 0, width = 0 } = viewBox ?? {};
    return (
      <ChartPill
        x={side === "right" ? x + width - 4 : x + 4}
        y={y + dy}
        text={text}
        colour={colour}
        anchor={side === "right" ? "end" : "start"}
      />
    );
  }
  return <Label />;
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
