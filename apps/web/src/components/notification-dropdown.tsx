"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api, getAssetUrl } from "@/lib/api";

type Notification = {
  id: number;
  type: "like" | "comment" | "collab_request" | "message" | "profile_view";
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    username: string;
    profileImageUrl: string | null;
  } | null;
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api<{ notifications: Notification[] }>("/api/notifications?limit=10");
      setNotifications(data.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await api<{ count: number }>("/api/notifications/unread-count");
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  // Group notifications
  const actionRequired = notifications.filter(n => ["collab_request", "message"].includes(n.type));
  const generalActivity = notifications.filter(n => !["collab_request", "message"].includes(n.type));

  const NotificationItem = ({ n }: { n: Notification }) => (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 transition-colors ${n.isRead ? "bg-white dark:bg-addis-dark" : "bg-orange-50/30 dark:bg-addis-orange/5"}`}
    >
      <Link
        href={n.link || "#"}
        onClick={() => {
          if (!n.isRead) markAsRead(n.id);
          setIsOpen(false);
        }}
        className="flex gap-3"
      >
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5 ring-2 ring-white dark:ring-white/10 shadow-sm">
          {n.sender?.profileImageUrl ? (
            <img
              src={getAssetUrl(n.sender.profileImageUrl)!}
              alt={n.sender.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-addis-dark dark:bg-white/10 text-[10px] font-black text-white">
              {n.sender?.username.slice(0, 2).toUpperCase() || "??"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-[13px] text-gray-900 dark:text-gray-100 leading-snug">
            <span className="font-black text-addis-dark dark:text-white uppercase tracking-tighter">@{n.sender?.username.toUpperCase() || "SYSTEM"}</span>{" "}
            <span className="font-medium text-gray-600 dark:text-gray-400">{n.message}</span>
          </p>
          <p className="mt-1 text-[9px] font-black text-gray-400 dark:text-white/20 uppercase tracking-tighter tabular-nums">
            {new Date(n.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!n.isRead && (
          <div className="h-2 w-2 shrink-0 rounded-full bg-addis-orange mt-1.5 shadow-sm animate-pulse" />
        )}
      </Link>
    </motion.li>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-addis-green text-[10px] font-bold text-white ring-2 ring-addis-orange">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 origin-top-right rounded-sm bg-card-bg shadow-2xl ring-1 ring-black/10 dark:ring-white/10 focus:outline-none z-[100] overflow-hidden border-t-8 border-addis-orange transition-colors"
          >
            <div className="bg-addis-orange px-4 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Update Stream</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => api("/api/notifications/read-all", { method: "PATCH" }).then(() => { setNotifications(notifications.map(n => ({...n, isRead: true}))); setUnreadCount(0); })}
                    className="text-[10px] font-black text-white/80 hover:text-white transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[30rem] overflow-y-auto bg-[#FFFFF3] dark:bg-addis-dark transition-colors">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {actionRequired.length > 0 && (
                    <div>
                      <div className="bg-addis-green/10 dark:bg-addis-green/5 px-4 py-2 border-b border-addis-green/10">
                        <span className="text-[9px] font-black text-addis-green uppercase tracking-widest flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-addis-green animate-pulse" />
                          High Priority
                        </span>
                      </div>
                      <ul className="divide-y divide-gray-50 dark:divide-white/5">
                        {actionRequired.map(n => <NotificationItem key={n.id} n={n} />)}
                      </ul>
                    </div>
                  )}
                  
                  {generalActivity.length > 0 && (
                    <div>
                      <div className="bg-addis-yellow/10 dark:bg-addis-yellow/5 px-4 py-2 border-b border-addis-yellow/10">
                        <span className="text-[9px] font-black text-addis-orange uppercase tracking-widest flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-addis-yellow" />
                          Network Activity
                        </span>
                      </div>
                      <ul className="divide-y divide-gray-50 dark:divide-white/5">
                        {generalActivity.map(n => <NotificationItem key={n.id} n={n} />)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="rounded-full bg-white dark:bg-white/5 p-4 mb-4 shadow-sm">
                    <svg className="h-8 w-8 text-addis-orange/20 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-xs font-black text-addis-dark dark:text-white uppercase tracking-tighter">System Idle</p>
                  <p className="text-[9px] font-bold text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] mt-1">Listening for signals...</p>
                </div>
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block bg-white dark:bg-black/20 py-4 text-center text-[10px] font-black text-addis-dark dark:text-white/60 hover:bg-addis-orange hover:text-white transition-all uppercase tracking-[0.3em] border-t border-gray-100 dark:border-white/10"
            >
              Access Full Log
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}