import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return <AppShell role="doctor">{children}</AppShell>;
}
