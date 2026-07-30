// Reusable onboarding funnel UI primitives.
import type { ReactNode } from "react";
import { CheckIcon } from "@/components/ui/icons";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">{children}</p>
  );
}

export function StepHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-text-primary">
        {title}
      </h1>
      {sub && <p className="mt-2 text-base text-text-secondary">{sub}</p>}
    </div>
  );
}

/** Selectable option card (single- or multi-select). */
export function OptionCard({
  label,
  desc,
  selected,
  onClick,
}: {
  label: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border-2 px-5 py-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary-lighter"
          : "border-[var(--divider)] bg-background-paper hover:border-primary-light"
      }`}
    >
      <span className="flex-1">
        <span className="block text-base font-semibold text-text-primary">{label}</span>
        {desc && <span className="mt-0.5 block text-sm text-text-secondary">{desc}</span>}
      </span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-primary bg-primary text-white" : "border-grey-400 bg-background-paper"
        }`}
      >
        {selected && <CheckIcon width={14} height={14} />}
      </span>
    </button>
  );
}

/** Yes / No segmented control. Yes = red when chosen, No = green when chosen. */
export function YesNo({
  value,
  onChange,
}: {
  value?: "yes" | "no";
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => onChange("yes")}
        className={`h-9 w-14 rounded-lg text-sm font-bold transition-colors ${
          value === "yes" ? "bg-error text-white" : "bg-grey-100 text-text-primary hover:bg-grey-200"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange("no")}
        className={`h-9 w-14 rounded-lg text-sm font-bold transition-colors ${
          value === "no" ? "bg-primary text-white" : "bg-grey-100 text-text-primary hover:bg-grey-200"
        }`}
      >
        No
      </button>
    </div>
  );
}

/** Number field with a unit suffix. */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  placeholder?: string;
}) {
  return (
    <label className="block flex-1">
      <span className="mb-1.5 block text-sm text-text-secondary">{label}</span>
      <span className="relative flex items-center">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 pr-12 text-xl font-bold text-text-primary focus:border-primary focus:outline-none"
        />
        <span className="pointer-events-none absolute right-4 text-sm text-text-secondary">{suffix}</span>
      </span>
    </label>
  );
}

/** Dashed capture card for live photo / ID (mock: toggles a boolean). */
export function CaptureCard({
  icon,
  captured,
  captureLabel,
  onCapture,
  note,
}: {
  icon: ReactNode;
  captured: boolean;
  captureLabel: string;
  onCapture: () => void;
  note: string;
}) {
  return (
    <div>
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center ${
          captured ? "border-primary bg-primary-lighter" : "border-[var(--divider)] bg-background-paper"
        }`}
      >
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full ${
            captured ? "bg-primary text-white" : "bg-background-neutral text-text-disabled"
          }`}
        >
          {captured ? <CheckIcon width={28} height={28} /> : icon}
        </span>
        <button
          type="button"
          onClick={onCapture}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
        >
          {captured ? "Retake" : captureLabel}
        </button>
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning-lighter px-3 py-2.5 text-sm text-warning-darker">
        <WarnDot />
        {note}
      </p>
    </div>
  );
}

function WarnDot() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-warning-dark">
      <path d="M12 4 2.5 20h19z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Summary row (label left, value right) used on eligible/review screens. */
export function SummaryCard({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--divider)] bg-background-paper">
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-center justify-between gap-4 px-5 py-4 ${
            i > 0 ? "border-t border-[var(--divider)]" : ""
          }`}
        >
          <span className="text-sm text-text-secondary">{r.label}</span>
          <span className="text-right text-sm font-bold text-text-primary">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Big outcome ring icon. */
export function ResultRing({ tone }: { tone: "ok" | "blocked" | "info" }) {
  const map = {
    ok: { bg: "bg-success-lighter", fg: "text-success-dark", icon: <CheckIcon width={36} height={36} /> },
    blocked: {
      bg: "bg-error-lighter",
      fg: "text-error",
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    info: {
      bg: "bg-warning-lighter",
      fg: "text-warning-dark",
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  }[tone];
  return (
    <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${map.bg} ${map.fg}`}>
      {map.icon}
    </div>
  );
}
