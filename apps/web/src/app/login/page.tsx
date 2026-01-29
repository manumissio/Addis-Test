"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/images/logo.png" alt="Addis Ideas" className="mx-auto h-16 w-auto" />
          <p className="mt-4 text-sm text-gray-600">
            Login using your username and password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-addis-green px-4 py-2 text-sm font-medium text-white hover:bg-addis-green/90 focus:outline-none focus:ring-2 focus:ring-addis-green focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <div>
            <Link
              href="/password-reset"
              className="text-addis-orange hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div>
            <Link href="/signup" className="text-addis-orange hover:underline">
              Not a member? Sign up
            </Link>
          </div>
          <div>
            <a
              href="mailto:info@addisideas.org?Subject=I'm%20having%20trouble!"
              className="text-gray-500 hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
