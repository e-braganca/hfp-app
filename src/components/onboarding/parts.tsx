// Reusable onboarding funnel UI primitives.
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon } from "@/components/ui/icons";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">{children}</p>
  );
}

export function StepHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-text-primary">
        {title}
      </h1>
      {sub && <p className="mt-2 text-base text-text-secondary">{sub}</p>}
    </div>
  );
}

/** Selectable option card (single- or multi-select). */
export function OptionCard({
  label,
  desc,
  selected,
  onClick,
}: {
  label: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border-2 px-5 py-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary-lighter"
          : "border-[var(--divider)] bg-background-paper hover:border-primary-light"
      }`}
    >
      <span className="flex-1">
        <span className="block text-base font-semibold text-text-primary">{label}</span>
        {desc && <span className="mt-0.5 block text-sm text-text-secondary">{desc}</span>}
      </span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-primary bg-primary text-white" : "border-grey-400 bg-background-paper"
        }`}
      >
        {selected && <CheckIcon width={14} height={14} />}
      </span>
    </button>
  );
}

/** Yes / No segmented control. Yes = red when chosen, No = green when chosen. */
export function YesNo({
  value,
  onChange,
}: {
  value?: "yes" | "no";
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => onChange("yes")}
        className={`h-9 w-14 rounded-lg text-sm font-bold transition-colors ${
          value === "yes" ? "bg-error text-white" : "bg-grey-100 text-text-primary hover:bg-grey-200"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange("no")}
        className={`h-9 w-14 rounded-lg text-sm font-bold transition-colors ${
          value === "no" ? "bg-primary text-white" : "bg-grey-100 text-text-primary hover:bg-grey-200"
        }`}
      >
        No
      </button>
    </div>
  );
}

/** Number field with a unit suffix. */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  placeholder?: string;
}) {
  return (
    <label className="block flex-1">
      <span className="mb-1.5 block text-sm text-text-secondary">{label}</span>
      <span className="relative flex items-center">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full rounded-xl border-2 border-[var(--divider)] bg-background-paper px-4 pr-12 text-xl font-bold text-text-primary focus:border-primary focus:outline-none"
        />
        <span className="pointer-events-none absolute right-4 text-sm text-text-secondary">{suffix}</span>
      </span>
    </label>
  );
}

/**
 * Live camera capture for the weight photo / ID checks. Streams the device
 * camera via getUserMedia and grabs a frame to a JPEG data URL — there is no
 * file input on purpose: gallery uploads are exactly what this step must
 * prevent. Desktop browsers ignore facingMode and use whatever camera exists.
 */
export function CameraCapture({
  icon,
  captureLabel,
  facing,
  imageUrl,
  onCapture,
  onRetake,
  note,
}: {
  icon: ReactNode;
  captureLabel: string;
  /** "user" = front camera (weight selfie), "environment" = back (ID) */
  facing: "user" | "environment";
  /** captured JPEG data URL, or "" when nothing captured yet */
  imageUrl: string;
  onCapture: (dataUrl: string) => void;
  onRetake: () => void;
  note: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      setLive(true);
    } catch {
      setError("We couldn't access your camera. Allow camera permission in your browser and try again.");
    }
  };

  // attach the stream once the <video> for the live state is in the DOM
  useEffect(() => {
    if (live && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [live]);

  // release the camera if the user navigates away mid-stream
  useEffect(() => stop, []);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    stop();
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div>
      <div
        className={`overflow-hidden rounded-xl border-2 ${
          imageUrl ? "border-primary" : "border-dashed border-[var(--divider)]"
        } bg-background-paper`}
      >
        {imageUrl ? (
          /* captured: show the frozen frame + retake */
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Captured photo" className="max-h-80 w-full object-cover" />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-1 text-[11px] font-extrabold text-white">
              <CheckIcon width={12} height={12} /> Captured live
            </span>
            <button
              type="button"
              onClick={() => {
                onRetake();
                start();
              }}
              className="absolute bottom-3 right-3 rounded-lg bg-background-paper/95 px-4 py-2 text-sm font-bold text-text-primary shadow-z8 hover:bg-background-neutral"
            >
              Retake
            </button>
          </div>
        ) : live ? (
          /* streaming: live viewfinder + shutter */
          <div className="relative">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`max-h-80 w-full bg-primary-darker object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-error px-2.5 py-1 text-[11px] font-extrabold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
            </span>
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={takePhoto}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-z8 hover:bg-primary-dark"
              >
                Take photo
              </button>
              <button
                type="button"
                onClick={stop}
                className="rounded-lg bg-background-paper/95 px-4 py-2.5 text-sm font-bold text-text-primary shadow-z8 hover:bg-background-neutral"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* idle: open the camera */
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-neutral text-text-disabled">
              {icon}
            </span>
            <button
              type="button"
              onClick={start}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
            >
              {captureLabel}
            </button>
            {error && <p className="max-w-sm text-sm font-semibold text-error-dark">{error}</p>}
          </div>
        )}
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning-lighter px-3 py-2.5 text-sm text-warning-darker">
        <WarnDot />
        {note}
      </p>
    </div>
  );
}

function WarnDot() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-warning-dark">
      <path d="M12 4 2.5 20h19z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Summary row (label left, value right) used on eligible/review screens. */
export function SummaryCard({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--divider)] bg-background-paper">
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-center justify-between gap-4 px-5 py-4 ${
            i > 0 ? "border-t border-[var(--divider)]" : ""
          }`}
        >
          <span className="text-sm text-text-secondary">{r.label}</span>
          <span className="text-right text-sm font-bold text-text-primary">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Big outcome ring icon. */
export function ResultRing({ tone }: { tone: "ok" | "blocked" | "info" }) {
  const map = {
    ok: { bg: "bg-success-lighter", fg: "text-success-dark", icon: <CheckIcon width={36} height={36} /> },
    blocked: {
      bg: "bg-error-lighter",
      fg: "text-error",
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    info: {
      bg: "bg-warning-lighter",
      fg: "text-warning-dark",
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  }[tone];
  return (
    <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${map.bg} ${map.fg}`}>
      {map.icon}
    </div>
  );
}
