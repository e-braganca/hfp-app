// ============================================================================
// Measurement units (FC-02).
// The UK is mixed-measure: nearly everyone states height in feet and inches
// and weight in stones and pounds, while clinical records — and our BMI maths —
// are metric. So each field carries its own switch, the patient types in
// whatever they think in, and cm/kg stay the canonical stored values.
// 'lb' alone is offered for US-style patients and anyone who never uses stones.
// ============================================================================

export type HeightUnit = "cm" | "ftin";
export type WeightUnit = "kg" | "stlb" | "lb";

export const HEIGHT_UNITS: { key: HeightUnit; label: string }[] = [
  { key: "cm", label: "cm" },
  { key: "ftin", label: "ft/in" },
];

export const WEIGHT_UNITS: { key: WeightUnit; label: string }[] = [
  { key: "kg", label: "kg" },
  { key: "stlb", label: "st/lb" },
  { key: "lb", label: "lb" },
];

// Flip these to lead with metric.
export const DEFAULT_HEIGHT_UNIT: HeightUnit = "ftin";
export const DEFAULT_WEIGHT_UNIT: WeightUnit = "stlb";

const LB_PER_KG = 2.2046226218;

/** parseFloat that returns null instead of NaN for empty / junk input. */
export const numOf = (v: string): number | null => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/** One decimal place, as a string, without a trailing ".0". */
export const trim1 = (n: number): string => String(Math.round(n * 10) / 10);

export const cmToFtIn = (cm: number) => {
  const totalIn = Math.round(cm / 2.54);
  return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 };
};
export const ftInToCm = (ft: number | null, inch: number | null) =>
  ((ft ?? 0) * 12 + (inch ?? 0)) * 2.54;

export const kgToStLb = (kg: number) => {
  const totalLb = Math.round(kg * LB_PER_KG);
  return { st: Math.floor(totalLb / 14), lb: totalLb % 14 };
};
export const stLbToKg = (st: number | null, lb: number | null) =>
  ((st ?? 0) * 14 + (lb ?? 0)) / LB_PER_KG;

export const kgToLb = (kg: number) => Math.round(kg * LB_PER_KG);
export const lbToKg = (lb: number) => lb / LB_PER_KG;
