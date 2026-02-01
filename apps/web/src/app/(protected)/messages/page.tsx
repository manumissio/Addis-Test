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
  return (
    <div className="flex h-full items-center justify-center p-8 text-center bg-white dark:bg-addis-dark/50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xs space-y-6"
      >
        <div className="mx-auto rounded-full bg-gray-50 dark:bg-white/5 p-10 ring-8 ring-gray-50/50 dark:ring-white/5 shadow-inner">
          <svg className="h-12 w-12 text-addis-orange/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-black text-addis-dark dark:text-white uppercase tracking-tighter">Communication Hub</h2>
          <p className="mt-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] leading-relaxed">
            Select a contact from the sidebar to initialize a secure conversation link.
          </p>
        </div>
      </motion.div>
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
