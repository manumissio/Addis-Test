"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
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

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const pathname = usePathname();
  const activeThreadId = params.threadId ? parseInt(params.threadId as string) : null;

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

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-addis-dark transition-colors">
      {/* PANE 1: Conversation List (Sidebar) */}
      <aside className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 dark:border-white/5 flex flex-col bg-gray-50/30 dark:bg-black/10 ${activeThreadId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 dark:border-white/5">
          <h1 className="text-xl font-black text-addis-dark dark:text-white uppercase tracking-tighter">Inbox</h1>
          <p className="text-[9px] font-black text-addis-green uppercase tracking-[0.3em] mt-1">Active Communication</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center opacity-20">
               <div className="h-6 w-6 animate-spin rounded-full border-2 border-addis-orange border-t-transparent mx-auto mb-2" />
               <span className="text-[10px] font-black uppercase tracking-widest">Syncing Hub...</span>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-10 text-center opacity-40">
               <p className="text-[10px] font-black uppercase tracking-widest">No active links</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {threads.map((thread) => {
                const isActive = activeThreadId === thread.threadId;
                return (
                  <Link
                    key={thread.threadId}
                    href={`/messages/${thread.threadId}`}
                    className={`flex items-center gap-4 p-5 transition-all relative ${
                      isActive 
                        ? "bg-white dark:bg-white/5 border-l-4 border-addis-orange" 
                        : "hover:bg-white dark:hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-gray-100 dark:ring-white/5 shadow-sm">
                        <img
                          src={getAssetUrl(thread.participant?.profileImageUrl) ?? "/images/default_user.jpg"}
                          alt={thread.participant?.username ?? "User"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-addis-green border-2 border-white dark:border-addis-dark shadow-sm" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-addis-orange' : 'text-addis-dark dark:text-white'}`}>
                          @{thread.participant?.username.toUpperCase() ?? "UNKNOWN"}
                        </span>
                        {thread.lastMessage && (
                          <span className="text-[8px] font-black text-gray-300 dark:text-white/10 uppercase tabular-nums">
                            {formatTimeAgo(thread.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {thread.lastMessage && (
                        <p className={`truncate text-xs font-medium ${isActive ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {thread.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* PANE 2: Active Workspace (Children) */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {children}
      </main>
    </div>
  );
}
