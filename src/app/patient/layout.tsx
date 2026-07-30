import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return <AppShell role="patient">{children}</AppShell>;
}
