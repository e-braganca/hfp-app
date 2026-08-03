// ============================================================================
// Patient onboarding — clinical constants (FC-02, weight-loss / GLP-1)
// Ported 1:1 from legacy App/assets/onboarding.js. UK eligibility rules.
// ============================================================================

export interface Option {
  key: string;
  label: string;
  desc?: string;
}

// Ethnicity — grouped like the ONS 2021 census / NHS ethnic category so the
// answer is comparable with national data, with two additions the census only
// captures as free text: Latin American (a large, otherwise invisible UK
// population under "other") and an explicit opt-out, since this is
// special-category data under Art. 9 GDPR.
export const ETHNIC_GROUPS: { group: string; options: Option[] }[] = [
  {
    group: "White",
    options: [
      { key: "white_british", label: "English, Welsh, Scottish, Northern Irish or British" },
      { key: "white_irish", label: "Irish" },
      { key: "white_traveller", label: "Gypsy, Irish Traveller or Roma" },
      { key: "white_other", label: "Any other White background" },
    ],
  },
  {
    group: "Mixed or multiple backgrounds",
    options: [
      { key: "mixed_white_asian", label: "White and Asian" },
      { key: "mixed_white_black_african", label: "White and Black African" },
      { key: "mixed_white_black_caribbean", label: "White and Black Caribbean" },
      { key: "mixed_other", label: "Any other mixed background" },
    ],
  },
  {
    group: "Asian or Asian British",
    options: [
      { key: "indian", label: "Indian" },
      { key: "pakistani", label: "Pakistani" },
      { key: "bangladeshi", label: "Bangladeshi" },
      { key: "sri_lankan", label: "Sri Lankan" },
      { key: "chinese", label: "Chinese" },
      { key: "other_asian", label: "Any other Asian background" },
    ],
  },
  {
    group: "Black, Black British or Caribbean",
    options: [
      { key: "black_african", label: "Black African" },
      { key: "black_caribbean", label: "Black Caribbean" },
      { key: "black_other", label: "Any other Black background" },
    ],
  },
  {
    group: "Other",
    options: [
      { key: "middle_eastern", label: "Middle Eastern or Arab" },
      { key: "latin_american", label: "Latin American" },
      { key: "other_ethnic", label: "Any other ethnic group" },
      { key: "prefer_not_say", label: "Prefer not to say" },
    ],
  },
];

export const ETHNICITIES: Option[] = ETHNIC_GROUPS.flatMap((g) => g.options);

// NICE (CG189 / NG246) lowers the BMI threshold by 2.5 for people with a South
// Asian, Chinese, other Asian, Middle Eastern, Black African or African-
// Caribbean *family background*. "Family background" is why the mixed options
// are here — someone of White and Black African heritage has that background.
// Erring inclusive is deliberate: a prescriber reviews every case that gets
// through, but nobody reviews the ones this gate turns away.
// Latin American is NOT in the NICE list, so it keeps the standard 30.
export const HIGHER_RISK_ETHNICITY = new Set([
  "indian",
  "pakistani",
  "bangladeshi",
  "sri_lankan",
  "chinese",
  "other_asian",
  "black_african",
  "black_caribbean",
  "black_other",
  "middle_eastern",
  "mixed_white_asian",
  "mixed_white_black_african",
  "mixed_white_black_caribbean",
]);

// Conditions — the first three are qualifying comorbidities (lower BMI floor to 27).
export const CONDITIONS: Option[] = [
  { key: "t2dm", label: "Type 2 diabetes" },
  { key: "hypertension", label: "High blood pressure" },
  { key: "osa", label: "Obstructive sleep apnoea" },
  { key: "cholesterol", label: "High cholesterol" },
  { key: "pcos", label: "PCOS" },
];

export const QUALIFYING_COMORBIDITY = new Set(["t2dm", "hypertension", "osa"]);

export const MEDS: Option[] = [
  { key: "glp1", label: "A GLP-1 medicine (Wegovy, Mounjaro, Ozempic, Saxenda)" },
  { key: "other", label: "Other prescription medication" },
  { key: "none", label: "None of these" },
];

// Safety screening — every one is a HARD block on "yes".
export const SAFETY_QUESTIONS: { key: string; q: string }[] = [
  { key: "thyroid", q: "You or a family member have had medullary thyroid cancer or MEN-2 syndrome" },
  { key: "pancreatitis", q: "You have ever had pancreatitis" },
  { key: "pregnancy", q: "You are pregnant, breastfeeding, or planning a pregnancy soon" },
  { key: "eating", q: "You have, or have had, an eating disorder" },
  { key: "type1", q: "You have type 1 diabetes" },
];

// Treatment preferences — UK-licensed weight-management GLP-1s only.
// Ozempic is deliberately absent: licensed for T2DM in the UK, not weight
// loss; the treatment step explains this to patients who arrive asking for it.
export interface TreatmentOption {
  key: string;
  name: string;
  generic: string;
  desc: string;
  priceMo: number | null; // null = decided after prescriber recommendation
  tag?: string;
}
export const TREATMENT_OPTIONS: TreatmentOption[] = [
  {
    key: "mounjaro",
    name: "Mounjaro",
    generic: "tirzepatide · weekly pen",
    desc: "Up to 22.5% body-weight loss in trials. Currently the most effective licensed option.",
    priceMo: 159,
    tag: "Most effective",
  },
  {
    key: "wegovy",
    name: "Wegovy",
    generic: "semaglutide · weekly pen",
    desc: "Up to 15% body-weight loss in trials. The most widely studied weight-loss GLP-1.",
    priceMo: 139,
  },
  {
    key: "prescriber",
    name: "Let my prescriber recommend",
    generic: "decided at clinical review",
    desc: "Your prescriber picks the licensed treatment that best fits your health profile — you confirm the price before anything is dispensed.",
    priceMo: null,
  },
];

// Phone country codes — UK first (the service's market), then the diaspora
// call-list most likely to show up in a UK clinic. Demo-sized on purpose.
export const PHONE_COUNTRIES: { dial: string; flag: string; label: string }[] = [
  { dial: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { dial: "+353", flag: "🇮🇪", label: "Ireland" },
  { dial: "+1", flag: "🇺🇸", label: "United States" },
  { dial: "+33", flag: "🇫🇷", label: "France" },
  { dial: "+34", flag: "🇪🇸", label: "Spain" },
  { dial: "+351", flag: "🇵🇹", label: "Portugal" },
  { dial: "+49", flag: "🇩🇪", label: "Germany" },
  { dial: "+55", flag: "🇧🇷", label: "Brazil" },
  { dial: "+91", flag: "🇮🇳", label: "India" },
  { dial: "+234", flag: "🇳🇬", label: "Nigeria" },
  { dial: "+92", flag: "🇵🇰", label: "Pakistan" },
  { dial: "+48", flag: "🇵🇱", label: "Poland" },
];

// Ordered step machine (15 steps). `eligible` is an interstitial after the
// gate; the account is created right after it — the eligibility result is the
// hook, and everything from verification on happens signed-in. Payment is
// last: authorised at order time, only charged after prescriber approval.
export const STEPS = [
  "intro",
  "sex",
  "dob",
  "measure",
  "ethnicity",
  "conditions",
  "meds",
  "safety",
  "eligible",
  "account",
  "address",
  "photo",
  "id",
  "treatment",
  "review",
  "payment",
] as const;

export type StepKey = (typeof STEPS)[number];

// Left-panel phases and which step indices they cover.
export const PHASES: { label: string; steps: number[] }[] = [
  { label: "About you", steps: [1, 2, 3, 4, 5, 6] },
  { label: "Safety & eligibility", steps: [7, 8] },
  { label: "Account & delivery", steps: [9, 10] },
  { label: "Verification", steps: [11, 12] },
  { label: "Treatment & payment", steps: [13, 14, 15] },
];
