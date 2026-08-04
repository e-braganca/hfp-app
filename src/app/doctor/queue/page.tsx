"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActingAsBar } from "@/components/doctor/ActingAsBar";
import { MetricCard } from "@/components/doctor/MetricCard";
import { ClaimCell, rowState, rowTone, type RowState } from "@/components/doctor/QueueRowState";
import { useActing, useClaims, useQueueClock } from "@/components/doctor/queueHooks";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PharmacyFilter } from "@/components/doctor/PharmacyFilter";
import { PharmacyLabel } from "@/components/ui/PharmacyLabel";
import { ScorePill } from "@/components/ui/StatusPill";
import { Toast } from "@/components/ui/Toast";
import { WarnIcon } from "@/components/ui/icons";
import { CATEGORY_LABEL, RAG_ORDER, canTake, type QueueCategory } from "@/lib/doctor/clinicians";
import { claim, claimMany, holdFor, release, reserve, seedIfEmpty } from "@/lib/doctor/queue-claims";
import {
  COMPLEX_CASES,
  ESCALATIONS,
  NEW_ORDERS,
  QUEUE_METRICS,
  SIMPLE_REPEATS,
} from "@/lib/doctor/data";
import type { Rag } from "@/lib/doctor/types";

/* ============================================================================
   One board, many prescribers.

   Every case on it is either free, reserved (someone has it open, 60 s to
   decide), claimed, or out of the reader's clearance. Nothing is hidden:
   unavailable rows stay visible but read as unavailable, so the queue depth
   is honest and a senior can see who is holding what.

   Two ways to pick up work — "Claim 5 cases" hands out a batch matched to the
   clearance, or open a single case, which reserves it while you look.
   ============================================================================ */

type Tab = QueueCategory | "mine";
const BULK_SIZE = 5;

/** Escalations carry no RAG of their own — they are senior work by definition. */
const ESCALATION_RAG: Rag = "red";

/** So a single browser still shows a board other people are working on. */
function seedBoard() {
  const t = Date.now();
  seedIfEmpty([
    { ref: "PT-4470", by: "Dr. Raymond Okafor", initials: "RO", kind: "claimed", at: t - 7 * 60000, expiresAt: null },
    { ref: "PT-3122", by: "Dr. Julia Reyes", initials: "JR", kind: "claimed", at: t - 21 * 60000, expiresAt: null },
    { ref: "PT-2095", by: "Dr. Sofia Patel", initials: "SP", kind: "reserved", at: t, expiresAt: t + 45000 },
  ]);
}

export default function WorkQueuePage() {
  const router = useRouter();
  const [me, setMe] = useActing();
  const claims = useClaims();
  const now = useQueueClock();

  useEffect(seedBoard, []);

  const [tab, setTab] = useState<Tab>("new");
  const [pharmacy, setPharmacy] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const mine = useMemo(
    () => Object.values(claims).filter((h) => h.by === me.name && holdFor(claims, h.ref)),
    [claims, me.name],
  );
  const holding = mine.length;

  const byPharmacy = <T extends { pharmacyCode: string }>(rows: T[]) =>
    pharmacy ? rows.filter((r) => r.pharmacyCode === pharmacy) : rows;

  const state = (ref: string, category: QueueCategory, rag: Rag): RowState =>
    rowState(holdFor(claims, ref), me, category, rag, now);

  /** Free, mine, and within clearance — what "available to me" means. */
  const isAvailable = (s: RowState) => s.kind !== "held" && s.kind !== "blocked";

  const takeOne = (ref: string, category: QueueCategory, rag: Rag) => {
    if (!canTake(me, category, rag)) return;
    if (holding >= me.claimLimit) {
      setToast(`You're holding ${me.claimLimit} cases — decide or release one first`);
      return;
    }
    if (!claim(ref, me.name, me.initials)) {
      setToast(`${ref} was just taken by another prescriber`);
      return;
    }
    setToast(`${ref} claimed — it's yours`);
  };

  const open = (ref: string, category: QueueCategory, rag: Rag, href: string) => {
    if (!canTake(me, category, rag)) return;
    // reserving before we navigate closes the window where two people could
    // both land on the same case
    if (!reserve(ref, me.name, me.initials)) {
      setToast(`${ref} is being reviewed by another prescriber`);
      return;
    }
    router.push(href);
  };

  /**
   * Bulk pull. Highest risk first rather than random: with everyone pulling
   * from the same board, random leaves the reds sitting while greens churn.
   */
  const bulkClaim = () => {
    const pool = [
      ...NEW_ORDERS.map((o) => ({ ref: o.ref, category: "new" as QueueCategory, rag: o.score.rag })),
      ...SIMPLE_REPEATS.map((r) => ({ ref: r.ref, category: "simple" as QueueCategory, rag: r.score.rag })),
      ...COMPLEX_CASES.map((c) => ({ ref: c.ref, category: "complex" as QueueCategory, rag: c.score.rag })),
      ...ESCALATIONS.map((e) => ({ ref: e.ref, category: "escalated" as QueueCategory, rag: ESCALATION_RAG })),
    ]
      .filter((i) => canTake(me, i.category, i.rag) && !holdFor(claims, i.ref))
      .sort((a, b) => RAG_ORDER[b.rag] - RAG_ORDER[a.rag]);

    const room = Math.max(0, me.claimLimit - holding);
    const batch = pool.slice(0, Math.min(BULK_SIZE, room));
    if (batch.length === 0) {
      setToast(room === 0 ? "You're at your holding limit" : "Nothing on the board matches your clearance");
      return;
    }
    const taken = claimMany(batch.map((b) => b.ref), me.name, me.initials);
    setToast(`${taken.length} ${taken.length === 1 ? "case" : "cases"} claimed and moved to Mine`);
    setTab("mine");
  };

  const drop = (ref: string) => {
    release(ref, me.name);
    setToast(`${ref} released back to the queue`);
  };

  const counts: Record<Tab, number> = {
    new: NEW_ORDERS.length,
    simple: SIMPLE_REPEATS.length,
    complex: COMPLEX_CASES.length,
    escalated: ESCALATIONS.length,
    mine: holding,
  };

  const shared = { state, now, onlyMine, isAvailable, takeOne, open, drop };

  return (
    <>
      <PageHeader
        title="Work Queue"
        subtitle="One shared board — claim a case to take it off everyone else's list"
      />

      <div className="px-6 py-6 lg:px-8">
        <ActingAsBar me={me} onChange={setMe} holding={holding} />

        <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {QUEUE_METRICS.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>

        {/* bulk pull */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary-lighter/50 px-5 py-4 ring-1 ring-primary-light/40">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">Pick up work in one go</p>
            <p className="text-sm text-text-secondary">
              You&rsquo;ll be handed up to {BULK_SIZE} cases matched to your clearance, highest risk first. They move to
              <span className="font-semibold text-text-primary"> Mine</span> and leave everyone else&rsquo;s board.
            </p>
          </div>
          <button
            type="button"
            onClick={bulkClaim}
            className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Claim {BULK_SIZE} cases
          </button>
        </div>

        {/* tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1 border-b border-[var(--divider)]">
            {(["new", "simple", "complex", "escalated", "mine"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "border-primary text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {t === "mine" ? "Mine" : CATEGORY_LABEL[t]}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    tab === t ? "bg-primary-main-16 text-primary-dark" : "bg-grey-200 text-text-secondary"
                  }`}
                >
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {tab !== "mine" && (
              <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                <input
                  type="checkbox"
                  checked={onlyMine}
                  onChange={(e) => setOnlyMine(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--divider)] accent-[var(--primary)]"
                />
                Available to me
              </label>
            )}
            <PharmacyFilter value={pharmacy} onChange={setPharmacy} />
          </div>
        </div>

        <div className="mt-5">
          {tab === "new" && <NewOrdersTab rows={byPharmacy(NEW_ORDERS)} {...shared} />}
          {tab === "simple" && <SimpleRepeatsTab rows={byPharmacy(SIMPLE_REPEATS)} {...shared} />}
          {tab === "complex" && <ComplexRepeatsTab rows={byPharmacy(COMPLEX_CASES)} {...shared} />}
          {tab === "escalated" && <EscalatedTab rows={byPharmacy(ESCALATIONS)} {...shared} />}
          {tab === "mine" && <MineTab refs={mine.map((h) => h.ref)} {...shared} />}
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

// ---- shared plumbing ------------------------------------------------------

interface Shared {
  state: (ref: string, category: QueueCategory, rag: Rag) => RowState;
  now: number;
  onlyMine: boolean;
  isAvailable: (s: RowState) => boolean;
  takeOne: (ref: string, category: QueueCategory, rag: Rag) => void;
  open: (ref: string, category: QueueCategory, rag: Rag, href: string) => void;
  drop: (ref: string) => void;
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg bg-background-paper shadow-card">
      {/* scrolls at its natural width below lg; fits the viewport from lg up */}
      <div className="overflow-x-auto lg:overflow-x-visible">
        <div className="min-w-[900px] lg:min-w-0">{children}</div>
      </div>
    </div>
  );
}

function HeadCell({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary ${className}`}>
      {children}
    </div>
  );
}

function PatientCell({ ref_, nhs }: { ref_: string; nhs: string }) {
  return (
    <div className="px-4 py-4">
      <div className="text-sm font-bold text-text-primary">{ref_}</div>
      <div className="font-mono text-xs text-text-secondary">{nhs}</div>
    </div>
  );
}

function MedCell({ med, dose }: { med: string; dose: string }) {
  return (
    <div className="px-4 py-4">
      <div className="truncate text-sm font-bold text-text-primary" title={med}>{med}</div>
      <div className="truncate text-xs text-text-secondary">{dose}</div>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-text-secondary">{children}</p>;
}

// ---- New Orders -----------------------------------------------------------

function NewOrdersTab({ rows, ...s }: { rows: typeof NEW_ORDERS } & Shared) {
  const cols = "grid-cols-[1.1fr_1.3fr_1.5fr_1.4fr_auto_170px] [&>*]:min-w-0";
  const visible = rows.filter((o) => !s.onlyMine || s.isAvailable(s.state(o.ref, "new", o.score.rag)));
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Eligibility</HeadCell>
        <HeadCell>Auto-Score</HeadCell>
        <HeadCell>Status</HeadCell>
      </div>
      {visible.length === 0 && <EmptyRow>Nothing here matches your clearance right now.</EmptyRow>}
      {visible.map((o) => {
        const st = s.state(o.ref, "new", o.score.rag);
        const href = `/doctor/orders/${o.ref}`;
        return (
          <div key={o.ref} className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 ${rowTone(st)}`}>
            <PatientCell ref_={o.ref} nhs={o.nhs} />
            <div className="px-4 py-4"><PharmacyLabel code={o.pharmacyCode} /></div>
            <MedCell med={o.med} dose={o.dose} />
            <div className="px-4 py-4 text-sm text-text-secondary">{o.eligibility}</div>
            <div className="px-4 py-4"><ScorePill score={o.score} /></div>
            <div className="px-4 py-4">
              <ClaimCell
                state={st}
                now={s.now}
                onClaim={() => s.takeOne(o.ref, "new", o.score.rag)}
                onOpen={() => s.open(o.ref, "new", o.score.rag, href)}
                onRelease={() => s.drop(o.ref)}
              />
            </div>
          </div>
        );
      })}
    </TableCard>
  );
}

// ---- Simple Repeats (batch) ----------------------------------------------

function SimpleRepeatsTab({ rows, ...s }: { rows: typeof SIMPLE_REPEATS } & Shared) {
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState(0);

  const cols = "grid-cols-[1.1fr_1.3fr_1.5fr_1.1fr_auto_170px] [&>*]:min-w-0";
  const visible = rows.filter((r) => !s.onlyMine || s.isAvailable(s.state(r.ref, "simple", r.score.rag)));
  const mineHere = rows.filter((r) => s.state(r.ref, "simple", r.score.rag).kind === "mine");

  if (done > 0) {
    return (
      <div className="rounded-lg bg-background-paper p-12 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-lighter text-success-dark">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-text-primary">{done} simple repeats approved &amp; signed</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
          Each approval was scored Green against its pharmacy SOP and individually recorded to the audit trail
          (Rule 1.1 + 2.2).
        </p>
        <button
          type="button"
          onClick={() => setDone(0)}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
        >
          Back to Simple Repeats
        </button>
      </div>
    );
  }

  return (
    <>
      {mineHere.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-success-lighter/60 px-5 py-4 ring-1 ring-success-light/40">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">Batch approval — your Green simple repeats</p>
              <p className="text-xs text-text-secondary">
                Only cases you have claimed can be batch-signed. {mineHere.length} held.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReviewing(true)}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Review &amp; sign {mineHere.length}
          </button>
        </div>
      )}

      <TableCard>
        <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
          <HeadCell>Patient</HeadCell>
          <HeadCell>Pharmacy</HeadCell>
          <HeadCell>Medication / Dose</HeadCell>
          <HeadCell>Last Review</HeadCell>
          <HeadCell>Auto-Score</HeadCell>
          <HeadCell>Status</HeadCell>
        </div>
        {visible.length === 0 && <EmptyRow>Nothing here matches your clearance right now.</EmptyRow>}
        {visible.map((r) => {
          const st = s.state(r.ref, "simple", r.score.rag);
          return (
            <div key={r.ref} className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 ${rowTone(st)}`}>
              <PatientCell ref_={r.ref} nhs={r.nhs} />
              <div className="px-4 py-4"><PharmacyLabel code={r.pharmacyCode} /></div>
              <MedCell med={r.med} dose={r.dose} />
              <div className="truncate px-4 py-4 text-sm text-text-secondary">{r.lastReview}</div>
              <div className="px-4 py-4"><ScorePill score={r.score} /></div>
              <div className="px-4 py-4">
                <ClaimCell
                  state={st}
                  now={s.now}
                  onClaim={() => s.takeOne(r.ref, "simple", r.score.rag)}
                  onRelease={() => s.drop(r.ref)}
                />
              </div>
            </div>
          );
        })}
      </TableCard>

      <Modal
        open={reviewing}
        title="Review & sign batch"
        subtitle={`${mineHere.length} Green simple repeats you hold`}
        onClose={() => setReviewing(false)}
      >
        <p className="text-sm text-text-secondary">
          All {mineHere.length} repeats scored Green against their pharmacy SOP (Rule 1.1 eligibility + Rule 2.2
          titration). Each approval is individually audit-logged.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setReviewing(false)}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const n = mineHere.length;
              mineHere.forEach((r) => s.drop(r.ref));
              setReviewing(false);
              setDone(n);
            }}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Sign {mineHere.length} prescriptions
          </button>
        </div>
      </Modal>
    </>
  );
}

// ---- Complex Repeats ------------------------------------------------------

function ComplexRepeatsTab({ rows, ...s }: { rows: typeof COMPLEX_CASES } & Shared) {
  const cols = "grid-cols-[1.1fr_1.3fr_1.5fr_1.4fr_auto_170px] [&>*]:min-w-0";
  const visible = rows.filter((c) => !s.onlyMine || s.isAvailable(s.state(c.ref, "complex", c.score.rag)));
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Flag Reason</HeadCell>
        <HeadCell>Auto-Score</HeadCell>
        <HeadCell>Status</HeadCell>
      </div>
      {visible.length === 0 && <EmptyRow>Nothing here matches your clearance right now.</EmptyRow>}
      {visible.map((c) => {
        const st = s.state(c.ref, "complex", c.score.rag);
        const href = `/doctor/cases/${c.ref}`;
        return (
          <div key={c.ref} className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 ${rowTone(st)}`}>
            <PatientCell ref_={c.ref} nhs={c.nhs} />
            <div className="px-4 py-4"><PharmacyLabel code={c.pharmacyCode} /></div>
            <MedCell med={c.med} dose={c.dose} />
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-text-primary">
              <WarnIcon width={18} height={18} className="shrink-0 text-warning" />
              {c.flagReason}
            </div>
            <div className="px-4 py-4"><ScorePill score={c.score} /></div>
            <div className="px-4 py-4">
              <ClaimCell
                state={st}
                now={s.now}
                onClaim={() => s.takeOne(c.ref, "complex", c.score.rag)}
                onOpen={() => s.open(c.ref, "complex", c.score.rag, href)}
                onRelease={() => s.drop(c.ref)}
              />
            </div>
          </div>
        );
      })}
    </TableCard>
  );
}

// ---- Escalated ------------------------------------------------------------

function EscalatedTab({ rows, ...s }: { rows: typeof ESCALATIONS } & Shared) {
  const cols = "grid-cols-[1.1fr_1.3fr_1.5fr_1.4fr_auto_170px] [&>*]:min-w-0";
  const visible = rows.filter((e) => !s.onlyMine || s.isAvailable(s.state(e.ref, "escalated", ESCALATION_RAG)));
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Escalation Reason</HeadCell>
        <HeadCell>Status</HeadCell>
        <HeadCell>Claim</HeadCell>
      </div>
      {visible.length === 0 && <EmptyRow>Nothing here matches your clearance right now.</EmptyRow>}
      {visible.map((e, i) => {
        const st = s.state(e.ref, "escalated", ESCALATION_RAG);
        return (
          <div key={`${e.ref}-${i}`} className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 ${rowTone(st)}`}>
            <PatientCell ref_={e.ref} nhs={e.nhs} />
            <div className="px-4 py-4"><PharmacyLabel code={e.pharmacyCode} /></div>
            <MedCell med={e.med} dose={e.dose} />
            <div className="px-4 py-4 text-sm text-text-secondary">{e.reason}</div>
            <div className="px-4 py-4"><span className="text-sm font-bold text-warning-dark">{e.status}</span></div>
            <div className="px-4 py-4">
              <ClaimCell
                state={st}
                now={s.now}
                onClaim={() => s.takeOne(e.ref, "escalated", ESCALATION_RAG)}
                onRelease={() => s.drop(e.ref)}
              />
            </div>
          </div>
        );
      })}
    </TableCard>
  );
}

// ---- Mine -----------------------------------------------------------------

/** Everything this prescriber is holding, whatever category it came from. */
function MineTab({ refs, ...s }: { refs: string[] } & Shared) {
  const cols = "grid-cols-[1.1fr_1fr_1.5fr_1.3fr_auto_170px] [&>*]:min-w-0";

  const items = refs
    .map((ref) => {
      const o = NEW_ORDERS.find((x) => x.ref === ref);
      if (o) return { ref, category: "new" as QueueCategory, rag: o.score.rag, nhs: o.nhs, med: o.med, dose: o.dose, pharmacyCode: o.pharmacyCode, detail: o.eligibility, href: `/doctor/orders/${ref}` };
      const r = SIMPLE_REPEATS.find((x) => x.ref === ref);
      if (r) return { ref, category: "simple" as QueueCategory, rag: r.score.rag, nhs: r.nhs, med: r.med, dose: r.dose, pharmacyCode: r.pharmacyCode, detail: `Last review ${r.lastReview}`, href: undefined };
      const c = COMPLEX_CASES.find((x) => x.ref === ref);
      if (c) return { ref, category: "complex" as QueueCategory, rag: c.score.rag, nhs: c.nhs, med: c.med, dose: c.dose, pharmacyCode: c.pharmacyCode, detail: c.flagReason, href: `/doctor/cases/${ref}` };
      const e = ESCALATIONS.find((x) => x.ref === ref);
      if (e) return { ref, category: "escalated" as QueueCategory, rag: ESCALATION_RAG, nhs: e.nhs, med: e.med, dose: e.dose, pharmacyCode: e.pharmacyCode, detail: e.reason, href: undefined };
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--divider)] px-4 py-12 text-center">
        <p className="text-sm font-semibold text-text-primary">You&rsquo;re not holding any cases</p>
        <p className="mt-1 text-sm text-text-secondary">
          Use <span className="font-semibold">Claim {BULK_SIZE} cases</span> above, or claim one from a tab.
        </p>
      </div>
    );
  }

  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Type</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Detail</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Status</HeadCell>
      </div>
      {items.map((it) => {
        const st = s.state(it.ref, it.category, it.rag);
        return (
          <div key={it.ref} className={`grid ${cols} items-center border-b border-[var(--divider)] last:border-0 ${rowTone(st)}`}>
            <PatientCell ref_={it.ref} nhs={it.nhs} />
            <div className="px-4 py-4">
              <span className="rounded-md bg-grey-200 px-2 py-0.5 text-xs font-semibold text-text-secondary">
                {CATEGORY_LABEL[it.category]}
              </span>
            </div>
            <MedCell med={it.med} dose={it.dose} />
            <div className="truncate px-4 py-4 text-sm text-text-secondary" title={it.detail}>{it.detail}</div>
            <div className="px-4 py-4"><PharmacyLabel code={it.pharmacyCode} /></div>
            <div className="px-4 py-4">
              <ClaimCell
                state={st}
                now={s.now}
                onClaim={() => s.takeOne(it.ref, it.category, it.rag)}
                onOpen={it.href ? () => s.open(it.ref, it.category, it.rag, it.href!) : undefined}
                onRelease={() => s.drop(it.ref)}
              />
            </div>
          </div>
        );
      })}
    </TableCard>
  );
}
