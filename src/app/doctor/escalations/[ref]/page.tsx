import { notFound } from "next/navigation";
import { EscalationView } from "@/components/doctor/EscalationView";
import { ESCALATIONS, escalationByRef } from "@/lib/doctor/data";

export function generateStaticParams() {
  return ESCALATIONS.map((e) => ({ ref: e.ref }));
}

export default async function EscalationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const escalation = escalationByRef(ref);
  if (!escalation) notFound();
  return <EscalationView escalation={escalation} />;
}
