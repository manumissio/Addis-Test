"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { IdeaCard } from "@/components/idea-card";

type SearchIdea = {
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

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [topic, setTopic] = useState(searchParams.get("topic") ?? "");
  const [ideas, setIdeas] = useState<SearchIdea[]>([]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(
    async (currentOffset: number, append: boolean) => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (topic.trim()) params.set("topic", topic.trim());
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(currentOffset));

      try {
        const data = await api<{ ideas: SearchIdea[]; likedIdeaIds: number[] }>(
          `/api/ideas/search?${params.toString()}`
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
        setSearched(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, topic]
  );

  // Run search when URL params change (including back/forward navigation)
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    const urlTopic = searchParams.get("topic") ?? "";

    // Sync local state with URL
    setQuery(urlQ);
    setTopic(urlTopic);

    if (urlQ || urlTopic) {
      setLoading(true);
      const params = new URLSearchParams();
      if (urlQ) params.set("q", urlQ);
      if (urlTopic) params.set("topic", urlTopic);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", "0");

      api<{ ideas: SearchIdea[]; likedIdeaIds: number[] }>(
        `/api/ideas/search?${params.toString()}`
      ).then((data) => {
        setIdeas(data.ideas);
        setLikedIds(new Set(data.likedIdeaIds));
        setHasMore(data.ideas.length === PAGE_SIZE);
        setOffset(data.ideas.length);
        setSearched(true);
      }).finally(() => setLoading(false));
    } else {
      // Clear results when URL has no params
      setIdeas([]);
      setSearched(false);
    }
  }, [searchParams]);

  function handleSearch() {
    // Update URL params
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (topic.trim()) params.set("topic", topic.trim());
    router.replace(`/discover?${params.toString()}`);

    setLoading(true);
    setOffset(0);
    doSearch(0, false);
  }

  function handleLoadMore() {
    setLoadingMore(true);
    doSearch(offset, true);
  }

  function refreshResults() {
    setLoading(true);
    setOffset(0);
    doSearch(0, false);
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="rounded-xl bg-gradient-to-r from-addis-dark to-addis-blue px-6 py-10 text-center text-white">
        <h1 className="text-3xl font-bold">Discover Ideas</h1>
        <p className="mt-2 text-white/80">Find ideas that inspire you or match your interests</p>

        {/* Search form - grouped controls */}
        <div className="mx-auto mt-8 flex w-full max-w-xl items-stretch overflow-hidden rounded-lg shadow-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search ideas..."
            className="flex-1 border-0 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-addis-orange"
          />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Topic..."
            className="w-32 border-l border-gray-200 px-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-addis-orange sm:w-40"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-addis-orange px-6 py-3 text-sm font-semibold text-white hover:bg-addis-orange/90 disabled:opacity-50"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
        <p className="mt-3 text-sm text-white/70">
          Try searching for <span className="text-white">&quot;community&quot;</span> or <span className="text-white">&quot;sustainability&quot;</span>
        </p>
      </div>

      {/* Active filters */}
      {(query.trim() || topic.trim()) && searched && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Showing results for:</span>
          {query.trim() && (
            <span className="rounded-full bg-gray-100 px-3 py-0.5 text-gray-700">
              &quot;{query.trim()}&quot;
            </span>
          )}
          {topic.trim() && (
            <span className="rounded-full bg-addis-orange/10 px-3 py-0.5 text-addis-orange">
              {topic.trim()}
            </span>
          )}
          <button
            onClick={() => {
              setQuery("");
              setTopic("");
              setIdeas([]);
              setSearched(false);
              router.replace("/discover");
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-addis-orange border-t-transparent" />
        </div>
      ) : searched ? (
        ideas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-gray-500">No ideas found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                liked={likedIds.has(idea.id)}
                onLikeToggle={refreshResults}
              />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-gray-500">
            Search for ideas by title, description, or topic.
          </p>
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
