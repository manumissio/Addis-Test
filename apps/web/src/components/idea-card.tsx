"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiError, getAssetUrl } from "@/lib/api";

type IdeaCardProps = {
  idea: {
    id: number;
    title: string;
    description: string;
    imageUrl: string | null;
    locationCity: string | null;
    locationState: string | null;
    locationCountry: string | null;
    likesCount: number;
    viewsCount: number;
    collaboratorsCount: number;
    commentsCount: number;
    createdAt: string;
    creatorUsername: string;
    creatorImageUrl: string | null;
  };
  liked: boolean;
  onLikeToggle?: () => void;
};

export function IdeaCard({ idea, liked, onLikeToggle }: IdeaCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const location = [idea.locationCity, idea.locationState, idea.locationCountry]
    .filter(Boolean)
    .join(", ");

  async function toggleLike() {
    try {
      if (liked) {
        await api(`/api/ideas/${idea.id}/like`, { method: "DELETE" });
      } else {
        await api(`/api/ideas/${idea.id}/like`, { method: "POST" });
      }
      onLikeToggle?.();
    } catch (err) {
      // Silently handle — user can retry
      if (err instanceof ApiError && err.status === 409) {
        // Already in desired state, still refresh
        onLikeToggle?.();
      }
    }
  }

  // Only calculate relative time after mount to avoid hydration mismatch
  const timeAgo = mounted ? formatTimeAgo(idea.createdAt) : "";

  return (
    <article className="rounded-lg border bg-white p-5 transition-shadow hover:shadow-sm">
      {/* Creator header */}
      <div className="mb-3 flex items-center gap-3">
        <Link
          href={`/profile/${idea.creatorUsername}`}
          className="flex items-center gap-2"
        >
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200">
            <img
              src={getAssetUrl(idea.creatorImageUrl) ?? "/images/default_user.jpg"}
              alt={idea.creatorUsername}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-sm font-medium text-gray-700 hover:text-addis-orange">
            {idea.creatorUsername}
          </span>
        </Link>
        <span className="text-xs text-gray-400">{timeAgo}</span>
      </div>

      {/* Idea content */}
      <Link href={`/ideas/${idea.id}`} className="block">
        <h2 className="text-lg font-semibold text-gray-900 hover:text-addis-orange">
          {idea.title}
        </h2>
        <p className="mt-1 line-clamp-3 text-sm text-gray-600">
          {idea.description}
        </p>
        {idea.imageUrl && (
          <img
            src={getAssetUrl(idea.imageUrl)!}
            alt={idea.title}
            className="mt-3 max-h-64 w-full rounded-md object-cover"
          />
        )}
        {location && (
          <p className="mt-2 text-xs text-gray-400">{location}</p>
        )}
      </Link>

      {/* Stats and actions */}
      <div className="mt-4 flex items-center gap-4 border-t pt-3">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 text-sm ${
            liked
              ? "font-medium text-addis-orange"
              : "text-gray-500 hover:text-addis-orange"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={liked ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {idea.likesCount}
        </button>
        <Link
          href={`/ideas/${idea.id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {idea.commentsCount}
        </Link>
        <span className="flex items-center gap-1 text-sm text-gray-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {idea.viewsCount}
        </span>
        <span className="flex items-center gap-1 text-sm text-gray-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {idea.collaboratorsCount}
        </span>
      </div>
    </article>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 30) {
    return date.toLocaleDateString();
  }
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}
