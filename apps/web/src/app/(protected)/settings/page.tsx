"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
} from "@addis/shared";

export default function SettingsPage() {
  const { user, refresh } = useAuth();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>

      <UsernameSection currentUsername={user?.username ?? ""} onSuccess={refresh} />
      <EmailSection onSuccess={refresh} />
      <PasswordSection />
    </div>
  );
}

function UsernameSection({
  currentUsername,
  onSuccess,
}: {
  currentUsername: string;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const trimmed = username.trim();
    const parsed = usernameSchema.safeParse(trimmed);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid username");
      return;
    }

    if (trimmed === currentUsername) {
      setError("This is already your username");
      return;
    }

    setSaving(true);
    try {
      await api("/api/users/username", {
        method: "PATCH",
        body: { username: trimmed },
      });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update username");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Username</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={25}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-600">Username updated!</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-addis-orange px-4 py-1.5 text-sm text-white hover:bg-addis-orange/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update Username"}
        </button>
      </form>
    </section>
  );
}

function EmailSection({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const trimmed = email.trim();
    const parsed = emailSchema.safeParse(trimmed);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid email");
      return;
    }

    setSaving(true);
    try {
      await api("/api/users/email", {
        method: "PATCH",
        body: { email: trimmed },
      });
      setSuccess(true);
      setEmail("");
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update email");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Email Address</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter new email address"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-600">Email updated!</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-addis-orange px-4 py-1.5 text-sm text-white hover:bg-addis-orange/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update Email"}
        </button>
      </form>
    </section>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword) {
      setError("Current password is required");
      return;
    }

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await api("/api/auth/password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-600">Password updated!</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-addis-orange px-4 py-1.5 text-sm text-white hover:bg-addis-orange/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update Password"}
        </button>
      </form>
    </section>
  );
}
