import { Suspense } from "react";
import { ProtocolsView } from "@/components/shared/ProtocolsView";

export default function ProtocolsPage() {
  return (
    <Suspense>
      <ProtocolsView />
    </Suspense>
  );
}
