import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";

/**
 * Two-column review layout shared by New Order Review and Complex Repeat
 * Review. From lg the page is exactly one viewport tall: the left rail of
 * context cards is the only thing that scrolls, and the AI card on the right
 * fills the remaining height with its decision actions pinned to the bottom.
 * Below lg it falls back to a normal stacked, document-scrolling page.
 */
export function ReviewShell({
  title,
  subtitle,
  backHref,
  trail,
  banner,
  left,
  right,
}: {
  title: string;
  subtitle: string;
  backHref: string;
  trail: string[];
  /** reservation / claim state strip, above the columns */
  banner?: ReactNode;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="flex flex-col lg:h-dvh lg:overflow-hidden">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="shrink-0 space-y-4 px-6 pt-5 lg:px-8">
        <Breadcrumb backHref={backHref} trail={trail} />
        {banner}
      </div>

      <div className="grid gap-6 px-6 py-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(320px,380px)_1fr] lg:px-8">
        {/* the only scroller — negative margin + padding keeps card shadows
            from being clipped by the overflow box */}
        <div className="space-y-6 lg:-mx-1 lg:h-full lg:overflow-y-auto lg:px-1">{left}</div>
        <div className="lg:min-h-0">{right}</div>
      </div>
    </div>
  );
}
