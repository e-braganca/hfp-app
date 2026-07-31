import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

export default function PharmacyLayout({ children }: { children: ReactNode }) {
  return <AppShell role="pharmacy">{children}</AppShell>;
}
