"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { sanitizeRedirect } from "@/lib/auth";
import { recordUserLogin } from "@/lib/auth-client";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

type SubmitStatus = {
  type: "idle" | "info" | "error" | "success";
  message: string;
};

export default function LoginPage() {
  const [mode, setMode] = useState<"signup" | "login">("login");
  const [redirectTo, setRedirectTo] = useState<string>("/");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({
    type: "idle",
    message: "",
  });

  // Avoid using next/navigation hooks at build/prerender time -- read params on client
  useEffect(() => {
    const searchParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    if (!searchParams) return;
    const rawMode = searchParams.get("mode");
    setMode(rawMode === "signup" ? "signup" : "login");
    const rawRedirect = searchParams.get("redirect") ?? null;
    setRedirectTo(sanitizeRedirect(rawRedirect));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;
      if (!isSupabaseConfigured) {
        setSubmitStatus({
          type: "error",
          message:
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        });
        return;
      }

      const form = event.currentTarget;
      const formData = new FormData(form);

      const normalize = (value: FormDataEntryValue | null) =>
        typeof value === "string"
          ? value.trim()
          : value
          ? String(value).trim()
          : "";

      const email = normalize(formData.get("email"));
      const name = normalize(formData.get("name")) || null;
      const password = normalize(formData.get("password"));

      if (!email || !password) {
        setSubmitStatus({
          type: "error",
          message: "Email and password are required.",
        });
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus({
        type: "info",
        message:
          mode === "signup" ? "Creating your account..." : "Signing you in...",
      });

      try {
        let sessionToken: string | null = null;
        const supabase = getSupabaseClient();

        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: name ? { full_name: name } : undefined,
            },
          });

          if (error) {
            throw error;
          }

          sessionToken = data.session?.access_token ?? null;

          if (!sessionToken) {
            setSubmitStatus({
              type: "success",
              message:
                "Account created! Check your email to verify before signing in.",
            });
            setIsSubmitting(false);
            return;
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          sessionToken = data.session?.access_token ?? null;
        }

        recordUserLogin({
          email,
          name,
          mode,
          sessionToken: sessionToken ?? undefined,
        });

        setSubmitStatus({
          type: "success",
          message: "Success! Redirecting you...",
        });

        const target = redirectTo || "/";
        setTimeout(() => {
          try {
            window.location.assign(target);
          } catch {
            window.location.href = target;
          }
        }, 400);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong while contacting Supabase.";
        setSubmitStatus({
          type: "error",
          message,
        });
        setIsSubmitting(false);
      }
    },
    [isSubmitting, mode, redirectTo]
  );

  const submitLabel = mode === "signup" ? "Create account" : "Sign in";
  const switchHref =
    mode === "signup"
      ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : `/auth/login?mode=signup&redirect=${encodeURIComponent(redirectTo)}`;
  const switchLabel =
    mode === "signup" ? "Already have an account?" : "Need an account?";
  const switchCta = mode === "signup" ? "Sign in" : "Create one";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950" />
      <div className="absolute inset-0 opacity-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_rgba(15,23,42,0))]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center px-4 py-12 sm:px-8">
        <div className="mx-auto flex w-full flex-col items-center gap-10 md:flex-row md:justify-center">
          <div className="hidden md:flex md:w-[50vw] md:justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gaia-intro-1.png"
              onError={(event) => {
                const el = event.currentTarget as HTMLImageElement;
                el.src = "/gaia-intro.png";
              }}
              alt="GAIA"
              className="w-[22vw] max-w-[360px] min-w-[220px] opacity-90"
            />
          </div>

          <div className="w-full md:w-[50vw] md:flex md:justify-center">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/90 p-8 shadow-xl shadow-cyan-500/10 md:max-w-[30vw] md:min-w-[320px]">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-semibold text-white">
                  {submitLabel}
                </h2>
                <p className="text-sm text-slate-400">
                  {mode === "signup"
                    ? "Set your credentials to begin your journey."
                    : "Enter your credentials to continue."}
                </p>
              </div>

              <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                <input type="hidden" name="redirect" value={redirectTo} />

                {mode === "signup" && (
                  <div className="space-y-2 text-left">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-slate-200"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      placeholder="Phoenix Sterling"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/20"
                      autoComplete="name"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-200"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@gaia.network"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/20"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-200"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="********"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/20"
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="relative inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:shadow-cyan-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-80"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "Please wait..." : submitLabel}
                </button>

                {submitStatus.message && (
                  <p
                    className={`text-sm ${
                      submitStatus.type === "error"
                        ? "text-rose-300"
                        : submitStatus.type === "success"
                        ? "text-emerald-300"
                        : "text-slate-400"
                    }`}
                  >
                    {submitStatus.message}
                  </p>
                )}
              </form>

              <div className="mt-8 space-y-3 text-center text-sm text-slate-400">
                <p>
                  {switchLabel}{" "}
                  <Link
                    href={switchHref}
                    className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                  >
                    {switchCta}
                  </Link>
                </p>
                <p>
                  <Link
                    href="mailto:support@gaia.network"
                    className="transition hover:text-cyan-200"
                  >
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
