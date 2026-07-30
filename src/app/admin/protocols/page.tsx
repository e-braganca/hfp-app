import { Suspense } from "react";
import { ProtocolsView } from "@/components/shared/ProtocolsView";

export default function AdminProtocolsPage() {
  return (
    <Suspense>
      <ProtocolsView />
    </Suspense>
  );
}
