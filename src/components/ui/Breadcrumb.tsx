import Link from "next/link";
import { ArrowLeft } from "./icons";

/** "← Work Queue / New Orders / PT-4471" breadcrumb on detail pages. */
export function Breadcrumb({
  backHref,
  backLabel = "Work Queue",
  trail,
}: {
  backHref: string;
  /** where "back" goes — not every detail page hangs off the queue */
  backLabel?: string;
  trail: string[];
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={backHref}
        className="flex items-center gap-2 rounded-lg border border-[var(--divider)] bg-background-paper px-3 py-1.5 font-semibold text-text-primary hover:bg-background-neutral"
      >
        <ArrowLeft width={16} height={16} />
        {backLabel}
      </Link>
      <span className="flex items-center gap-2 text-text-secondary">
        {trail.map((t, i) => (
          <span key={t} className="flex items-center gap-2">
            {i > 0 && <span className="text-text-disabled">/</span>}
            <span className={i === trail.length - 1 ? "text-text-primary" : ""}>{t}</span>
          </span>
        ))}
      </span>
    </div>
  );
}
