"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, type NavConfig, type NavItem } from "@/lib/nav";

/**
 * Config-driven desktop sidebar (lg+). Shared by every role — pass the role's
 * NavConfig. Dark sage rail with grouped nav, optional therapy-area list,
 * notifications, and an identity / sign-out footer.
 */
export function AppSidebar({ config }: { config: NavConfig }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    pathname === item.href ||
    pathname.startsWith(item.href + "/") ||
    (item.match?.some((m) => pathname.startsWith(m)) ?? false);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-primary-dark text-white lg:flex">
      <div className="px-6 pb-4 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-white.svg" alt={config.brand} className="h-5 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {config.groups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-6" : ""}>
            <GroupLabel>{group.label}</GroupLabel>
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-white/15 font-semibold text-white"
                      : "font-medium text-grey-500 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        active ? "bg-white/25 text-white" : "bg-white/15 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {config.therapyAreas && (
          <div className="mt-6">
            <GroupLabel>Therapy areas</GroupLabel>
            {config.therapyAreas.map((t) => (
              <div
                key={t.label}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  t.live ? "text-white/90" : "text-white/35"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${t.live ? "bg-secondary-light" : "bg-white/25"}`} />
                <span className="flex-1 truncate">{t.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    t.live ? "bg-secondary-light/20 text-secondary-light" : "bg-white/10 text-white/40"
                  }`}
                >
                  {t.live ? "Live" : "Soon"}
                </span>
              </div>
            ))}
          </div>
        )}
      </nav>

      {config.notificationsBadge && (
        <button
          type="button"
          className="mx-3 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-grey-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <BellIcon />
          <span className="flex-1 text-left">Notifications</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">
            {config.notificationsBadge}
          </span>
        </button>
      )}

      <Link
        href={config.identity.signOutHref}
        className="m-3 flex items-center gap-3 rounded-lg bg-white/10 px-3 py-3 transition-colors hover:bg-white/15"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-light/30 text-xs font-bold text-white">
          {config.identity.initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{config.identity.name}</span>
          <span className="block truncate text-[11px] text-white/60">{config.identity.role}</span>
        </span>
      </Link>
    </aside>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
      {children}
    </p>
  );
}
