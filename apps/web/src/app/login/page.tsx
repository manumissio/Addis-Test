"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(username, password);
      router.push("/feed");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-addis-dark px-4">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-addis-orange/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-addis-green/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 bg-[url('/images/logo.png')] bg-center bg-no-repeat opacity-[0.02] grayscale" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="overflow-hidden rounded-sm bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-addis-dark/90 border-t-8 border-addis-orange">
          <div className="p-8 sm:p-12">
            <div className="mb-10 text-center">
              <Link href="/">
                <img src="/images/logo.png" alt="Addis Ideas" className="mx-auto h-14 w-auto brightness-0" />
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-4 border-addis-red bg-red-50 p-4 text-[11px] font-bold uppercase text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="username" className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="ENTER USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold tracking-tight text-gray-900 placeholder-gray-300 focus:border-addis-orange focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    Password
                  </label>
                  <Link href="/password-reset" className="text-[9px] font-black text-addis-orange hover:text-addis-yellow transition-colors uppercase">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold tracking-tight text-gray-900 placeholder-gray-300 focus:border-addis-orange focus:bg-white focus:outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-addis-orange transition-colors"
                  >
                    {showPassword ? (
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
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-addis-green w-full py-4 text-xs tracking-widest shadow-xl disabled:opacity-50"
              >
                {submitting ? "VERIFYING..." : "SIGN IN"}
              </button>
            </form>
          </div>

          <div className="bg-gray-50/50 dark:bg-white/5 py-6 text-center border-t border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              New Member? <Link href="/signup" className="text-addis-orange hover:text-addis-yellow transition-colors">Create an Account</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a
            href="mailto:info@addisideas.org"
            className="text-[9px] font-black tracking-widest text-white/20 hover:text-white/40 transition-colors uppercase"
          >
            Support: info@addisideas.org
          </a>
        </div>
      </motion.div>
    </div>
  );
}
