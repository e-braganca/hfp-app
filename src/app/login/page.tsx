"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "patient" | "doctor" | "admin";

const DEMO_EMAIL: Record<Role, string> = {
  patient: "alex.morgan@email.com",
  doctor: "eleanor.hart@hfp.co.uk",
  admin: "admin@hfp.co.uk",
};
const DEST: Record<Role, string> = {
  patient: "/patient",
  doctor: "/doctor/queue",
  admin: "/admin/overview",
};
const ROLE_LABEL: Record<Role, string> = {
  patient: "Patient",
  doctor: "Doctor",
  admin: "Administrator",
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState(DEMO_EMAIL.patient);
  const [password, setPassword] = useState("");

  const pickRole = (r: Role) => {
    setRole(r);
    setEmail(DEMO_EMAIL[r]);
  };

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(DEST[role]);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-dark.svg" alt="Prescriptr" className="h-6 w-auto" />

          <h1 className="mt-10 text-2xl font-extrabold tracking-tight text-text-primary">Sign in</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Welcome back! Track your treatment, or sign in as staff.
          </p>

          {/* role selector */}
          <div className="mt-6">
            <span className="mb-1.5 block text-sm font-semibold text-text-primary">Sign in as</span>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-background-neutral p-1">
              {(["patient", "doctor", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => pickRole(r)}
                  aria-pressed={role === r}
                  className={`rounded-lg py-2 text-sm font-bold capitalize transition-colors ${
                    role === r
                      ? "bg-background-paper text-text-primary shadow-z1"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={signIn} className="mt-5 space-y-4">
            <Field label="Email address">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-background-paper px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
              />
            </Field>

            <Field
              label="Password"
              aside={
                <a href="#" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </a>
              }
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-background-paper px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-main-24"
              />
            </Field>

            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary-dark"
            >
              Sign in as {ROLE_LABEL[role]}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Not registered yet?{" "}
            <Link href="/onboarding" className="font-semibold text-primary hover:underline">
              Start your assessment
            </Link>
          </p>

          <div className="my-6 flex items-center gap-3 text-xs text-text-disabled">
            <span className="h-px flex-1 bg-[var(--divider)]" />
            or
            <span className="h-px flex-1 bg-[var(--divider)]" />
          </div>

          <button
            type="button"
            onClick={() => router.push(DEST[role])}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--divider)] text-sm font-semibold text-text-primary hover:bg-background-neutral"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-10 text-center text-[11px] text-text-disabled">
            CQC-ready audit trail · SOP-grounded AI · GPhC-registered pharmacies
          </p>
        </div>
      </div>

      {/* brand panel — full-bleed clinicians image */}
      <div className="relative hidden overflow-hidden bg-gradient-to-b from-primary-light to-primary lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/doctors.png"
          alt="Prescriptr clinicians"
          className="absolute inset-0 h-full w-full object-cover object-bottom"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        {aside}
      </span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.7v3C3.6 21.3 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.5 14.6a7.2 7.2 0 0 1 0-4.6v-3H1.7a12 12 0 0 0 0 10.6z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.6 2.7 1.7 6.7l3.8 3c.9-2.8 3.5-4.9 6.5-4.9z" />
    </svg>
  );
}
