"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    <div className="space-y-10">
      {/* Search Terminal Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-sm bg-addis-dark px-6 py-16 text-center text-white shadow-2xl border-t-8 border-addis-blue"
      >
        {/* Background Polish */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-addis-blue/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-addis-orange/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Explore Ideas</h1>
          <p className="mt-2 text-xs font-bold text-addis-silver uppercase tracking-[0.4em]">Search all proposals</p>

          {/* High-Fidelity Search Form */}
          <div className="mx-auto mt-12 flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0 overflow-hidden shadow-2xl">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="KEYWORDS..."
                className="w-full border-0 bg-white dark:bg-addis-dark/80 px-6 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-addis-blue/20 transition-all"
              />
            </div>
            <div className="w-full sm:w-48 relative border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-white/10">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="TOPIC..."
                className="w-full border-0 bg-white dark:bg-addis-dark/80 px-6 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-addis-blue/20 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-addis-blue px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-addis-orange transition-all active:scale-95 disabled:opacity-50 shadow-inner"
            >
              {loading ? "SEARCHING..." : "SEARCH"}
            </button>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-4">
             <button onClick={() => { setTopic("Sustainability"); handleSearch(); }} className="text-[9px] font-black text-white/40 hover:text-addis-orange transition-colors uppercase tracking-widest border-b border-white/10 pb-0.5">#Sustainability</button>
             <button onClick={() => { setTopic("Technology"); handleSearch(); }} className="text-[9px] font-black text-white/40 hover:text-addis-orange transition-colors uppercase tracking-widest border-b border-white/10 pb-0.5">#Technology</button>
             <button onClick={() => { setTopic("Infrastructure"); handleSearch(); }} className="text-[9px] font-black text-white/40 hover:text-addis-orange transition-colors uppercase tracking-widest border-b border-white/10 pb-0.5">#Infrastructure</button>
          </div>
        </div>
      </motion.div>

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
