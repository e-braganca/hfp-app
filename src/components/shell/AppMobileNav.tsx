"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavConfig } from "@/lib/nav";

/** Config-driven bottom tab bar (below lg). Flattens nav groups to ≤5 items. */
export function AppMobileNav({ config }: { config: NavConfig }) {
  const pathname = usePathname();
  const items = config.groups
    .flatMap((g) => g.items)
    .filter((i) => !i.hideOnMobile)
    .slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-white/10 bg-primary-dark text-white lg:hidden">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (!item.exact && pathname.startsWith(item.href + "/")) ||
          (item.match?.some((m) => pathname.startsWith(m)) ?? false);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${
              active ? "text-white" : "text-grey-500"
            }`}
          >
            <Icon width={20} height={20} />
            <span className="truncate">{item.short ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
