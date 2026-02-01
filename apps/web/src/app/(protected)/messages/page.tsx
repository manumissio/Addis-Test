"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="mb-10 border-b-8 border-addis-blue pb-6">
        <h1 className="text-4xl font-black text-addis-dark dark:text-white uppercase tracking-tight">Messages</h1>
        <p className="mt-2 text-[10px] font-black text-addis-green uppercase tracking-[0.4em]">Secure Private Communication</p>
      </div>

      {threads.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-gray-100 dark:border-white/5 py-24 px-4 text-center"
        >
          <div className="rounded-full bg-gray-50 dark:bg-white/5 p-6 mb-6">
            <svg className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-lg font-black text-addis-dark dark:text-white uppercase tracking-tight">No active conversations</h2>
          <p className="mt-2 text-xs font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-widest max-w-[240px]">Start a conversation from a user's profile.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread, index) => (
            <motion.div
              key={thread.threadId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/messages/${thread.threadId}`}
                className="group flex items-center gap-5 p-5 bg-card-bg shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border-l-4 border-transparent hover:border-addis-orange transition-all rounded-sm"
              >
                {/* Avatar with Status */}
                <div className="relative">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-md dark:ring-addis-dark">
                    <img
                      src={getAssetUrl(thread.participant?.profileImageUrl) ?? "/images/default_user.jpg"}
                      alt={thread.participant?.username ?? "User"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-addis-green border-4 border-white dark:border-addis-dark" />
                </div>

                {/* Thread info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-addis-dark dark:text-white uppercase tracking-wider">
                      @{thread.participant?.username.toUpperCase() ?? "UNKNOWN_USER"}
                    </span>
                    {thread.lastMessage && (
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-tighter tabular-nums">
                        {formatTimeAgo(thread.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {thread.lastMessage && (
                    <p className="truncate text-[13px] font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 leading-none">
                      <span className="text-addis-orange/60 font-black text-[10px] mr-1 uppercase">{thread.lastMessage.senderUsername}:</span>
                      {thread.lastMessage.content}
                    </p>
                  )}
                </div>
                
                <div className="text-gray-200 dark:text-white/5 transition-colors group-hover:text-addis-orange">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </motion.div>
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
