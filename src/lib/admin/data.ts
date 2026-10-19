// ============================================================================
// Admin mock data — Prescriptr / Health Finder Pro
// Seed mirrors the Figma admin designs (Overview, Escalations, Doctors,
// Pharmacies & SOPs). Shares pharmacies/protocols with the doctor domain.
// ============================================================================

import { PHARMACIES } from "@/lib/doctor/data";
import type {
  AdminDoctor,
  AdminPharmacy,
  AttentionRow,
  OverviewKpi,
} from "./types";

// ---- Overview -------------------------------------------------------------

export const OVERVIEW_KPIS: OverviewKpi[] = [
  { label: "Pending prescriptions", value: "36", sub: "across 6 connected pharmacies" },
  { label: "Escalations", value: "5", sub: "awaiting senior review", danger: true },
  { label: "Active doctors", value: "6", sub: "3 onboarding" },
  { label: "Avg SOP compliance", value: "94%", sub: "target ≥ 90% per pharmacy" },
];

/**
 * What is left once escalations and late cases are read off the live board:
 * the things that are nobody's case in particular.
 */
export const ATTENTION_ROWS: AttentionRow[] = [
  { kind: "compliance", title: "CarePoint Online at 83% SOP compliance — below the 90% target", sub: "Review overrides and SOP parameters with the pharmacy", action: "View", href: "/admin/pharmacies" },
];



// ---- Doctors --------------------------------------------------------------

const eleanorCases: AdminDoctor["cases"] = [
  { ref: "PT-4471", med: "Mounjaro (tirzepatide)", dose: "7.5 mg", cat: "New Order", rag: "green", pharmacy: "MedExpress UK" },
  { ref: "PT-4463", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", cat: "New Order", rag: "green", pharmacy: "RightScript" },
  { ref: "PT-3120", med: "Wegovy (semaglutide)", dose: "1.0 mg", cat: "Simple Repeat", rag: "green", pharmacy: "Nuffield Chemist" },
  { ref: "PT-4458", med: "Mounjaro (tirzepatide)", dose: "7.5 mg", cat: "Complex Repeat", rag: "amber", pharmacy: "MedExpress UK" },
  { ref: "PT-4501", med: "Ozempic (semaglutide)", dose: "0.25 mg", cat: "New Order", rag: "green", pharmacy: "PharmaDirect" },
  { ref: "PT-4460", med: "Wegovy (semaglutide)", dose: "1.7 mg", cat: "Simple Repeat", rag: "green", pharmacy: "Willowbrook Pharmacy" },
  { ref: "PT-4482", med: "Wegovy (semaglutide)", dose: "2.4 mg", cat: "New Order", rag: "green", pharmacy: "CarePoint Online" },
  { ref: "PT-4495", med: "Ozempic (semaglutide)", dose: "0.5 mg", cat: "Complex Repeat", rag: "red", pharmacy: "MedExpress UK" },
];

export const ADMIN_DOCTORS: AdminDoctor[] = [
  { name: "Dr. Eleanor Hart", email: "e.hart@prescriptr.co.uk", initials: "EH", gmc: "7041182", pct: 99, granted: ["green", "amber", "red"], access: "all", status: "active", online: true, lastSeen: "now", cases: eleanorCases },
  {
    name: "Dr. Raymond Okafor", email: "r.okafor@prescriptr.co.uk", initials: "RO", gmc: "6893021", pct: 98, granted: ["green", "amber", "red"], access: "all", status: "active", online: true, lastSeen: "now",
    cases: [
      { ref: "PT-4470", med: "Wegovy (semaglutide)", dose: "0.25 mg", cat: "New Order", rag: "green", pharmacy: "MedExpress UK" },
      { ref: "PT-2051", med: "Mounjaro (tirzepatide)", dose: "5.0 mg", cat: "Complex Repeat", rag: "amber", pharmacy: "PharmaDirect" },
    ],
  },
  {
    name: "Dr. Sofia Patel", email: "s.patel@prescriptr.co.uk", initials: "SP", gmc: "7455610", pct: 97, granted: ["green", "amber"], access: "amber", status: "active", online: false, lastSeen: "12 min ago",
    cases: [
      { ref: "PT-4468", med: "Mounjaro (tirzepatide)", dose: "2.5 mg", cat: "New Order", rag: "amber", pharmacy: "PharmaDirect" },
      { ref: "PT-4461", med: "Wegovy (semaglutide)", dose: "0.25 mg", cat: "New Order", rag: "amber", pharmacy: "RightScript" },
    ],
  },
  {
    name: "Dr. Julia Reyes", email: "j.reyes@prescriptr.co.uk", initials: "JR", gmc: "7788123", pct: 86, granted: ["green", "amber"], access: "all", status: "active", online: true, lastSeen: "now",
    cases: [
      { ref: "PT-2071", med: "Wegovy (semaglutide)", dose: "2.4 mg", cat: "Complex Repeat", rag: "red", pharmacy: "MedExpress UK" },
      { ref: "PT-2059", med: "Mounjaro (tirzepatide)", dose: "10 mg", cat: "Complex Repeat", rag: "amber", pharmacy: "Willowbrook Pharmacy" },
    ],
  },
  {
    name: "Dr. Tomas Bowen", email: "t.bowen@prescriptr.co.uk", initials: "TB", gmc: "8012456", pct: 80, granted: ["green"], access: "green", status: "active", online: false, lastSeen: "1 h ago",
    cases: [
      { ref: "PT-3120", med: "Wegovy (semaglutide)", dose: "1.0 mg", cat: "Simple Repeat", rag: "green", pharmacy: "Willowbrook Pharmacy" },
      { ref: "PT-3122", med: "Ozempic (semaglutide)", dose: "0.5 mg", cat: "Simple Repeat", rag: "green", pharmacy: "PharmaDirect" },
    ],
  },
  { name: "Dr. Hannah Cole", email: "h.cole@prescriptr.co.uk", initials: "HC", gmc: "pending", pct: null, granted: ["green"], access: "green", status: "onboarding", online: false, lastSeen: "Never signed in", cases: [] },
];

/**
 * The signed-in admin — the same person as ADMIN_NAV.identity in lib/nav.tsx,
 * and a prescriber in her own right, so she can take a case off the board
 * herself rather than only route it to someone else.
 */
export const ADMIN_SELF = ADMIN_DOCTORS[0];


// ---- Pharmacies & SOPs ----------------------------------------------------

const ORDERS_TOTAL: Record<string, number> = {
  WB: 117, MX: 139, PD: 89, CP: 105, NC: 134, RS: 78,
};

export const ADMIN_PHARMACIES: AdminPharmacy[] = PHARMACIES.map((p) => ({
  code: p.code,
  name: p.name,
  region: `${p.region}, UK`,
  sopVersion: p.sopVersion,
  sopUpdated: p.sopUpdated,
  ordersTotal: ORDERS_TOTAL[p.code] ?? 100,
  compliance: p.compliance,
}));
