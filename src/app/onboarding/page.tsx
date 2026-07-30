import type { Metadata } from "next";
import { OnboardingFunnel } from "@/components/onboarding/OnboardingFunnel";

export const metadata: Metadata = {
  title: "Weight-loss consultation — Prescriptr",
  description: "A few questions between you and clinical care.",
};

export default function OnboardingPage() {
  return <OnboardingFunnel />;
}
