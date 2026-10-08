"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

/* ============================================================================
   What the patient uploaded, at a size you can actually assess.

   The prescriber is asked to confirm the ID matches the weight photo before
   issuing. Two thumbnails the size of a postage stamp cannot carry that
   check — a face at 120px is not a face you can match — so every tile opens
   full-bleed, and the viewer steps between the two without closing, because
   the comparison is the task.

   Demo assets: four synthetic patients, picked by case ref so one patient
   keeps one face across every screen that shows them.
   ============================================================================ */

const PERSONAS = 4;

export type MediaKind = "body" | "id";

const DIMS: Record<MediaKind, { w: number; h: number }> = {
  body: { w: 1122, h: 1402 },
  id: { w: 1536, h: 1024 },
};

/** Stable per ref — the same patient must not change face between screens. */
export function personaFor(caseRef: string): number {
  let n = 0;
  for (const ch of caseRef) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return (n % PERSONAS) + 1;
}

export const mediaSrc = (caseRef: string, kind: MediaKind) =>
  `/demo/patients/${kind === "body" ? "body" : "id"}-0${personaFor(caseRef)}.webp`;

interface Shot {
  kind: MediaKind;
  title: string;
  caption: string;
}

/**
 * The verification card itself — the tiles plus the viewer they open. Shared
 * by every review surface so the doctor and the admin assess the same two
 * uploads the same way.
 */
export function PatientMediaCard({
  caseRef,
  weightPhoto,
  idDocument,
  note,
}: {
  caseRef: string;
  weightPhoto: string;
  idDocument: string;
  /** the confirm-before-issuing line; omitted where nobody is issuing */
  note?: string;
}) {
  const shots: Shot[] = [
    { kind: "body", title: "Weight photo", caption: weightPhoto },
    { kind: "id", title: "ID document", caption: idDocument },
  ];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="rounded-lg bg-background-paper p-5 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
        Identity &amp; weight verification
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {shots.map((s, i) => (
          <button
            key={s.kind}
            type="button"
            onClick={() => setOpen(i)}
            className="group rounded-lg border border-[var(--divider)] p-3 text-left transition-colors hover:border-primary focus:border-primary focus:outline-none"
          >
            <span className="relative block h-28 overflow-hidden rounded-md bg-background-neutral">
              <Image
                src={mediaSrc(caseRef, s.kind)}
                alt={`${s.title} for ${caseRef}`}
                fill
                sizes="200px"
                className={s.kind === "body" ? "object-cover object-top" : "object-contain"}
              />
              {/* the affordance has to be visible without hovering: on a
                  touch screen there is no hover to discover it with */}
              <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-md bg-primary-darker/70 text-white">
                <ExpandIcon />
              </span>
            </span>
            <span className="mt-2 block text-sm font-bold text-text-primary group-hover:text-primary-dark">
              {s.title}
            </span>
            <span className="block text-xs text-text-secondary">{s.caption}</span>
          </button>
        ))}
      </div>
      {note && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-lighter px-3 py-2.5 text-sm text-warning-darker">
          <WarnGlyph />
          {note}
        </div>
      )}

      <MediaViewer
        caseRef={caseRef}
        shots={shots}
        index={open}
        onIndex={setOpen}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}

function MediaViewer({
  caseRef,
  shots,
  index,
  onIndex,
  onClose,
}: {
  caseRef: string;
  shots: Shot[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const step = useCallback(
    (d: number) => {
      if (index === null) return;
      onIndex((index + d + shots.length) % shots.length);
    },
    [index, onIndex, shots.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, onClose, step]);

  if (index === null) return null;
  const shot = shots[index];
  const { w, h } = DIMS[shot.kind];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-primary-darker/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 px-1 pb-3 text-white">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">{caseRef}</p>
          <h2 className="truncate text-lg font-bold">{shot.title}</h2>
          <p className="truncate text-sm text-white/80">{shot.caption}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-3">
        <ArrowButton dir="prev" onClick={() => step(-1)} />
        {/* stopPropagation so clicking the photo itself doesn't dismiss the
            thing you clicked to look at */}
        <div className="flex min-h-0 flex-1 justify-center" onClick={(e) => e.stopPropagation()}>
          <Image
            src={mediaSrc(caseRef, shot.kind)}
            alt={`${shot.title} for ${caseRef}`}
            width={w}
            height={h}
            priority
            className="max-h-full w-auto rounded-lg object-contain shadow-dialog"
          />
        </div>
        <ArrowButton dir="next" onClick={() => step(1)} />
      </div>

      <div className="shrink-0 pt-3 text-center text-xs font-semibold text-white/70">
        {index + 1} of {shots.length} · arrow keys to switch · Esc to close
      </div>
    </div>
  );
}

function ArrowButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous image" : "Next image"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d={dir === "prev" ? "M15 5 8 12l7 7" : "m9 5 7 7-7 7"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarnGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-warning-dark" aria-hidden>
      <path d="M12 4 2.5 20h19L12 4Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M12 10v4.5M12 17.2v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
