import { pharmacyName } from "@/lib/doctor/data";

/** Small pharmacy chip used inside queue/patient tables. */
export function PharmacyLabel({ code }: { code: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-text-primary">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background-neutral text-text-disabled">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
          <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      {pharmacyName(code)}
    </span>
  );
}
