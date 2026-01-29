"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, getAssetUrl } from "@/lib/api";

type ThreadSummary = {
  threadId: number;
  participant: {
    userId: number;
    username: string;
    profileImageUrl: string | null;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderUsername: string;
  } | null;
};

export default function MessagesInboxPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      const data = await api<{ threads: ThreadSummary[] }>("/api/messages/threads");
      setThreads(data.threads);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-addis-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Messages</h1>

      {threads.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-gray-500">No conversations yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Visit a user&apos;s profile to send them a message.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {threads.map((thread) => (
            <Link
              key={thread.threadId}
              href={`/messages/${thread.threadId}`}
              className="flex items-center gap-3 p-4 hover:bg-gray-50"
            >
              {/* Avatar */}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                <img
                  src={getAssetUrl(thread.participant?.profileImageUrl) ?? "/images/default_user.jpg"}
                  alt={thread.participant?.username ?? "User"}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Thread info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {thread.participant?.username ?? "Unknown user"}
                  </span>
                  {thread.lastMessage && (
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(thread.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {thread.lastMessage && (
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {thread.lastMessage.senderUsername}: {thread.lastMessage.content}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 7) return date.toLocaleDateString();
  if (diffDay > 0) return `${diffDay}d`;
  if (diffHr > 0) return `${diffHr}h`;
  if (diffMin > 0) return `${diffMin}m`;
  return "now";
}
