import { Suspense } from "react";
import { PharmaciesSopsView } from "@/components/shared/PharmaciesSopsView";

export default function DoctorPharmaciesPage() {
  return (
    <Suspense>
      <PharmaciesSopsView />
    </Suspense>
  );
}
