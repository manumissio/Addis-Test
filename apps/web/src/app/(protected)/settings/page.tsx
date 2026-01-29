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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-2 text-gray-500">Manage your profile information and security preferences.</p>
      </div>

      {/* Notification Banner */}
      {message && (
        <div className={`rounded-md p-4 text-sm ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {message.text}
        </div>
      )}

      {/* Username Card */}
      <UsernameSection
        currentUsername={user?.username ?? ""}
        onSuccess={() => { refresh(); showMessage("success", "Username updated successfully!"); }}
        onError={(msg) => showMessage("error", msg)}
      />

      {/* Email Card */}
      <EmailSection
        onSuccess={() => { refresh(); showMessage("success", "Email updated successfully!"); }}
        onError={(msg) => showMessage("error", msg)}
      />

      {/* Password Card */}
      <PasswordSection
        onSuccess={() => showMessage("success", "Password updated successfully!")}
        onError={(msg) => showMessage("error", msg)}
      />
    </div>
  );
}

function UsernameSection({
  currentUsername,
  onSuccess,
  onError,
}: {
  currentUsername: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = username.trim();
    const parsed = usernameSchema.safeParse(trimmed);
    if (!parsed.success) {
      onError(parsed.error.errors[0]?.message ?? "Invalid username");
      return;
    }

    if (trimmed === currentUsername) {
      onError("This is already your username");
      return;
    }

    setSaving(true);
    try {
      await api("/api/users/username", {
        method: "PATCH",
        body: { username: trimmed },
      });
      onSuccess();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to update username");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Username</h2>
        <p className="text-sm text-gray-500">Your unique identifier on the platform.</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={25}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update"}
          </button>
        </form>
      </div>
    </section>
  );
}

function EmailSection({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = email.trim();
    const parsed = emailSchema.safeParse(trimmed);
    if (!parsed.success) {
      onError(parsed.error.errors[0]?.message ?? "Invalid email");
      return;
    }

    setSaving(true);
    try {
      await api("/api/users/email", {
        method: "PATCH",
        body: { email: trimmed },
      });
      setEmail("");
      onSuccess();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to update email");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Email Address</h2>
        <p className="text-sm text-gray-500">Used for account notifications and recovery.</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              New Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter new email address"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update"}
          </button>
        </form>
      </div>
    </section>
  );
}

function PasswordSection({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!currentPassword) {
      onError("Current password is required");
      return;
    }

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      onError(parsed.error.errors[0]?.message ?? "Invalid password");
      return;
    }

    if (newPassword !== confirmPassword) {
      onError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await api("/api/auth/password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Security</h2>
        <p className="text-sm text-gray-500">Update your password to keep your account secure.</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
