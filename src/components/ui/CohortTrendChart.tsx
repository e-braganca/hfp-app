/** Simple SVG area chart for the weight-loss cohort trend. Values 0–100. */
export function CohortTrendChart({ data }: { data: number[] }) {
  const W = 640;
  const H = 180;
  const pad = 8;
  const max = 100;
  const stepX = (W - pad * 2) / (data.length - 1);
  const x = (i: number) => pad + i * stepX;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);

  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = `${line} L ${x(data.length - 1)} ${H - pad} L ${x(0)} ${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Cohort weight-loss trend">
      <defs>
        <linearGradient id="cohortFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary-main)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary-main)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cohortFill)" />
      <path d={line} fill="none" stroke="var(--primary-main)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="var(--primary-main)" />
      ))}
    </svg>
  );
}
