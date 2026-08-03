/** Thin labelled progress segments used by the short patient wizards
 *  (re-order, verification catch-up). `current` is the active index. */
export function StepperBar({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col gap-1.5">
          <span className={`h-1 rounded-full ${i <= current ? "bg-primary" : "bg-grey-300"}`} />
          <span className={`text-[11px] font-bold ${i === current ? "text-primary-dark" : "text-text-disabled"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}
