"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { passwordSchema } from "@addis/shared";

type Step = "request" | "reset" | "done";

export default function PasswordResetPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api("/api/auth/password-reset/request", {
        method: "POST",
        body: { email },
      });
      setStep("reset");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/auth/password-reset/confirm", {
        method: "POST",
        body: { email, tempPassword, newPassword },
      });
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-addis-orange">Addis Ideas</h1>
          <p className="mt-2 text-sm text-gray-600">Reset your password</p>
        </div>

        {step === "request" && (
          <form onSubmit={handleRequest} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <p className="text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a temporary
              password.
            </p>
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-addis-orange px-4 py-2 text-sm font-medium text-white hover:bg-addis-orange/90 disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send temporary password"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <p className="text-sm text-gray-600">
              Check your email for a temporary password, then set a new one
              below.
            </p>
            <input
              type="text"
              required
              placeholder="Temporary password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            <input
              type="password"
              required
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-addis-green px-4 py-2 text-sm font-medium text-white hover:bg-addis-green/90 disabled:opacity-50"
            >
              {submitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Your password has been reset successfully.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-md bg-addis-green px-6 py-2 text-sm font-medium text-white hover:bg-addis-green/90"
            >
              Go to Login
            </Link>
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-addis-orange hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
