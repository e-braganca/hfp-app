// ============================================================================
// Patient information-request emails.
//
// Prescribers and admins send these from the case they're reviewing. The
// greeting and sign-off are fixed by the platform so every message from
// Prescriptr reads the same way and no one has to re-type them — templates
// only supply the middle. Custom templates persist in localStorage in the
// demo (same external-store pattern as pharmacy applications).
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  /** the middle of the email — greeting and sign-off are added around it */
  body: string;
  custom?: boolean;
}

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "weight-photo",
    name: "Current weight & live photo",
    subject: "We need an up-to-date weight photo",
    body: `Before your prescriber can complete this review, we need an up-to-date weight measurement with a live photo.

Please sign in to your Prescriptr dashboard and use "Provide photos now" — the photo has to be taken on your camera at the time, so gallery uploads can't be accepted.

It takes about a minute, and your order stays on hold until we have it.`,
  },
  {
    id: "blood-pressure",
    name: "Blood pressure readings",
    subject: "Please send us your recent blood pressure readings",
    body: `Your prescriber would like to see recent blood pressure readings before continuing your treatment.

If you can, take three readings over three different days — sitting down, after five minutes of rest — and reply to this email with the numbers and the dates.

Most pharmacies will take a reading for you free of charge if you don't have a monitor at home.`,
  },
  {
    id: "pregnancy",
    name: "Pregnancy / breastfeeding confirmation",
    subject: "A quick confirmation before we continue",
    body: `Before your prescriber can issue this treatment, we need you to confirm in writing that you are not pregnant, not breastfeeding, and not planning a pregnancy in the next two months.

GLP-1 treatment isn't suitable during pregnancy or breastfeeding, so this check is required every time — it isn't specific to your case.

Please reply to this email to confirm.`,
  },
  {
    id: "medications",
    name: "Current medications",
    subject: "Please confirm your current medications",
    body: `Your prescriber needs an up-to-date list of everything you're taking before completing this review.

Please reply with all prescription medicines, over-the-counter medicines and supplements you take regularly, including the dose for each. If nothing has changed since your last order, just reply to say so.`,
  },
  {
    id: "side-effects",
    name: "Side-effect detail",
    subject: "Tell us more about the side effects you reported",
    body: `Thank you for reporting side effects on your last check-in. Your prescriber would like a little more detail before deciding on your next dose.

Please reply describing what you experienced, when it started, how long it lasted, and whether it's improving or getting worse.

If your symptoms are severe — persistent vomiting, severe stomach pain, or signs of an allergic reaction — please call 111 now, or 999 in an emergency, rather than waiting for a reply.`,
  },
  {
    id: "id-document",
    name: "Identity document",
    subject: "We need to verify your identity",
    body: `We were unable to verify your identity from the document supplied.

Please sign in to your Prescriptr dashboard and photograph your passport or UK driving licence again, making sure the whole document is in frame, in focus, and free of glare.`,
  },
  {
    id: "weight-history",
    name: "Weight history & previous attempts",
    subject: "A few questions about your weight history",
    body: `To complete your review, your prescriber would like to understand your weight history.

Please reply telling us roughly how long you have been trying to lose weight, which approaches you have tried before (including any weight-loss medication), and what results you had with them.`,
  },
  {
    id: "blood-tests",
    name: "Recent blood tests",
    subject: "Please share your recent blood test results",
    body: `Your prescriber would like to see any blood tests you've had in the last 12 months — particularly HbA1c, kidney function and thyroid results.

You can usually download these from your GP's online services or the NHS App. Please attach them to your reply.`,
  },
];

/** Greeting the platform always prepends. UK convention: Mr / Ms + surname. */
export function salutationFor(fullName: string, sex?: "Male" | "Female"): string {
  const surname = fullName.trim().split(/\s+/).slice(-1)[0] || fullName;
  const title = sex === "Male" ? "Mr" : sex === "Female" ? "Ms" : "";
  return title ? `${title} ${surname}` : fullName;
}

/** Demo inbox address derived from the patient's name. */
export const emailFor = (fullName: string) =>
  `${fullName.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).join(".")}@email.com`;

export const signOffFor = (sender: string, role: string) =>
  `Best regards,\n${sender}\n${role}\nPrescriptr — Health Finder Pro`;

/* ---- custom template store (localStorage) --------------------------------- */

const KEY = "hfp-email-templates";
const EMPTY: EmailTemplate[] = [];
let cache: EmailTemplate[] | null = null;
const listeners = new Set<() => void>();

export function subscribeTemplates(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getTemplatesSnapshot(): EmailTemplate[] {
  if (cache === null) {
    try {
      cache = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as EmailTemplate[];
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

export const getTemplatesServerSnapshot = (): EmailTemplate[] => EMPTY;

export function saveTemplate(name: string, subject: string, body: string): EmailTemplate {
  const tpl: EmailTemplate = {
    id: `custom-${Date.now().toString(36)}`,
    name: name.trim(),
    subject: subject.trim(),
    body,
    custom: true,
  };
  const all = [...getTemplatesSnapshot(), tpl];
  window.localStorage.setItem(KEY, JSON.stringify(all));
  cache = all;
  listeners.forEach((l) => l());
  return tpl;
}

export function deleteTemplate(id: string) {
  const all = getTemplatesSnapshot().filter((t) => t.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(all));
  cache = all;
  listeners.forEach((l) => l());
}
