"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MetricCard } from "@/components/doctor/MetricCard";
import { ClaimCell, rowState, rowTone, type RowState } from "@/components/doctor/QueueRowState";
import { useActing, useClaims, useFlashToast, useQueueClock } from "@/components/doctor/queueHooks";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PharmacyFilter } from "@/components/doctor/PharmacyFilter";
import { PharmacyLabel } from "@/components/ui/PharmacyLabel";
import { RagPill, ScorePill } from "@/components/ui/StatusPill";
import { useWaitClock } from "@/components/shared/boardClockHooks";
import { WaitChip } from "@/components/shared/WaitFlag";
import { TabStrip } from "@/components/ui/TabStrip";
import { clearSkipped } from "@/lib/doctor/case-order";
import type { WaitFlag } from "@/lib/admin/queue-sla";
import { ESCALATION_RAG, liveCases } from "@/lib/shared/live-cases";
import { Toast } from "@/components/ui/Toast";
import { WarnIcon } from "@/components/ui/icons";
import { CATEGORY_LABEL, RAG_ORDER, canTake, type QueueCategory } from "@/lib/doctor/clinicians";
import { claim, claimMany, holdFor, release, reserve, seedIfEmpty } from "@/lib/doctor/queue-claims";
import {
  askedAgo,
  awaitingRefs,
  isAwaitingPatient,
  getInfoRequestsServerSnapshot,
  getInfoRequestsSnapshot,
  subscribeInfoRequests,
  type InfoRequest,
} from "@/lib/doctor/info-requests";
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

type Tab = QueueCategory | "mine" | "info";

/**
 * Two groups, because these are two different questions. On the left, "what
 * kind of work is there?" — the queues a clinician picks from. On the right,
 * the cases that are already somebody's or nobody's to do: escalated away,
 * held by me, or parked on a patient who owes us an answer.
 */
const LEFT_TABS: Tab[] = ["new", "simple", "complex"];
const RIGHT_TABS: Tab[] = ["escalated", "mine", "info"];

const TAB_LABEL: Record<Tab, string> = {
  ...CATEGORY_LABEL,
  mine: "Mine",
  info: "Awaiting info",
};
const BULK_SIZE = 5;

/** Escalations carry no RAG of their own — they are senior work by definition. */
/** Tabs where nothing is claimable, so "only mine" has nothing to filter. */
const NO_CLAIM_TABS = new Set<Tab>(["mine", "info", "escalated"]);

/** So a single browser still shows a board other people are working on. */
function seedBoard() {
  const t = Date.now();
  seedIfEmpty([
    { ref: "PT-4470", by: "Dr. Raymond Okafor", initials: "RO", kind: "claimed", at: t - 7 * 60000, expiresAt: null },
    { ref: "PT-3122", by: "Dr. Julia Reyes", initials: "JR", kind: "claimed", at: t - 21 * 60000, expiresAt: null },
    // deliberately a new order, not a complex repeat: only two complex cases
    // are not escalations, and holding one of those leaves the tab empty
    { ref: "PT-4464", by: "Dr. Sofia Patel", initials: "SP", kind: "reserved", at: t, expiresAt: t + 45000 },
  ]);
}

export default function WorkQueuePage() {
  const router = useRouter();
  const [me] = useActing();
  const claims = useClaims();
  const now = useQueueClock();
  const infoRequests = useSyncExternalStore(
    subscribeInfoRequests,
    getInfoRequestsSnapshot,
    getInfoRequestsServerSnapshot,
  );

  useEffect(seedBoard, []);
  // Back on the list, the run of skips is over: the order of cases passed over
  // describes one sitting at the board, not the cases themselves.
  useEffect(clearSkipped, []);

  const [tab, setTab] = useState<Tab>("new");
  const [pharmacy, setPharmacy] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [toast, setToast] = useFlashToast();

  const clock = useWaitClock(useMemo(() => liveCases(), []));

  const mine = useMemo(
    () => Object.values(claims).filter((h) => h.by === me.name && holdFor(claims, h.ref)),
    [claims, me.name],
  );
  const holding = mine.length;

  const byPharmacy = <T extends { pharmacyCode: string }>(rows: T[]) =>
    pharmacy ? rows.filter((r) => r.pharmacyCode === pharmacy) : rows;

  /**
   * The category tabs are the shared board: what is free for anyone to take.
   *
   * Two things leave it. A case parked on the patient, because it is not work
   * anyone can do — and listing it in both New Orders and Awaiting info lets
   * two clinicians each believe the other tab is someone else's problem. And a
   * case somebody is holding, which is the whole promise of claiming: it comes
   * off everyone else's list. Mine included, since that is what the Mine tab
   * is for, and a case in two places is a case two people think is covered.
   */
  const awaiting = awaitingRefs(infoRequests);
  const onTheBoard = <T extends { ref: string }>(rows: T[]) =>
    rows.filter((r) => !awaiting.has(r.ref) && !holdFor(claims, r.ref));

  /**
   * Three of the complex repeats are also escalations. A case has one live
   * state and it is the later one — with a senior, not on the complex board —
   * so Complex Repeats drops them. They were showing in both tabs, which is
   * the same two-people-each-assuming thing the other rules are there to stop.
   */
  const escalatedRefs = new Set(ESCALATIONS.map((e) => e.ref));
  const complexOnly = COMPLEX_CASES.filter((c) => !escalatedRefs.has(c.ref));

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

  /** Open without taking: escalations and parked cases are nobody's to claim. */
  const view = (href: string) => router.push(href);

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
      ...complexOnly.map((c) => ({ ref: c.ref, category: "complex" as QueueCategory, rag: c.score.rag })),
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
    new: onTheBoard(NEW_ORDERS).length,
    simple: onTheBoard(SIMPLE_REPEATS).length,
    complex: onTheBoard(complexOnly).length,
    escalated: onTheBoard(ESCALATIONS).length,
    mine: holding,
    info: awaiting.size,
  };

  /**
   * The same clock the admin flags against, beside the score the prescriber
   * is choosing on. Working top-down is then working the list the panel is
   * actually held to, rather than the order the arrays happen to be in.
   */
  const waitFor = (ref: string) => ({ hours: clock.hoursFor(ref), flag: clock.flagFor(ref) });

  const shared = { state, now, onlyMine, isAvailable, takeOne, open, view, drop, waitFor };

  return (
    <>
      <PageHeader
        title="Work Queue"
        subtitle="One shared board — claim a case to take it off everyone else's list"
      />

      <div className="px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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

        {/* tabs — queues to pick from on the left, everything already spoken
            for on the right */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <TabStrip tabs={LEFT_TABS} active={tab} label={(t) => TAB_LABEL[t]} count={(t) => counts[t]} onPick={setTab} />
          <div className="flex flex-wrap items-end gap-4">
            <TabStrip tabs={RIGHT_TABS} active={tab} label={(t) => TAB_LABEL[t]} count={(t) => counts[t]} onPick={setTab} />
            <div className="pb-2">
              <PharmacyFilter
                value={pharmacy}
                onChange={setPharmacy}
                onlyMine={NO_CLAIM_TABS.has(tab) ? undefined : onlyMine}
                onOnlyMine={NO_CLAIM_TABS.has(tab) ? undefined : setOnlyMine}
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          {tab === "new" && <NewOrdersTab rows={byPharmacy(onTheBoard(NEW_ORDERS))} {...shared} />}
          {tab === "simple" && <SimpleRepeatsTab rows={byPharmacy(onTheBoard(SIMPLE_REPEATS))} {...shared} />}
          {tab === "complex" && <ComplexRepeatsTab rows={byPharmacy(onTheBoard(complexOnly))} {...shared} />}
          {tab === "escalated" && <EscalatedTab rows={byPharmacy(onTheBoard(ESCALATIONS))} {...shared} />}
          {tab === "mine" && <MineTab refs={mine.map((h) => h.ref)} {...shared} />}
          {tab === "info" && (
            <AwaitingInfoTab
              requests={byPharmacy(
                Object.values(infoRequests)
                  .filter(isAwaitingPatient)
                  .map((r) => {
                    const c = resolveCase(r.ref);
                    // a request can outlive the case leaving the live queue
                    return c ? { ...r, ...c } : null;
                  })
                  .filter((r): r is NonNullable<typeof r> => r !== null),
              )}
              now={now}
              view={view}
            />
          )}
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
  view: (href: string) => void;
  drop: (ref: string) => void;
  waitFor: (ref: string) => { hours: number; flag: WaitFlag };
}

/**
 * A board row.
 *
 * The whole row opens the case, not just the Open button: the button is a
 * 50px target at the far end of a 1200px row, and everything to the left of
 * it was dead space pointing at a case the reader had already decided to
 * look at. Held and out-of-clearance rows pass no handler and stay inert.
 */
function Row({
  cols,
  tone,
  label,
  onOpen,
  children,
}: {
  cols: string;
  tone?: string;
  label: string;
  onOpen?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `Open ${label}` : undefined}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      className={`grid ${cols} items-start border-b border-[var(--divider)] last:border-0 focus:outline-none ${
        onOpen ? "cursor-pointer focus:bg-grey-100" : ""
      } ${tone ?? ""}`}
    >
      {children}
    </div>
  );
}

/** Buttons live here: their clicks are theirs, not the row's. */
function ActionsCell({ children, className = "px-4 py-4" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

/** The waiting chip for a row, read off the shared clock. */
function WaitChipFor({ s, ref_ }: { s: Shared; ref_: string }) {
  const { hours, flag } = s.waitFor(ref_);
  return <WaitChip hours={hours} flag={flag} />;
}

/*
 * A note on the grid templates above: every row is its own grid container, so
 * an `auto` or `min-content` track is sized against that row alone and the
 * columns stop lining up between rows. Give every track an explicit width or
 * an fr, never auto.
 */
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
  const cols = "grid-cols-[1.1fr_1.3fr_1.5fr_1.4fr_132px_170px] [&>*]:min-w-0";
  const visible = rows.filter((o) => !s.onlyMine || s.isAvailable(s.state(o.ref, "new", o.score.rag)));
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Eligibility</HeadCell>
        <HeadCell>Status</HeadCell>
        <HeadCell>Actions</HeadCell>
      </div>
      {visible.length === 0 && <EmptyRow>Nothing here matches your clearance right now.</EmptyRow>}
      {visible.map((o) => {
        const st = s.state(o.ref, "new", o.score.rag);
        const href = `/doctor/orders/${o.ref}`;
        return (
          <Row
            key={o.ref}
            cols={cols}
            tone={rowTone(st)}
            label={o.ref}
            onOpen={s.isAvailable(st) ? () => s.open(o.ref, "new", o.score.rag, href) : undefined}
          >
            <PatientCell ref_={o.ref} nhs={o.nhs} />
            <div className="px-4 py-4"><PharmacyLabel code={o.pharmacyCode} /></div>
            <MedCell med={o.med} dose={o.dose} />
            <div className="px-4 py-4 text-sm text-text-secondary">{o.eligibility}</div>
            <div className="flex flex-col items-start gap-1.5 px-4 py-4"><ScorePill score={o.score} /><WaitChipFor s={s} ref_={o.ref} /></div>
            <ActionsCell>
              <ClaimCell
                state={st}
                now={s.now}
                onClaim={() => s.takeOne(o.ref, "new", o.score.rag)}
                onOpen={() => s.open(o.ref, "new", o.score.rag, href)}
                onRelease={() => s.drop(o.ref)}
              />
            </ActionsCell>
          </Row>
        );
      })}
    </TableCard>
  );
}

// ---- Simple Repeats (batch) ----------------------------------------------

function SimpleRepeatsTab({ rows, ...s }: { rows: typeof SIMPLE_REPEATS } & Shared) {
  const [reviewing, setReviewing] = useState(false);
  /** cases pulled out of this batch — still claimed, just signed separately */
  const [dropped, setDropped] = useState<string[]>([]);
  const [done, setDone] = useState(0);

  const cols = "grid-cols-[1.1fr_1.3fr_1.5fr_1.1fr_132px_170px] [&>*]:min-w-0";
  const visible = rows.filter((r) => !s.onlyMine || s.isAvailable(s.state(r.ref, "simple", r.score.rag)));
  const mineHere = rows.filter((r) => s.state(r.ref, "simple", r.score.rag).kind === "mine");
  const batch = mineHere.filter((r) => !dropped.includes(r.ref));
  const closeReview = () => {
    setReviewing(false);
    setDropped([]);
  };

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
            onClick={() => {
              setDropped([]);
              setReviewing(true);
            }}
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
          <HeadCell>Status</HeadCell>
          <HeadCell>Actions</HeadCell>
        </div>
        {visible.length === 0 && <EmptyRow>Nothing here matches your clearance right now.</EmptyRow>}
        {visible.map((r) => {
          const st = s.state(r.ref, "simple", r.score.rag);
          const href = `/doctor/repeats/${r.ref}`;
          return (
            <Row
              key={r.ref}
              cols={cols}
              tone={rowTone(st)}
              label={r.ref}
              onOpen={s.isAvailable(st) ? () => s.open(r.ref, "simple", r.score.rag, href) : undefined}
            >
              <PatientCell ref_={r.ref} nhs={r.nhs} />
              <div className="px-4 py-4"><PharmacyLabel code={r.pharmacyCode} /></div>
              <MedCell med={r.med} dose={r.dose} />
              <div className="truncate px-4 py-4 text-sm text-text-secondary">{r.lastReview}</div>
              <div className="flex flex-col items-start gap-1.5 px-4 py-4"><ScorePill score={r.score} /><WaitChipFor s={s} ref_={r.ref} /></div>
              <ActionsCell>
                <ClaimCell
                  state={st}
                  now={s.now}
                  onClaim={() => s.takeOne(r.ref, "simple", r.score.rag)}
                  onOpen={() => s.open(r.ref, "simple", r.score.rag, href)}
                  onRelease={() => s.drop(r.ref)}
                />
              </ActionsCell>
            </Row>
          );
        })}
      </TableCard>

      <Modal
        open={reviewing}
        size="lg"
        title="Review & sign batch"
        subtitle={`${batch.length} Green simple repeat${batch.length === 1 ? "" : "s"} you hold`}
        onClose={closeReview}
      >
        <p className="text-sm leading-relaxed text-text-secondary">
          All {mineHere.length}{" "}
          scored Green against their pharmacy SOP. Check each one before signing — drop any you&rsquo;d rather review
          on its own.
        </p>

        <div className="mt-4 divide-y divide-[var(--divider)] overflow-hidden rounded-xl border border-[var(--divider)]">
          {batch.map((r) => (
            <div key={r.ref} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                  <span className="font-mono text-[13px] font-bold text-text-primary">{r.ref}</span>
                  <PharmacyLabel code={r.pharmacyCode} />
                </p>
                <p className="mt-0.5 text-sm font-bold text-text-primary">
                  {r.med} {r.dose}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2">
                  <RuleChip>Rule 1.1 eligibility</RuleChip>
                  <RuleChip>Rule 2.2 titration</RuleChip>
                  <span className="text-xs text-text-secondary">last review {r.lastReview}</span>
                </p>
              </div>
              <ScorePill score={r.score} />
              <button
                type="button"
                onClick={() => setDropped((d) => [...d, r.ref])}
                aria-label={`Remove ${r.ref} from this batch`}
                title="Review this one on its own"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background-neutral text-text-secondary transition-colors hover:bg-grey-300 hover:text-text-primary"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
          {batch.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-secondary">
              You&rsquo;ve dropped every case — nothing left to sign in this batch.
            </p>
          )}
        </div>

        {dropped.length > 0 && (
          <p className="mt-2 text-xs text-text-secondary">
            {dropped.length} dropped — still yours, just not in this batch.
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-text-secondary">
          Each approval is signed and audit-logged individually against the SOP version active now.
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeReview}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={batch.length === 0}
            onClick={() => {
              const n = batch.length;
              batch.forEach((r) => s.drop(r.ref));
              closeReview();
              setDone(n);
            }}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
          >
            Sign {batch.length} prescription{batch.length === 1 ? "" : "s"}
          </button>
        </div>
      </Modal>
    </>
  );
}

/** The SOP rules a simple repeat was auto-scored against, named on the case. */
function RuleChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-success-lighter px-2 py-0.5 text-[11px] font-bold text-success-dark">
      {children}
    </span>
  );
}

// ---- Complex Repeats ------------------------------------------------------

function ComplexRepeatsTab({ rows, ...s }: { rows: typeof COMPLEX_CASES } & Shared) {
  const cols = "grid-cols-[1.1fr_1.3fr_1.5fr_1.4fr_132px_170px] [&>*]:min-w-0";
  const visible = rows.filter((c) => !s.onlyMine || s.isAvailable(s.state(c.ref, "complex", c.score.rag)));
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Flag Reason</HeadCell>
        <HeadCell>Status</HeadCell>
        <HeadCell>Actions</HeadCell>
      </div>
      {visible.length === 0 && <EmptyRow>Nothing here matches your clearance right now.</EmptyRow>}
      {visible.map((c) => {
        const st = s.state(c.ref, "complex", c.score.rag);
        const href = `/doctor/cases/${c.ref}`;
        return (
          <Row
            key={c.ref}
            cols={cols}
            tone={rowTone(st)}
            label={c.ref}
            onOpen={s.isAvailable(st) ? () => s.open(c.ref, "complex", c.score.rag, href) : undefined}
          >
            <PatientCell ref_={c.ref} nhs={c.nhs} />
            <div className="px-4 py-4"><PharmacyLabel code={c.pharmacyCode} /></div>
            <MedCell med={c.med} dose={c.dose} />
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-text-primary">
              <WarnIcon width={18} height={18} className="shrink-0 text-warning" />
              {c.flagReason}
            </div>
            <div className="flex flex-col items-start gap-1.5 px-4 py-4"><ScorePill score={c.score} /><WaitChipFor s={s} ref_={c.ref} /></div>
            <ActionsCell>
              <ClaimCell
                state={st}
                now={s.now}
                onClaim={() => s.takeOne(c.ref, "complex", c.score.rag)}
                onOpen={() => s.open(c.ref, "complex", c.score.rag, href)}
                onRelease={() => s.drop(c.ref)}
              />
            </ActionsCell>
          </Row>
        );
      })}
    </TableCard>
  );
}

// ---- Escalated ------------------------------------------------------------

function EscalatedTab({ rows, ...s }: { rows: typeof ESCALATIONS } & Shared) {
  // Actions is wider here than on the other tabs: it carries where the
  // escalation has got to as well as the way in
  const cols = "grid-cols-[1.1fr_1.2fr_1.4fr_1.3fr_132px_200px] [&>*]:min-w-0";
  return (
    <TableCard>
      <div className={`grid ${cols} border-b border-[var(--divider)] bg-grey-100`}>
        <HeadCell>Patient</HeadCell>
        <HeadCell>Pharmacy</HeadCell>
        <HeadCell>Medication / Dose</HeadCell>
        <HeadCell>Escalation Reason</HeadCell>
        <HeadCell>Status</HeadCell>
        <HeadCell>Actions</HeadCell>
      </div>
      {rows.length === 0 && <EmptyRow>Nothing is with a senior right now.</EmptyRow>}
      {rows.map((e, i) => {
        const href = `/doctor/escalations/${e.ref}`;
        return (
          <Row key={`${e.ref}-${i}`} cols={cols} tone="hover:bg-grey-100" label={e.ref} onOpen={() => s.view(href)}>
            <PatientCell ref_={e.ref} nhs={e.nhs} />
            <div className="px-4 py-4"><PharmacyLabel code={e.pharmacyCode} /></div>
            <MedCell med={e.med} dose={e.dose} />
            <div className="px-4 py-4 text-sm text-text-secondary">{e.reason}</div>
            {/* the same two chips every other tab shows — an escalated case is
                still a patient waiting, and the wait is the thing a prescriber
                scans this column for */}
            <div className="flex flex-col items-start gap-1.5 px-4 py-4">
              <RagPill rag={ESCALATION_RAG} />
              <WaitChipFor s={s} ref_={e.ref} />
            </div>
            <div className="flex flex-col items-start gap-2 px-4 py-4">
              {/* awaiting means nobody has picked it up yet, so that is the
                  one worth colouring */}
              <span
                className={`text-xs font-bold ${
                  e.status === "Awaiting senior review" ? "text-warning-dark" : "text-text-secondary"
                }`}
              >
                {e.status}
              </span>
              {/* no Claim: the case is already with the prescriber who raised
                  it and the senior reviewing it, and a third clinician taking
                  it would pull it out from under both. Opening it is reading
                  it — the screen itself is read-only */}
              <ActionsCell className="">
                <button
                  type="button"
                  onClick={() => s.view(href)}
                  className="rounded-lg bg-primary-lighter px-3 py-1.5 text-xs font-bold text-primary-darker hover:bg-primary-light"
                >
                  Open
                </button>
              </ActionsCell>
            </div>
          </Row>
        );
      })}
    </TableCard>
  );
}

// ---- Mine -----------------------------------------------------------------

/** Everything this prescriber is holding, whatever category it came from. */
function MineTab({ refs, ...s }: { refs: string[] } & Shared) {
  const cols = "grid-cols-[1.1fr_1fr_1.5fr_1.3fr_132px_170px] [&>*]:min-w-0";

  const items = refs
    .map(resolveCase)
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
        <HeadCell>Actions</HeadCell>
      </div>
      {items.map((it) => {
        const st = s.state(it.ref, it.category, it.rag);
        return (
          <Row
            key={it.ref}
            cols={cols}
            tone={rowTone(st)}
            label={it.ref}
            onOpen={it.href ? () => s.open(it.ref, it.category, it.rag, it.href!) : undefined}
          >
            <PatientCell ref_={it.ref} nhs={it.nhs} />
            <div className="px-4 py-4">
              <span className="rounded-md bg-grey-200 px-2 py-0.5 text-xs font-semibold text-text-secondary">
                {CATEGORY_LABEL[it.category]}
              </span>
            </div>
            <MedCell med={it.med} dose={it.dose} />
            <div className="truncate px-4 py-4 text-sm text-text-secondary" title={it.detail}>{it.detail}</div>
            <div className="px-4 py-4"><PharmacyLabel code={it.pharmacyCode} /></div>
            <ActionsCell>
              <ClaimCell
                state={st}
                now={s.now}
                onClaim={() => s.takeOne(it.ref, it.category, it.rag)}
                onOpen={it.href ? () => s.open(it.ref, it.category, it.rag, it.href!) : undefined}
                onRelease={() => s.drop(it.ref)}
              />
            </ActionsCell>
          </Row>
        );
      })}
    </TableCard>
  );
}

/**
 * Find a case by ref.
 *
 * Reads the same flattened board the admin does rather than searching the four
 * arrays again. The second implementation had its own precedence — it checked
 * complex repeats before escalations, so an escalated case resolved as a
 * complex one and Mine sent the prescriber to a decision screen for a case
 * that is with a senior.
 */
function resolveCase(ref: string) {
  return liveCases().find((c) => c.ref === ref) ?? null;
}


/**
 * Cases waiting on the patient. Nothing here is claimable — the answer has to
 * arrive first — but it opens like any other row: reading the case is how you
 * decide whether what you asked for is still what you need.
 */
function AwaitingInfoTab({
  requests,
  now,
  view,
}: {
  requests: (InfoRequest & {
    category: QueueCategory;
    rag: Rag;
    med: string;
    dose: string;
    nhs: string;
    pharmacyCode: string;
    href?: string;
  })[];
  now: number;
  view: (href: string) => void;
}) {
  // the same six-column shape as every other tab: chips in Status, the way in
  // under Actions
  const cols = "grid-cols-[1.1fr_1fr_1.4fr_1.6fr_148px_120px] [&>*]:min-w-0";

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--divider)] px-4 py-12 text-center">
        <p className="text-sm font-semibold text-text-primary">Nothing is waiting on a patient</p>
        <p className="mt-1 text-sm text-text-secondary">
          Cases land here when a prescriber asks the patient for something, and leave when they reply.
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
        <HeadCell>What was asked</HeadCell>
        <HeadCell>Status</HeadCell>
        <HeadCell>Actions</HeadCell>
      </div>
      {[...requests]
        .sort((a, b) => a.at - b.at)
        .map((r) => (
          <Row
            key={r.ref}
            cols={cols}
            tone="hover:bg-grey-100"
            label={r.ref}
            onOpen={r.href ? () => view(r.href!) : undefined}
          >
            <PatientCell ref_={r.ref} nhs={r.nhs} />
            <div className="px-4 py-4">
              <span className="rounded-md bg-grey-200 px-2 py-0.5 text-xs font-semibold text-text-secondary">
                {CATEGORY_LABEL[r.category]}
              </span>
            </div>
            <MedCell med={r.med} dose={r.dose} />
            <div className="px-4 py-4">
              <p className="truncate text-sm text-text-primary" title={r.subject}>{r.subject}</p>
              <p className="truncate text-xs text-text-secondary">
                {r.by} · asked {askedAgo(r, now)}
              </p>
            </div>
            {/* the waiting clock is parked while the patient has it, so the
                second chip says who is holding things up rather than showing a
                wait that isn't running */}
            <div className="flex flex-col items-start gap-1.5 px-4 py-4">
              <RagPill rag={r.rag} />
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-grey-200 px-2.5 py-1 text-xs font-bold text-text-secondary">
                <PausedGlyph />
                With patient
              </span>
            </div>
            <ActionsCell>
              {r.href && (
                <button
                  type="button"
                  onClick={() => view(r.href!)}
                  className="rounded-lg bg-primary-lighter px-3 py-1.5 text-xs font-bold text-primary-darker hover:bg-primary-light"
                >
                  Open
                </button>
              )}
            </ActionsCell>
          </Row>
        ))}
    </TableCard>
  );
}

function PausedGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" />
      <path d="M10 9v6M14 9v6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
