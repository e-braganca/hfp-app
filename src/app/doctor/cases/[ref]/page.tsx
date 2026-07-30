import { notFound } from "next/navigation";
import { CaseReview } from "@/components/doctor/CaseReview";
import { COMPLEX_CASES, complexCaseByRef } from "@/lib/doctor/data";

export function generateStaticParams() {
  return COMPLEX_CASES.map((c) => ({ ref: c.ref }));
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const case_ = complexCaseByRef(ref);
  if (!case_) notFound();
  return <CaseReview case_={case_} />;
}
