/** Tiny dependency-free SVG sparkline for a weight series (dashboard card). */
export function WeightSparkline({ values }: { values: number[] }) {
  const w = 560;
  const h = 120;
  const pad = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => pad + (i * (w - pad * 2)) / (values.length - 1);
  const y = (v: number) => pad + ((max - v) * (h - pad * 2)) / (max - min || 1);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 w-full"
      role="img"
      aria-label={`Weight trend from ${values[0]} to ${values[last]} kg`}
    >
      <polyline
        points={`${points} ${x(last)},${h - pad} ${x(0)},${h - pad}`}
        fill="var(--primary-main-12)"
        stroke="none"
      />
      <polyline points={points} fill="none" stroke="var(--primary-main)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(values[last])} r="4" fill="var(--primary-main)" />
    </svg>
  );
}
