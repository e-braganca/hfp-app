import type { Metadata } from "next";
import { DashboardView } from "@/components/patient/DashboardView";

export const metadata: Metadata = { title: "Your dashboard — Prescriptr" };

export default function PatientDashboard() {
  // the view is a client component: both weekly check-ins are modals reading
  // the shared patient log
  return <DashboardView />;
}
