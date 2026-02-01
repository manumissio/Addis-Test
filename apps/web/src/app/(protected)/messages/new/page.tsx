"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export default function NewMessagePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const recipientId = searchParams.get("to");
  const recipientUsername = searchParams.get("username") ?? "User";

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!recipientId) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No recipient specified.</p>
      </div>
    );
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) return;

    setError("");
    setSending(true);
    try {
      const data = await api<{ threadId: number }>(`/api/messages/send/${recipientId}`, {
        method: "POST",
        body: { content: trimmed },
      });
      // Navigate to the thread
      router.push(`/messages/${data.threadId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message");
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        Message {recipientUsername}
      </h1>

      <form onSubmit={handleSend} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder={`Write a message to ${recipientUsername}...`}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="rounded-md bg-addis-orange px-6 py-2 text-sm font-medium text-white hover:bg-addis-orange/90 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
