"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { IdeaCard } from "@/components/idea-card";

type FeedIdea = {
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

const PAGE_SIZE = 10;

export default function FeedPage() {
  const [ideas, setIdeas] = useState<FeedIdea[]>([]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");

  const loadFeed = useCallback(async (currentOffset: number, append: boolean) => {
    try {
      setError("");
      const data = await api<{ ideas: FeedIdea[]; likedIdeaIds: number[] }>(
        `/api/ideas?limit=${PAGE_SIZE}&offset=${currentOffset}`
      );

      if (append) {
        setIdeas((prev) => [...prev, ...data.ideas]);
      } else {
        setIdeas(data.ideas);
      }

      setLikedIds((prev) => {
        const next = new Set(prev);
        for (const id of data.likedIdeaIds) next.add(id);
        return next;
      });

      setHasMore(data.ideas.length === PAGE_SIZE);
      setOffset(currentOffset + data.ideas.length);
    } catch {
      setError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(0, false);
  }, [loadFeed]);

  function handleLoadMore() {
    setLoadingMore(true);
    loadFeed(offset, true);
  }

  function refreshFeed() {
    setLoading(true);
    setOffset(0);
    loadFeed(0, false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-addis-orange border-t-transparent" />
      </div>
    );
  }

  if (error && ideas.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-2 text-red-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            loadFeed(0, false);
          }}
          className="text-addis-orange hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Idea Feed</h1>
        <Link
          href="/ideas/new"
          className="rounded-md bg-addis-orange px-4 py-2 text-sm font-medium text-white hover:bg-addis-orange/90"
        >
          Share an Idea
        </Link>
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-gray-500">No ideas yet. Be the first to share one!</p>
          <Link
            href="/ideas/new"
            className="mt-4 inline-block rounded-md bg-addis-orange px-4 py-2 text-sm text-white hover:bg-addis-orange/90"
          >
            Share an Idea
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              liked={likedIds.has(idea.id)}
              onLikeToggle={refreshFeed}
            />
          ))}
        </div>
      )}

      {hasMore && ideas.length > 0 && (
        <div className="flex justify-center py-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-md border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
