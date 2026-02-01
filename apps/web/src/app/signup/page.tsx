"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-addis-dark px-4 py-12">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -right-24 h-96 w-96 rounded-full bg-addis-orange/10 blur-3xl" />
        <div className="absolute bottom-1/4 -left-24 h-96 w-96 rounded-full bg-addis-green/10 blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="overflow-hidden rounded-sm bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-addis-dark/90 border-t-8 border-addis-green">
          <div className="p-8 sm:p-12">
            <div className="mb-10 text-center">
              <Link href="/">
                <img src="/images/logo.png" alt="Addis Ideas" className="mx-auto h-12 w-auto brightness-0" />
              </Link>
              <h2 className="mt-6 text-[11px] font-black tracking-[0.3em] text-addis-orange uppercase">Create an Account</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {serverError && (
                <div className="border-l-4 border-addis-red bg-red-50 p-4 text-[11px] font-bold uppercase text-red-700">
                  {serverError}
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  id="username"
                  label="Username"
                  placeholder="USERNAME"
                  value={form.username}
                  error={errors.username}
                  onChange={(v) => updateField("username", v)}
                />
                <Field
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="EMAIL"
                  value={form.email}
                  error={errors.email}
                  onChange={(v) => updateField("email", v)}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label="First Name"
                  placeholder="FIRST NAME"
                  value={form.firstName}
                  onChange={(v) => updateField("firstName", v)}
                />
                <Field
                  id="lastName"
                  label="Last Name"
                  placeholder="LAST NAME"
                  value={form.lastName}
                  onChange={(v) => updateField("lastName", v)}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  error={errors.password}
                  onChange={(v) => updateField("password", v)}
                  hint="Min 8 chars, letter + number"
                  showToggle
                  onToggle={() => setShowPassword(!showPassword)}
                  isToggled={showPassword}
                />
                <Field
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  error={errors.confirmPassword}
                  onChange={(v) => updateField("confirmPassword", v)}
                  showToggle
                  onToggle={() => setShowPassword(!showPassword)}
                  isToggled={showPassword}
                />
              </div>

              <Field
                id="referral"
                label="Referral Source"
                placeholder="HOW DID YOU HEAR ABOUT US?"
                value={form.referral}
                onChange={(v) => updateField("referral", v)}
              />

              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-sm border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                  By registering, you agree to our{" "}
                  <Link href="/terms" className="text-addis-orange hover:text-addis-yellow transition-colors">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/guidelines"
                    className="text-addis-orange hover:text-addis-yellow transition-colors"
                  >
                    Guidelines
                  </Link>
                  .
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-addis-orange w-full py-4 text-xs tracking-widest shadow-xl disabled:opacity-50"
              >
                {submitting ? "CREATING..." : "CREATE ACCOUNT"}
              </button>
            </form>
          </div>

          <div className="bg-gray-50/50 dark:bg-white/5 py-6 text-center border-t border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              Already a Member? <Link href="/login" className="text-addis-green hover:text-addis-yellow transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  value,
  error,
  hint,
  onChange,
  showToggle,
  onToggle,
  isToggled,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  error?: string;
  hint?: string;
  onChange: (value: string) => void;
  showToggle?: boolean;
  onToggle?: () => void;
  isToggled?: boolean;
}) {
  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={id} className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showToggle ? (isToggled ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border-2 bg-gray-50 px-4 py-2.5 text-sm font-bold tracking-tight text-gray-900 placeholder-gray-300 focus:bg-white focus:outline-none transition-all ${
            error
              ? "border-addis-red focus:border-addis-red"
              : "border-gray-100 focus:border-addis-orange"
          } ${showToggle ? "pr-12" : ""}`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-addis-orange transition-colors"
          >
            {isToggled ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-[9px] font-black uppercase text-addis-red tracking-tight">{error}</p>}
      {hint && !error && <p className="text-[9px] font-black uppercase text-gray-300 tracking-tight">{hint}</p>}
    </div>
  );
}
