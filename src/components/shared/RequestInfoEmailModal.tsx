"use client";

import { useState, useSyncExternalStore } from "react";
import { Modal } from "@/components/ui/Modal";
import { RFI_ITEMS, rfiAskBlock } from "@/lib/shared/rfi-items";
import {
  DEFAULT_TEMPLATES,
  deleteTemplate,
  emailFor,
  getTemplatesServerSnapshot,
  getTemplatesSnapshot,
  salutationFor,
  saveTemplate,
  signOffFor,
  subscribeTemplates,
  type EmailTemplate,
} from "@/lib/email-templates";

/* ============================================================================
   Information-request email composer — shared by the doctor's order review
   and the admin's escalation queue. Pick a template, edit the middle, send.
   The greeting and sign-off are rendered read-only so every message from the
   platform is consistent and audit-friendly; only the body is authored.
   ============================================================================ */

export function RequestInfoEmailModal({
  open,
  onClose,
  onSend,
  patientName,
  sex,
  caseRef,
  senderName,
  senderRole,
}: {
  open: boolean;
  onClose: () => void;
  /** receives a short summary for the toast / audit line */
  onSend: (summary: { subject: string; templateName: string; items: string[]; note?: string }) => void;
  patientName: string;
  sex?: "Male" | "Female";
  caseRef: string;
  senderName: string;
  senderRole: string;
}) {
  const custom = useSyncExternalStore(subscribeTemplates, getTemplatesSnapshot, getTemplatesServerSnapshot);
  const templates: EmailTemplate[] = [...DEFAULT_TEMPLATES, ...custom];

  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
  const [subject, setSubject] = useState(DEFAULT_TEMPLATES[0].subject);
  const [body, setBody] = useState(DEFAULT_TEMPLATES[0].body);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggle = (id: string) =>
    setItems((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const greeting = `Dear ${salutationFor(patientName, sex)},`;
  const signOff = signOffFor(senderName, senderRole);
  const current = templates.find((t) => t.id === templateId);

  const pick = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setTemplateId(id);
    setSubject(t.subject);
    setBody(t.body);
    setSaving(false);
  };

  const edited = current ? body !== current.body || subject !== current.subject : false;

  /**
   * The ticked items are appended to whatever the template says, rather than
   * replacing it: the template carries the tone and the context, the checklist
   * carries the specifics, and the structured list is what the review screen
   * later chases against.
   */
  const ask = rfiAskBlock(items, note);

  const send = () => {
    onSend({
      subject,
      templateName: current?.name ?? "Custom",
      items,
      note: note.trim() || undefined,
    });
    setSaving(false);
    setNewName("");
    setItems([]);
    setNote("");
  };

  const fieldCls =
    "w-full rounded-lg border border-[var(--divider)] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24";

  return (
    <Modal
      open={open}
      title="Request information from the patient"
      subtitle={`${caseRef} · ${patientName}`}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {items.length > 0 && (
            <p className="mr-auto text-xs text-text-secondary">
              Asking for {items.length} {items.length === 1 ? "thing" : "things"}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={subject.trim() === "" || body.trim() === ""}
            onClick={send}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
          >
            Send email
          </button>
        </div>
      }
    >
      {/* recipient */}
      <div className="flex items-center gap-2 rounded-lg bg-background-neutral px-3 py-2 text-sm">
        <span className="font-bold text-text-secondary">To</span>
        <span className="font-semibold text-text-primary">{patientName}</span>
        <span className="font-mono text-xs text-text-secondary">&lt;{emailFor(patientName)}&gt;</span>
      </div>

      {/* what we need — the structured part, and the part the review screen
          later tracks. Multi-select because one email usually chases several
          gaps, and sending four separate emails is how patients disengage. */}
      <p className="mt-4 text-sm font-semibold text-text-primary">What do you need?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {RFI_ITEMS.map((i) => {
          const on = items.includes(i.id);
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => toggle(i.id)}
              aria-pressed={on}
              title={i.ask}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                on
                  ? "border-primary bg-primary-lighter text-primary-darker"
                  : "border-[var(--divider)] text-text-primary hover:bg-background-neutral"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  on ? "border-primary bg-primary text-white" : "border-[var(--divider)]"
                }`}
              >
                {on && (
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                    <path d="m5 12 5 5L20 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {i.label}
            </button>
          );
        })}
      </div>
      {items.includes("other") && (
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What else do you need from the patient?"
          className={`mt-2 ${fieldCls}`}
        />
      )}

      {/* template picker */}
      <label className="mt-4 block text-sm font-semibold text-text-primary">Template</label>
      <div className="mt-1.5 flex gap-2">
        <select value={templateId} onChange={(e) => pick(e.target.value)} className={`${fieldCls} flex-1`}>
          <optgroup label="Standard">
            {DEFAULT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </optgroup>
          {custom.length > 0 && (
            <optgroup label="Your templates">
              {custom.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
          )}
        </select>
        {current?.custom && (
          <button
            type="button"
            onClick={() => {
              deleteTemplate(current.id);
              pick(DEFAULT_TEMPLATES[0].id);
            }}
            className="rounded-lg border border-[var(--divider)] px-3 text-sm font-semibold text-error hover:bg-error-lighter"
          >
            Delete
          </button>
        )}
      </div>

      {/* subject */}
      <label className="mt-4 block text-sm font-semibold text-text-primary">Subject</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} className={`mt-1.5 ${fieldCls}`} />

      {/* body with fixed top and tail */}
      <label className="mt-4 block text-sm font-semibold text-text-primary">Message</label>
      <div className="mt-1.5 overflow-hidden rounded-lg border border-[var(--divider)]">
        <p className="border-b border-[var(--divider)] bg-background-neutral px-3 py-2 text-sm text-text-secondary">
          {greeting}
        </p>
        <textarea
          rows={9}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-y px-3 py-2.5 text-sm leading-relaxed text-text-primary focus:outline-none"
        />
        {ask && (
          <p className="whitespace-pre-line border-t border-[var(--divider)] bg-primary-lighter/40 px-3 py-2.5 text-sm text-text-primary">
            {ask}
          </p>
        )}
        <p className="whitespace-pre-line border-t border-[var(--divider)] bg-background-neutral px-3 py-2 text-sm text-text-secondary">
          {signOff}
        </p>
      </div>
      <p className="mt-1.5 text-xs text-text-secondary">
        The greeting, the list of what you ticked, and the sign-off are added automatically — you only write the
        middle.
      </p>

      {/* save as template */}
      {saving ? (
        <div className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Template name, e.g. Missing GP details"
            className={fieldCls}
          />
          <button
            type="button"
            disabled={newName.trim() === ""}
            onClick={() => {
              const t = saveTemplate(newName, subject, body);
              setTemplateId(t.id);
              setSaving(false);
              setNewName("");
            }}
            className="whitespace-nowrap rounded-lg bg-primary-dark px-3.5 py-2 text-sm font-bold text-white hover:bg-primary-darker disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setSaving(false)}
            className="rounded-lg border border-[var(--divider)] px-3 text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSaving(true)}
          className="mt-3 text-sm font-semibold text-primary underline hover:no-underline"
        >
          + Save this as a new template{edited ? " (edited)" : ""}
        </button>
      )}

    </Modal>
  );
}
