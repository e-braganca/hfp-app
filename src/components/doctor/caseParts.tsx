"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";

/* ============================================================================
   The pieces every review surface repeats.

   New orders, complex repeats, simple repeats and the admin's drawer are four
   readings of the same thing, so they were four copies of the same cards and
   the same dialog. Copies drift: the escalation dialog was red on one screen
   and amber on the others long after a doctor stopped being able to decline.
   ============================================================================ */

/** What the patient asked for, in the slot every review screen puts it in. */
export function OrderRequestCard({
  med,
  detail,
  meta,
  children,
}: {
  med: string;
  /** "2.5 mg · self-requested new start" */
  detail: string;
  /** "Willowbrook Pharmacy · submitted 10:24 today" */
  meta: string;
  /** anything that hangs off the request, e.g. the patient's preference */
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-background-paper p-5 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order request</p>
      <p className="mt-2 text-base font-bold text-text-primary">{med}</p>
      <p className="text-sm text-text-secondary">{detail}</p>
      <p className="mt-1 text-sm text-text-secondary">{meta}</p>
      {children}
    </div>
  );
}

/**
 * Hand the case to a senior.
 *
 * The only way out of a case a prescriber will not issue — they cannot
 * decline, so this dialog is never a rejection and is never styled as one.
 */
export function EscalateModal({
  open,
  caseRef,
  pharmacy,
  what = "case",
  onClose,
  onConfirm,
}: {
  open: boolean;
  caseRef: string;
  pharmacy: string;
  /** "order", "repeat" — what the sentence should call it */
  what?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Escalate to senior review"
      subtitle={`${caseRef} · ${pharmacy}`}
      onClose={onClose}
    >
      <p className="text-sm text-text-secondary">
        This {what} will be removed from your queue and routed to senior clinical review. Add an optional note for the
        reviewer.
      </p>
      <textarea
        rows={3}
        placeholder="Optional note for the reviewer…"
        className="mt-3 w-full rounded-lg border border-[var(--divider)] p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
      />
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-warning-dark px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          Confirm escalation
        </button>
      </div>
    </Modal>
  );
}

/** The three decision buttons, in the one order they appear in everywhere. */
export function DecisionButtons({
  amended,
  disabled,
  onApprove,
  onRequestInfo,
  onEscalate,
  extra,
}: {
  amended: boolean;
  disabled?: boolean;
  onApprove: () => void;
  onRequestInfo: () => void;
  /** omitted where there is nobody to escalate to — the admin is the senior */
  onEscalate?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onApprove}
        disabled={disabled}
        className="flex-1 basis-40 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
      >
        {amended ? "Issue amended" : "Approve & issue"}
      </button>
      <button
        type="button"
        onClick={onRequestInfo}
        className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-[var(--divider)] px-4 py-3 text-sm font-bold text-text-primary hover:bg-background-neutral"
      >
        Request more info
      </button>
      {onEscalate && (
        <button
          type="button"
          onClick={onEscalate}
          className="flex-1 basis-40 whitespace-nowrap rounded-lg border border-warning px-4 py-3 text-sm font-bold text-warning-dark hover:bg-warning-lighter"
        >
          Escalate
        </button>
      )}
      {extra}
    </div>
  );
}
