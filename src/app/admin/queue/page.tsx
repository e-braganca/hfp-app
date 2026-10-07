"use client";

import { useMemo, useState } from "react";
import { PresenceDot } from "@/components/admin/doctorBits";
import { QueueCaseDrawer } from "@/components/admin/QueueCaseDrawer";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useClaims } from "@/components/doctor/queueHooks";
import { PageHeader } from "@/components/ui/PageHeader";
import { RagPill } from "@/components/ui/StatusPill";
import { StatTile } from "@/components/ui/StatTile";
import { Toast } from "@/components/ui/Toast";
import { ADMIN_DOCTORS, ADMIN_SELF } from "@/lib/admin/data";
import { useWaitClock } from "@/components/shared/boardClockHooks";
import { WaitChip } from "@/components/shared/WaitFlag";
import { QueueFilters } from "@/components/admin/QueueFilters";
import { PAUSE_LABEL } from "@/lib/admin/queue-sla";
import { ACCESS_LABEL, type AdminDoctor, type QueueBand } from "@/lib/admin/types";
import { CATEGORY_LABEL, type QueueCategory } from "@/lib/doctor/clinicians";
import { liveCases, type LiveCase } from "@/lib/shared/live-cases";
import { claim, holdFor, release } from "@/lib/doctor/queue-claims";
import type { Rag } from "@/lib/doctor/types";

/* ============================================================================
   Current Queue — everything live, and who has it.

   Reads the same claim store the prescribers work from, so this is the real
   board rather than a report of it: assigning here takes the case off
   everyone else's list the moment it's done, and reassigning moves it between
   two people without either of them refreshing.

   Band is checked before an assignment goes through — handing a Red to a
   Green-only clinician is the mistake this page exists to prevent.

   The Running Late tab is the other half of the job. How long a case has been
   waiting is invisible on the prescriber side — their board looks identical at
   ten minutes and at two days — so the admin is the only person who can see
   one stalling, and the only one who can act: route it to someone with
   capacity, or take it and decide it personally.

   Assigning a case does not take it out of that tab. The patient is waiting
   until somebody decides, and a case sat on for a day by one prescriber has
   failed them as badly as one nobody picked up.
   ============================================================================ */

/** Category tabs plus the two that cut across them. */
type Tab = QueueCategory | "all" | "late";

const TABS: Tab[] = ["all", "new", "simple", "complex", "escalated", "late"];

const TAB_LABEL: Record<Tab, string> = {
  all: "Everything",
  ...CATEGORY_LABEL,
  late: "Running Late",
};

/** Can this clinician be handed this band right now? */
function canBeAssigned(d: AdminDoctor, rag: Rag): { ok: boolean; why?: string } {
  if (d.status === "suspended") return { ok: false, why: "suspended" };
  if (d.status === "onboarding") return { ok: false, why: "certification pending" };
  const band: QueueBand = rag === "green" ? "green" : rag === "red" ? "red" : "amber";
  if (!d.granted.includes(band)) return { ok: false, why: `not cleared for ${band}` };
  if (d.access !== "all" && d.access !== band) return { ok: false, why: `working ${d.access} only` };
  return { ok: true };
}

export default function AdminQueuePage() {
  const claims = useClaims();
  const [tab, setTab] = useState<Tab>("all");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [longestFirst, setLongestFirst] = useState(false);
  const [openCase, setOpenCase] = useState<LiveCase | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cases = useMemo(() => liveCases(), []);
  const clock = useWaitClock(cases);
  const now = clock.now;

  const flagged = cases.filter((c) => clock.flagFor(c.ref) !== "none");
  const lateCount = flagged.length;

  const inTab = (c: LiveCase, t: Tab) =>
    t === "all" ? true : t === "late" ? clock.flagFor(c.ref) !== "none" : c.category === t;

  const rows = cases
    .filter((c) => {
      if (!inTab(c, tab)) return false;
      if (onlyUnassigned && holdFor(claims, c.ref)) return false;
      return true;
    })
    // the late tab is always worst-first; elsewhere it's opt-in
    .sort((a, b) =>
      longestFirst || tab === "late" ? clock.hoursFor(b.ref) - clock.hoursFor(a.ref) : 0,
    );

  const counts = Object.fromEntries(
    TABS.map((t) => [t, cases.filter((c) => inTab(c, t)).length]),
  ) as Record<Tab, number>;

  const redCount = flagged.filter((c) => clock.flagFor(c.ref) === "red").length;
  const amberCount = flagged.length - redCount;

  const assigned = cases.filter((c) => holdFor(claims, c.ref)).length;
  const pausedCount = cases.filter((c) => clock.pausedReason(c.ref)).length;
  const workingNow = new Set(
    Object.values(claims).filter((h) => holdFor(claims, h.ref)).map((h) => h.by),
  ).size;

  const assign = (c: LiveCase, doctorName: string) => {
    if (!doctorName) return;
    const d = ADMIN_DOCTORS.find((x) => x.name === doctorName)!;
    const verdict = canBeAssigned(d, c.rag);
    if (!verdict.ok) {
      setToast(`Can't send ${c.ref} to ${d.name} — ${verdict.why}`);
      return;
    }
    claim(c.ref, d.name, d.initials);
    setToast(`${c.ref} sent to ${d.name} — it's off everyone else's board`);
  };

  /**
   * Take it = become the responsible clinician and open the case. It does not
   * stop the clock: the patient is still waiting until someone decides, so
   * the case stays flagged and stays in Running Late until it is resolved.
   */
  const takeIt = (c: LiveCase) => {
    const verdict = canBeAssigned(ADMIN_SELF, c.rag);
    if (!verdict.ok) {
      setToast(`Can't take ${c.ref} — ${verdict.why}`);
      return;
    }
    claim(c.ref, ADMIN_SELF.name, ADMIN_SELF.initials);
    setOpenCase(c);
  };

  const unassign = (c: LiveCase, by: string) => {
    release(c.ref, by);
    setToast(`${c.ref} returned to the shared board`);
  };

  const cols = "grid-cols-[104px_118px_1fr_0.85fr_132px_296px] [&>*]:min-w-0";

  return (
    <>
      <PageHeader title="Current queue" subtitle="Every live case and who is holding it, across the whole panel" />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile value={cases.length} label="Cases live now" />
          <StatTile value={assigned} label="Claimed by a clinician" tone="success" />
          <StatTile
            value={cases.length - assigned - pausedCount}
            label={pausedCount > 0 ? `Waiting on the board · ${pausedCount} on hold` : "Waiting on the board"}
            tone="warning"
          />
          <StatTile
            value={lateCount}
            label={`Flagged for waiting · ${redCount} red, ${amberCount} amber`}
            tone={redCount > 0 ? "error" : lateCount > 0 ? "warning" : "muted"}
          />
          <StatTile value={workingNow} label="Clinicians holding work" tone="muted" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1 border-b border-[var(--divider)]">
            {TABS.map((t) => {
              const on = tab === t;
              const alarming = t === "late" && redCount > 0;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`-mb-px flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-semibold transition-colors ${
                    on
                      ? alarming
                        ? "border-error text-text-primary"
                        : "border-primary text-text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {TAB_LABEL[t]}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      on ? "bg-primary-main-16 text-primary-dark" : "bg-grey-200 text-text-secondary"
                    }`}
                  >
                    {counts[t]}
                  </span>
                </button>
              );
            })}
          </div>
          <QueueFilters
            onlyUnassigned={onlyUnassigned}
            onOnlyUnassigned={setOnlyUnassigned}
            longestFirst={longestFirst}
            onLongestFirst={setLongestFirst}
            sortLocked={tab === "late"}
          />
        </div>

        <section className="rounded-lg bg-background-paper shadow-card">
          <div className="overflow-x-auto lg:overflow-x-visible">
            <div className="min-w-[1020px] lg:min-w-0">
              <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
                {["Ref", "Type", "Medication", "Detail", "Score", "Assigned to"].map((h) => (
                  <div key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                    {h}
                  </div>
                ))}
              </div>

              {rows.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-text-secondary">Nothing matches this filter.</p>
              )}

              {rows.map((c) => {
                const hold = holdFor(claims, c.ref);
                const flag = clock.flagFor(c.ref);
                const paused = clock.pausedReason(c.ref);
                const waited = clock.hoursFor(c.ref);
                return (
                  <div
                    key={`${c.category}-${c.ref}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenCase(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenCase(c);
                      }
                    }}
                    aria-label={`Open ${c.ref}`}
                    className={`grid ${cols} h-[84px] cursor-pointer items-start border-b border-[var(--divider)] transition-colors last:border-0 hover:bg-background-neutral focus:bg-background-neutral focus:outline-none`}
                  >
                    <div className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-text-primary">{c.ref}</p>
                      <p className="font-mono text-[10px] text-text-disabled">{c.nhs}</p>
                    </div>
                    <div className="px-4 py-3">
                      <span className="rounded-md bg-grey-200 px-2 py-0.5 text-xs font-semibold text-text-secondary">
                        {CATEGORY_LABEL[c.category]}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="truncate text-sm font-bold text-text-primary" title={c.med}>{c.med}</p>
                      <p className="truncate text-xs text-text-secondary">{c.dose}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="line-clamp-2 text-sm text-text-secondary" title={c.detail}>{c.detail}</p>
                    </div>
                    <div className="flex flex-col items-start gap-1.5 px-4 py-3">
                      <RagPill rag={c.rag} />
                      {!paused && <WaitChip hours={waited} flag={flag} />}
                    </div>

                    {/* Assignment lives with who holds it: the select already
                        renders the holder, so a separate identity block was
                        printing the same name twice. Clicks stop here — the
                        row behind them opens the case. */}
                    <div
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <div className="flex items-center gap-1.5">
                        <AssignSelect
                          value={hold?.by ?? ""}
                          rag={c.rag}
                          onPick={(name) => assign(c, name)}
                        />
                        {hold ? (
                          <button
                            type="button"
                            onClick={() => unassign(c, hold.by)}
                            aria-label={`Return ${c.ref} to the shared board`}
                            title="Return to the shared board"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--divider)] text-text-secondary hover:border-error hover:text-error"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                          </button>
                        ) : (
                          flag !== "none" && (
                            <button
                              type="button"
                              onClick={() => takeIt(c)}
                              title="Assign it to you and open it now"
                              className="h-9 shrink-0 whitespace-nowrap rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-primary-dark"
                            >
                              Take it
                            </button>
                          )
                        )}
                      </div>

                      {/* the wait sits with the score, so this line carries only
                          why a case is off the board at all */}
                      <div className="mt-1.5 flex h-6 items-center">
                        {paused && (
                          <span className="truncate text-[11px] text-text-secondary">{PAUSE_LABEL[paused]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="border-t border-[var(--divider)] px-4 py-3 text-xs text-text-secondary">
            Showing {rows.length} of {cases.length}. Clinicians who aren&rsquo;t cleared for a case&rsquo;s band are
            listed but can&rsquo;t be picked. The clock runs until the case is decided — claiming it doesn&rsquo;t stop it.
          </p>
        </section>
      </div>

      <QueueCaseDrawer
        caseRef={openCase?.ref ?? null}
        category={openCase?.category ?? "new"}
        rag={openCase?.rag ?? "green"}
        hold={openCase ? holdFor(claims, openCase.ref) : null}
        holder={
          openCase
            ? ADMIN_DOCTORS.find((d) => d.name === holdFor(claims, openCase.ref)?.by)
            : undefined
        }
        now={now}
        assignControl={
          openCase && (
            <AssignSelect
              value={holdFor(claims, openCase.ref)?.by ?? ""}
              rag={openCase.rag}
              onPick={(name) => assign(openCase, name)}
            />
          )
        }
        onUnassign={() => {
          const h = openCase ? holdFor(claims, openCase.ref) : null;
          if (openCase && h) unassign(openCase, h.by);
        }}
        onClose={() => setOpenCase(null)}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

/**
 * Send or move a case. Grouped by presence because a case handed to someone
 * offline sits there — and searchable because this list is six names today
 * and a hundred later. Ineligible clinicians stay listed with the reason, so
 * the admin sees who would need widening rather than an empty menu.
 */
function AssignSelect({
  value,
  rag,
  onPick,
}: {
  value: string;
  rag: Rag;
  onPick: (name: string) => void;
}) {
  const options: SelectOption[] = [...ADMIN_DOCTORS]
    .sort((a, b) => Number(b.online) - Number(a.online))
    .map((d) => {
      const v = canBeAssigned(d, rag);
      return {
        value: d.name,
        label: d.name,
        hint: v.ok ? `${ACCESS_LABEL[d.access]} · ${d.pct === null ? "onboarding" : `${d.pct}% SOP`}` : v.why,
        disabled: !v.ok,
        group: d.online ? "Online now" : "Offline",
        keywords: d.gmc,
        leading: (
          <span className="relative shrink-0">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-lighter text-[10px] font-bold text-primary-dark">
              {d.initials}
            </span>
            <PresenceDot online={d.online} className="absolute -bottom-0.5 -right-0.5 h-2 w-2" />
          </span>
        ),
      };
    });

  return (
    <Select
      value={value}
      options={options}
      placeholder={value ? "Move to…" : "Send to…"}
      searchable
      searchPlaceholder="Search clinicians…"
      align="right"
      buttonClassName="h-9 text-xs"
      onChange={onPick}
    />
  );
}
