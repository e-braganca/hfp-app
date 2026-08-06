"use client";

import { Area, AreaChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { CHART, ChartFrame, ChartTooltip, axisProps, referencePill, valueDots } from "@/components/ui/chart";
import type { Projection } from "@/lib/patient/projection";

/**
 * Dashboard weight sparkline: logged weights continued by the trial
 * projection. Deliberately a near-term window — plotting the whole 72-week
 * horizon squeezes the patient's actual check-ins into a few pixels; the full
 * horizon is on /patient/weight. Today's weight and the target are both
 * labelled on the plot, the target pinned to the floor with a caret when it
 * falls below the window.
 */
export function WeightSparkline({ values, projection }: { values: number[]; projection: Projection }) {
  const logged = values.length - 1;
  const horizon = Math.min(projection.horizonWeeks, logged + 14);

  const data = Array.from({ length: horizon + 1 }, (_, week) => ({
    week,
    actual: week <= logged ? values[week] : null,
    // starts where the check-ins stop, so it never draws over them
    projected: week >= logged ? projection.at(week) : null,
  }));

  const shown = [...values, ...data.map((d) => d.projected).filter((v): v is number => v !== null)];
  const min = Math.floor(Math.min(...shown) - 1);
  const max = Math.ceil(Math.max(...shown) + 1);
  const targetInView = projection.targetKg >= min && projection.targetKg <= max;

  return (
    <ChartFrame height={150}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.line} stopOpacity={0.16} />
            <stop offset="100%" stopColor={CHART.line} stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis dataKey="week" hide />
        <YAxis {...axisProps} domain={[min, max]} width={40} tickCount={3} />

        {targetInView ? (
          <ReferenceLine
            y={projection.targetKg}
            stroke={CHART.target}
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={referencePill({ text: `target ${projection.targetKg.toFixed(1)}`, dy: -12 })}
          />
        ) : (
          // the target sits well below a 14-week window; pinning it to the
          // floor with a caret says where it is without flattening the line
          <ReferenceLine
            y={min}
            stroke="none"
            label={referencePill({ text: `target ${projection.targetKg.toFixed(1)} ↓`, dy: -14 })}
          />
        )}

        <Area
          type="monotone"
          dataKey="projected"
          stroke={CHART.lineSoft}
          strokeDasharray="4 4"
          strokeWidth={2}
          fill="none"
          dot={false}
          activeDot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke={CHART.line}
          strokeWidth={2.5}
          fill="url(#sparkFill)"
          dot={valueDots({ at: logged, text: `${values[logged].toFixed(1)} kg`, colour: CHART.line, dy: -20 })}
          activeDot={{ r: 4, fill: CHART.line, stroke: "var(--color-background-paper)", strokeWidth: 2 }}
          connectNulls={false}
          isAnimationActive={false}
        />

        <ChartTooltip
          format={(d) => {
            const actual = d.actual as number | null;
            const projected = d.projected as number | null;
            return {
              title: (d.week as number) === 0 ? "Programme start" : `Week ${d.week}`,
              rows: [
                ...(actual !== null ? [{ label: "Logged", value: `${actual.toFixed(1)} kg`, colour: CHART.line }] : []),
                ...(projected !== null
                  ? [{ label: "Trial average", value: `${projected.toFixed(1)} kg`, colour: CHART.lineSoft }]
                  : []),
              ],
            };
          }}
        />
      </AreaChart>
    </ChartFrame>
  );
}
