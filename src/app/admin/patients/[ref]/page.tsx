import { notFound } from "next/navigation";
import { PatientDetail } from "@/components/admin/PatientDetail";
import { PATIENTS } from "@/lib/doctor/data";

export function generateStaticParams() {
  return PATIENTS.map((p) => ({ ref: p.ref }));
}

export default async function AdminPatientPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const patient = PATIENTS.find((p) => p.ref === ref);
  if (!patient) notFound();
  return <PatientDetail patient={patient} />;
}
