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
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-darker/50 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full overflow-hidden rounded-lg bg-background-paper shadow-dialog ${
          size === "lg" ? "max-w-2xl" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-primary-darker via-primary-dark to-primary px-6 py-4 text-white">
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
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
