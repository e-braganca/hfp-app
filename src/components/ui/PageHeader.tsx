import type { ReactNode } from "react";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Sticky page header inside the doctor content area: title + subtitle on the
 * left, patient search on the right. Matches the Figma doctor topbar.
 */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** optional left-side extra (e.g. breadcrumb) rendered under the title */
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[var(--divider)] bg-background-neutral/90 px-6 py-4 backdrop-blur lg:px-8">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 truncate text-sm text-text-secondary">{subtitle}</p>
        )}
        {children}
      </div>
      <label className="relative hidden items-center sm:flex">
        <span className="pointer-events-none absolute left-3 text-text-disabled">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search patient ref or NHS no."
          className="h-10 w-64 rounded-lg border border-[var(--divider)] bg-background-paper pl-10 pr-3 text-sm text-text-primary placeholder:text-text-disabled focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24 lg:w-80"
        />
      </label>
    </header>
  );
}
