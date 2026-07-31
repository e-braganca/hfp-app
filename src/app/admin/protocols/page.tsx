"use client";

// Legacy route — Protocols merged into Pharmacies & SOPs. Redirect keeps ?ph.
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function Redirector() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const ph = params.get("ph");
    router.replace(`/admin/pharmacies${ph ? `?ph=${ph}` : ""}`);
  }, [router, params]);
  return null;
}

export default function ProtocolsRedirect() {
  return (
    <Suspense>
      <Redirector />
    </Suspense>
  );
}
