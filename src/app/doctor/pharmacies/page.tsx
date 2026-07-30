import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProtocolIcon } from "@/components/ui/icons";
import { PHARMACIES } from "@/lib/doctor/data";
import { RAG_FILL, complianceRag } from "@/lib/doctor/rag";

export default function PharmaciesPage() {
  return (
    <>
      <PageHeader
        title="Pharmacies"
        subtitle="Six connected pharmacies on one platform"
      />

      <div className="px-6 py-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {PHARMACIES.map((p) => {
            const rag = complianceRag(p.compliance);
            return (
              <div key={p.code} className="flex flex-col rounded-lg bg-background-paper p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-lighter text-primary-dark">
                    <ProtocolIcon width={18} height={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-secondary">{p.region} · {p.postcode}</p>
                  </div>
                </div>

                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-success-dark">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Connected · SOP {p.sopVersion}
                </p>

                <div className="mt-4 flex items-end justify-between text-xs text-text-secondary">
                  <span className="font-bold uppercase tracking-wider">Orders today</span>
                  <span className="font-bold uppercase tracking-wider">SOP compliance</span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-mono text-2xl font-extrabold text-text-primary">{p.ordersToday}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-neutral">
                      <div className={`h-full rounded-full ${RAG_FILL[rag]}`} style={{ width: `${p.compliance}%` }} />
                    </div>
                    <span className="w-9 text-right font-mono text-sm font-bold text-text-primary">{p.compliance}%</span>
                  </div>
                </div>

                <Link
                  href={`/doctor/protocols?ph=${p.code}`}
                  className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-[var(--divider)] py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral"
                >
                  <ProtocolIcon width={16} height={16} />
                  View SOP
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
