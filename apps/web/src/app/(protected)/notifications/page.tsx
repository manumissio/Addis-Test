"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, getAssetUrl } from "@/lib/api";

type Notification = {
  id: number;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    username: string;
    profileImageUrl: string | null;
  } | null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const fetchNotifications = async (newOffset: number) => {
    try {
      const data = await api<{ notifications: Notification[] }>(`/api/notifications?limit=${LIMIT}&offset=${newOffset}`);
      if (data.notifications.length < LIMIT) {
        setHasMore(false);
      }
      if (newOffset === 0) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(0);
  }, []);

  const loadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchNotifications(nextOffset);
  };

  const markAsRead = async (id: number) => {
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={async () => {
              await api("/api/notifications/read-all", { method: "PATCH" });
              setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            }}
            className="text-sm font-medium text-addis-orange hover:text-orange-600"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading && offset === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`group relative flex items-start gap-4 rounded-xl p-4 transition-all hover:bg-gray-50 ${
                n.isRead ? "bg-white" : "bg-orange-50/40 ring-1 ring-orange-100/50"
              }`}
            >
              <Link
                href={n.link || "#"}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className="absolute inset-0 z-0"
              />
              
              <div className="relative z-10 h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-white">
                {n.sender?.profileImageUrl ? (
                  <img
                    src={getAssetUrl(n.sender.profileImageUrl)!}
                    alt={n.sender.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-500">
                    {n.sender?.username.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}
              </div>

              <div className="relative z-10 flex-1">
                <p className="text-sm text-gray-900 leading-relaxed">
                  <span className="font-bold">{n.sender?.username || "Someone"}</span>{" "}
                  {n.message}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                   {new Date(n.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {!n.isRead && (
                <div className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full bg-addis-orange shadow-sm" />
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              className="mt-6 w-full rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              See More
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 py-20 px-4 text-center">
          <div className="rounded-full bg-gray-50 p-4 mb-4">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">No notifications yet</h2>
          <p className="mt-1 text-gray-500">When people interact with your ideas, you'll see it here.</p>
        </div>
      )}
    </div>
  );
}
