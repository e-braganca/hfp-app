// ============================================================================
// Navigation config — drives the shared AppSidebar / AppMobileNav for every
// role (doctor, admin; pharmacy & patient later). One place to add a role or
// move an item. See src/components/shell/.
// ============================================================================

import type { ComponentType, SVGProps } from "react";
import {
  BellIcon,
  ComplianceIcon,
  HomeIcon,
  PatientsIcon,
  PharmacyIcon,
  ProtocolIcon,
  QueueIcon,
  StethoscopeIcon,
  WarnIcon,
} from "@/components/ui/icons";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
  /** short label for the mobile bottom bar (defaults to label) */
  short?: string;
  /** static badge text, or "escalations" etc. — kept simple as a string */
  badge?: string;
  /** extra path prefixes that keep this item active */
  match?: string[];
  /** active on exact path only (for hub items whose href prefixes siblings) */
  exact?: boolean;
  /** hide from the mobile bottom bar */
  hideOnMobile?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface TherapyArea {
  label: string;
  live?: boolean;
}

export interface NavConfig {
  /** brand wordmark (kept as PRESCRIPTR across roles) */
  brand: string;
  groups: NavGroup[];
  /** doctor-only display list; omitted for other roles */
  therapyAreas?: TherapyArea[];
  notificationsBadge?: string;
  identity: {
    name: string;
    role: string;
    initials: string;
    signOutHref: string;
  };
}

// ---- Doctor ---------------------------------------------------------------

export const DOCTOR_NAV: NavConfig = {
  brand: "PRESCRIPTR",
  groups: [
    {
      label: "Clinical",
      items: [
        { label: "Work Queue", href: "/doctor/queue", icon: QueueIcon, match: ["/doctor/orders", "/doctor/cases"] },
        { label: "Past requests", short: "History", href: "/doctor/requests", icon: ProtocolIcon },
        { label: "Pharmacies & SOPs", short: "Pharmacies", href: "/doctor/pharmacies", icon: PharmacyIcon, match: ["/doctor/protocols"] },
      ],
    },
    {
      label: "Governance",
      items: [{ label: "Compliance", href: "/doctor/compliance", icon: ComplianceIcon }],
    },
  ],
  therapyAreas: [
    { label: "Weight loss (GLP-1)", live: true },
    { label: "ED" },
    { label: "Hair loss" },
    { label: "Oral contraceptives" },
    { label: "Menopause (HRT)" },
    { label: "Thyroid" },
    { label: "Testosterone" },
    { label: "Cannabis" },
  ],
  notificationsBadge: "5",
  identity: {
    name: "Dr. Eleanor Hart",
    role: "Clinical Lead · GMC 7041182",
    initials: "EH",
    signOutHref: "/login",
  },
};

// ---- Admin ----------------------------------------------------------------

export const ADMIN_NAV: NavConfig = {
  brand: "PRESCRIPTR",
  groups: [
    {
      label: "Oversight",
      items: [
        { label: "Overview", href: "/admin/overview", icon: HomeIcon },
        { label: "Current queue", short: "Queue", href: "/admin/queue", icon: QueueIcon },
        { label: "Escalations", href: "/admin/escalations", icon: WarnIcon, badge: "5" },
        { label: "Past requests", short: "History", href: "/admin/requests", icon: ProtocolIcon },
        { label: "Patients", href: "/admin/patients", icon: PatientsIcon },
        { label: "Doctors", href: "/admin/doctors", icon: StethoscopeIcon },
        { label: "Pharmacies & SOPs", short: "Pharmacies", href: "/admin/pharmacies", icon: PharmacyIcon, badge: "6", match: ["/admin/protocols"] },
      ],
    },
    {
      label: "Governance",
      items: [{ label: "Compliance", href: "/admin/compliance", icon: ComplianceIcon }],
    },
  ],
  notificationsBadge: "5",
  identity: {
    name: "Dr. Eleanor Hart",
    role: "Admin",
    initials: "EH",
    signOutHref: "/login",
  },
};

// ---- Patient ----------------------------------------------------------------
// Patient platform (FC-13…18): dashboard, treatment, deliveries (+ re-order
// wizard), weight tracking.

export const PATIENT_NAV: NavConfig = {
  brand: "PRESCRIPTR",
  groups: [
    {
      label: "My care",
      items: [
        { label: "Dashboard", href: "/patient", icon: HomeIcon, exact: true },
        { label: "My treatment", href: "/patient/treatment", icon: ProtocolIcon },
        { label: "Deliveries", href: "/patient/deliveries", icon: PharmacyIcon },
        { label: "Weight tracking", short: "Weight", href: "/patient/weight", icon: ComplianceIcon },
      ],
    },
  ],
  identity: {
    name: "Alex Morgan",
    role: "Patient · Weight-loss programme",
    initials: "AM",
    signOutHref: "/login",
  },
};

// ---- Pharmacy (partner portal) ---------------------------------------------

export const PHARMACY_NAV: NavConfig = {
  brand: "PRESCRIPTR",
  groups: [
    {
      label: "Partner portal",
      items: [
        { label: "Dashboard", href: "/pharmacy", icon: HomeIcon, exact: true },
        { label: "Orders", href: "/pharmacy#orders", icon: QueueIcon },
        { label: "Your SOP", short: "SOP", href: "/pharmacy#sop", icon: ProtocolIcon },
      ],
    },
  ],
  identity: {
    name: "Willowbrook Pharmacy",
    role: "Partner · GPhC 9010311",
    initials: "WP",
    signOutHref: "/login",
  },
};

export type Role = "doctor" | "admin" | "patient" | "pharmacy";

export const NAV_BY_ROLE: Record<Role, NavConfig> = {
  doctor: DOCTOR_NAV,
  admin: ADMIN_NAV,
  patient: PATIENT_NAV,
  pharmacy: PHARMACY_NAV,
};

export { BellIcon };
