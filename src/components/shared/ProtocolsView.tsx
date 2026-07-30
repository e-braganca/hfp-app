"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProtocolIcon } from "@/components/ui/icons";
import { PHARMACIES, protocolFor } from "@/lib/doctor/data";

export function ProtocolsView() {
  const params = useSearchParams();
  const initial = params.get("ph");
  const validInitial = PHARMACIES.some((p) => p.code === initial) ? initial! : PHARMACIES[0].code;
  const [selected, setSelected] = useState(validInitial);

  const pharmacy = PHARMACIES.find((p) => p.code === selected)!;
  const protocol = protocolFor(selected);

  return (
    <>
      <PageHeader
        title="Protocols (SOPs)"
        subtitle="Clinical rulebooks Health Finder Pro reads on every case"
      />

      <div className="px-6 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* pharmacy list */}
          <div className="rounded-lg bg-background-paper p-2 shadow-card">
            {PHARMACIES.map((p) => {
              const active = p.code === selected;
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setSelected(p.code)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    active ? "bg-primary-lighter" : "hover:bg-background-neutral"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      active ? "bg-primary text-white" : "bg-background-neutral text-text-secondary"
                    }`}
                  >
                    <ProtocolIcon width={16} height={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">{p.name}</span>
                    <span className="block font-mono text-xs text-text-secondary">SOP {p.sopVersion}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* SOP detail */}
          <div className="rounded-lg bg-background-paper p-6 shadow-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--divider)] pb-4">
              <h2 className="text-lg font-bold text-text-primary">{pharmacy.name}</h2>
              <p className="font-mono text-xs text-text-secondary">
                SOP {protocol.version} · Updated {protocol.updated} · {protocol.pages} pages
              </p>
            </div>

            <ol className="mt-2">
              {protocol.rules.map((r) => (
                <li key={r.n} className="flex gap-4 border-b border-[var(--divider)] py-4 last:border-0">
                  <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-primary-lighter font-mono text-xs font-bold text-primary-dark">
                    {r.n}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {r.title}
                      {r.flag && (
                        <span className="ml-2 rounded-full bg-warning-lighter px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-darker">
                          Flagged inline
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">{r.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark"
            >
              <ProtocolIcon width={16} height={16} />
              View complete document
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
