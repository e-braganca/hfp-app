import { Suspense } from "react";
import { PharmaciesSopsView } from "@/components/shared/PharmaciesSopsView";

export default function AdminPharmaciesPage() {
  return (
    <Suspense>
      <PharmaciesSopsView editable />
    </Suspense>
  );
}
