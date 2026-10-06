"use client";

import type { ReactNode } from "react";

/** Centred modal with a gradient header, matching the doctor design. */
export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  /** "lg" when the dialog lists records rather than asking a single question */
  size = "md",
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
  /**
   * Actions pinned below the scroll area. A long dialog whose confirm button
   * scrolls off the bottom reads as broken — and on a short laptop screen it
   * can be unreachable entirely, since the dialog itself is what overflows.
   */
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-darker/50 p-4"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-lg bg-background-paper shadow-dialog ${
          size === "lg" ? "max-w-2xl" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-[var(--divider)] bg-background-paper px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
