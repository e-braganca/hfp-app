// ============================================================================
// What a prescriber can ask a patient for.
//
// A fixed list rather than free text, because the answer has to come back
// structured: the review screen shows each item as outstanding or supplied,
// and "did the patient actually send the thing we asked for?" is not a
// question anyone should have to answer by re-reading an email thread.
//
// `ask` is the line the patient reads. It is written as an instruction, not a
// description, so the items can be dropped straight into the message body.
// ============================================================================

export interface RfiItem {
  id: string;
  /** what the prescriber ticks */
  label: string;
  /** the line the patient gets */
  ask: string;
  /** true when the reply is expected as a file rather than words */
  upload?: boolean;
}

export const RFI_ITEMS: RfiItem[] = [
  {
    id: "photo-id",
    label: "Photo ID",
    ask: "A clear photo of your passport or driving licence, taken on your camera now.",
    upload: true,
  },
  {
    id: "body-photos",
    label: "Body photos",
    ask: "New full-length body photos — the ones on file can't be read clearly enough to verify.",
    upload: true,
  },
  {
    id: "weight-height",
    label: "Confirmation of current weight / height",
    ask: "Your current weight and height, measured today, with a live photo of the scale reading.",
    upload: true,
  },
  {
    id: "medication-list",
    label: "Full medication list",
    ask: "Everything you currently take — prescription and over the counter — with the dose and how often.",
  },
  {
    id: "pharmacy-overview",
    label: "Medication overview from the pharmacy",
    ask: "A printed medication summary from your pharmacy covering the last twelve months.",
    upload: true,
  },
  {
    id: "previous-glp1",
    label: "Documentation of previous GLP-1 use",
    ask: "Which GLP-1 you were on before, at what dose, when you started and when you stopped.",
  },
  {
    id: "side-effects",
    label: "Side-effects detail",
    ask: "What you felt, when it started, how long it lasted, and whether it has settled.",
  },
  {
    id: "condition",
    label: "Clarification of a diagnosed condition",
    ask: "When the condition was diagnosed, by whom, and how it is being managed now.",
  },
  {
    id: "allergies",
    label: "Clarification of allergies",
    ask: "What you are allergic to and what happens when you are exposed to it.",
  },
  {
    id: "other",
    label: "Other (see note)",
    ask: "See the note below.",
  },
];

export const rfiItem = (id: string): RfiItem | undefined => RFI_ITEMS.find((i) => i.id === id);

/** The bulleted middle of the email, built from what was ticked. */
export function rfiAskBlock(ids: string[], note?: string): string {
  const lines = ids
    .map((id) => rfiItem(id))
    .filter((i): i is RfiItem => !!i)
    .map((i) => (i.id === "other" && note?.trim() ? `• ${note.trim()}` : `• ${i.label} — ${i.ask}`));
  return lines.join("\n");
}

// ---- what came back -------------------------------------------------------

export type RfiItemState = "outstanding" | "supplied" | "refused";

export interface RfiResponseItem {
  id: string;
  state: RfiItemState;
  /** what the patient wrote, or the file they sent */
  reply?: string;
  attachment?: string;
  at?: string;
}

export const RFI_STATE_LABEL: Record<RfiItemState, string> = {
  outstanding: "Still outstanding",
  supplied: "Supplied",
  refused: "Patient declined",
};

export const RFI_STATE_PILL: Record<RfiItemState, string> = {
  outstanding: "bg-warning-lighter text-warning-darker",
  supplied: "bg-success-lighter text-success-darker",
  refused: "bg-error-lighter text-error-darker",
};
