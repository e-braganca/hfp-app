"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StepperBar } from "@/components/ui/StepperBar";
import { CameraIcon, CheckIcon, IdIcon } from "@/components/ui/icons";
import { CameraCapture } from "@/components/onboarding/parts";
import {
  getVerificationServerSnapshot,
  getVerificationSnapshot,
  setPendingVerification,
  subscribeVerification,
} from "@/lib/verification";

/* ============================================================================
   Verification catch-up (/patient/verify) — the short wizard behind the
   order-on-hold banner. Same skeleton as the re-order wizard (StepperBar +
   centered card) and the exact CameraCapture the onboarding uses: live
   camera only, no uploads. Sending the photos releases the hold.
   ============================================================================ */

export default function VerifyPage() {
  const pending = useSyncExternalStore(
    subscribeVerification,
    getVerificationSnapshot,
    getVerificationServerSnapshot,
  );

  const [weightUrl, setWeightUrl] = useState("");
  const [idUrl, setIdUrl] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // freeze the work list on first render of a session so completing a step
  // doesn't reshuffle the wizard under the user
  const [needs] = useState(() => ({
    weight: getVerificationSnapshot()?.weightPhoto ?? false,
    id: getVerificationSnapshot()?.idDoc ?? false,
  }));

  const stepKeys = [
    ...(needs.weight ? (["weight"] as const) : []),
    ...(needs.id ? (["id"] as const) : []),
    "confirm" as const,
  ];
  const labels = stepKeys.map((k) => (k === "weight" ? "Weight photo" : k === "id" ? "ID photo" : "Confirm"));
  const key = stepKeys[step];

  const canContinue = key === "weight" ? weightUrl !== "" : key === "id" ? idUrl !== "" : true;

  const submit = () => {
    setPendingVerification(null); // releases the hold
    setDone(true);
  };

  // nothing owed and nothing just completed → all verified
  if (!done && !pending && !needs.weight && !needs.id) {
    return (
      <div>
        <PageHeader title="Verification" subtitle="Weight photo & ID" />
        <div className="px-6 py-10 lg:px-8">
          <div className="mx-auto max-w-xl rounded-lg bg-background-paper p-8 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-lighter text-success-dark">
              <CheckIcon width={24} height={24} />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-text-primary">You&rsquo;re all verified</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
              There&rsquo;s nothing outstanding — your order is with the prescriber.
            </p>
            <Link href="/patient" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <PageHeader title="Verification" subtitle="Weight photo & ID" />
        <div className="px-6 py-10 lg:px-8">
          <div className="mx-auto max-w-xl rounded-lg bg-background-paper p-8 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-lighter text-success-dark">
              <CheckIcon width={24} height={24} />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-text-primary">Photos sent — hold released</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
              Your order re-enters the queue now. A prescriber checks the photos against your answers before anything
              is issued or charged — usually within 24 hours.
            </p>
            <Link href="/patient" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Finish your verification" subtitle="Your order is on hold until these photos are in" />

      <div className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <StepperBar steps={labels} current={step} />

          <div className="mt-6 rounded-lg bg-background-paper p-6 shadow-card">
            {key === "weight" && (
              <>
                <h2 className="text-lg font-extrabold text-text-primary">Take a live weight photo</h2>
                <p className="mb-4 mt-1 text-sm text-text-secondary">Full-length, taken right now on your camera.</p>
                <CameraCapture
                  icon={<CameraIcon width={26} height={26} />}
                  captureLabel="Open camera"
                  facing="user"
                  imageUrl={weightUrl}
                  onCapture={setWeightUrl}
                  onRetake={() => setWeightUrl("")}
                  note="Must be taken live on your camera now — gallery uploads aren't accepted."
                />
              </>
            )}

            {key === "id" && (
              <>
                <h2 className="text-lg font-extrabold text-text-primary">Photograph your ID</h2>
                <p className="mb-4 mt-1 text-sm text-text-secondary">Passport or UK driving licence, in focus.</p>
                <CameraCapture
                  icon={<IdIcon width={26} height={26} />}
                  captureLabel="Capture ID"
                  facing="environment"
                  imageUrl={idUrl}
                  onCapture={setIdUrl}
                  onRetake={() => setIdUrl("")}
                  note="A prescriber will visually confirm your ID matches your weight photo before issuing."
                />
              </>
            )}

            {key === "confirm" && (
              <>
                <h2 className="text-lg font-extrabold text-text-primary">Send your photos</h2>
                <p className="mt-1 text-sm text-text-secondary">Check they&rsquo;re clear, then send — this releases the hold on your order.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {needs.weight && (
                    <figure>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={weightUrl} alt="Weight photo" className="h-40 w-full rounded-xl border-2 border-primary object-cover" />
                      <figcaption className="mt-1.5 text-xs font-bold text-text-secondary">Weight photo · live</figcaption>
                    </figure>
                  )}
                  {needs.id && (
                    <figure>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={idUrl} alt="ID photo" className="h-40 w-full rounded-xl border-2 border-primary object-cover" />
                      <figcaption className="mt-1.5 text-xs font-bold text-text-secondary">ID photo · live</figcaption>
                    </figure>
                  )}
                </div>
                <p className="mt-4 rounded-lg bg-primary-lighter px-4 py-3 text-xs leading-relaxed text-primary-dark">
                  Photos are encrypted and only visible to the clinical team reviewing your order.
                </p>
              </>
            )}

            {/* footer */}
            <div className="mt-6 flex items-center justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral"
                >
                  Back
                </button>
              ) : (
                <Link
                  href="/patient"
                  className="rounded-lg border border-[var(--divider)] px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-background-neutral"
                >
                  Later
                </Link>
              )}
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => (key === "confirm" ? submit() : setStep((s) => s + 1))}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40"
              >
                {key === "confirm" ? "Send photos & release hold" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
