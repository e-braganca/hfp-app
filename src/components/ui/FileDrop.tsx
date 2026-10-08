"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "./icons";

/* ============================================================================
   Attach documents.

   Drag onto it or click to browse; either way the file is listed with its size
   and can be taken off again before sending. Nothing leaves the browser — in
   the prototype this records what would be attached, which is what the
   reviewer needs to see to judge the flow.
   ============================================================================ */

export interface Attachment {
  name: string;
  size: number;
}

const prettySize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export function FileDrop({
  files,
  onChange,
  label = "Attach documents",
  hint = "PDF, image or document · drag here or browse",
  accept = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx",
}: {
  files: Attachment[];
  onChange: (next: Attachment[]) => void;
  label?: string;
  hint?: string;
  accept?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = [...list].map((f) => ({ name: f.name, size: f.size }));
    // same file twice is a slip, not an intention
    const merged = [...files];
    for (const f of incoming) if (!merged.some((x) => x.name === f.name)) merged.push(f);
    onChange(merged);
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-text-secondary">{label}</p>

      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
          over
            ? "border-primary bg-primary-lighter/40"
            : "border-[var(--divider)] bg-background-neutral hover:border-text-disabled"
        }`}
      >
        <UploadIcon className={over ? "text-primary" : "text-text-disabled"} />
        <span className="text-sm font-bold text-text-primary">Drop files or browse</span>
        <span className="text-xs text-text-secondary">{hint}</span>
      </button>

      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          // so re-picking the same file still fires a change
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center gap-2 rounded-lg border border-[var(--divider)] bg-background-paper px-3 py-2"
            >
              <DocGlyph />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text-primary">{f.name}</span>
                <span className="block text-xs text-text-secondary">{prettySize(f.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(files.filter((x) => x.name !== f.name))}
                aria-label={`Remove ${f.name}`}
                className="shrink-0 rounded-md p-1 text-text-secondary hover:bg-background-neutral hover:text-text-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DocGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-disabled" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
