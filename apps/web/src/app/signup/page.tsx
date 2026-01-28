"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { registerSchema } from "@addis/shared";

export default function SignupPage() {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    email: "",
    referral: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    setErrors({});

    // Client-side validation
    const fieldErrors: Record<string, string> = {};

    if (form.password !== form.confirmPassword) {
      fieldErrors.confirmPassword = "Passwords do not match";
    }

    const parsed = registerSchema.safeParse({
      username: form.username,
      password: form.password,
      email: form.email,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      referral: form.referral || undefined,
    });

    if (!parsed.success) {
      for (const [key, messages] of Object.entries(
        parsed.error.flatten().fieldErrors
      )) {
        fieldErrors[key] = messages?.[0] ?? "Invalid";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register(parsed.data!);
      router.push("/feed");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-addis-orange">Addis Ideas</h1>
          <p className="mt-2 text-sm text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Field
            id="username"
            placeholder="Username"
            value={form.username}
            error={errors.username}
            onChange={(v) => updateField("username", v)}
          />
          <Field
            id="firstName"
            placeholder="First name"
            value={form.firstName}
            onChange={(v) => updateField("firstName", v)}
          />
          <Field
            id="lastName"
            placeholder="Last name"
            value={form.lastName}
            onChange={(v) => updateField("lastName", v)}
          />
          <Field
            id="password"
            type="password"
            placeholder="Password"
            value={form.password}
            error={errors.password}
            onChange={(v) => updateField("password", v)}
            hint="At least 8 characters with a letter and a number."
          />
          <Field
            id="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(v) => updateField("confirmPassword", v)}
          />
          <Field
            id="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            error={errors.email}
            onChange={(v) => updateField("email", v)}
          />
          <Field
            id="referral"
            placeholder="How did you hear about us?"
            value={form.referral}
            onChange={(v) => updateField("referral", v)}
          />

          <p className="text-xs text-gray-500">
            By registering, you agree to our{" "}
            <Link href="/terms" className="text-addis-orange hover:underline">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/guidelines"
              className="text-addis-orange hover:underline"
            >
              Community Guidelines
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-addis-orange px-4 py-2 text-sm font-medium text-white hover:bg-addis-orange/90 focus:outline-none focus:ring-2 focus:ring-addis-orange focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <div>
            <Link href="/login" className="text-addis-orange hover:underline">
              Already have an account? Login
            </Link>
          </div>
          <div>
            <a
              href="mailto:info@addisideas.org?Subject=I'm%20having%20trouble!"
              className="text-gray-500 hover:underline"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  type = "text",
  placeholder,
  value,
  error,
  hint,
  onChange,
}: {
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  error?: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-400"
            : "border-gray-300 focus:border-addis-orange focus:ring-addis-orange"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
