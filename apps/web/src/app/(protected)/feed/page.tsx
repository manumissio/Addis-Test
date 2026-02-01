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
  const [stats, setStats] = useState({ totalProposals: 0, capitalAligned: 0 });
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");

  const loadFeed = useCallback(async (currentOffset: number, append: boolean) => {
    try {
      setError("");
      const [feedData, statsData] = await Promise.all([
        api<{ ideas: FeedIdea[]; likedIdeaIds: number[] }>(
          `/api/ideas?limit=${PAGE_SIZE}&offset=${currentOffset}`
        ),
        api<{ totalProposals: number; capitalAligned: number }>("/api/system/stats"),
      ]);

      if (append) {
        setIdeas((prev) => [...prev, ...feedData.ideas]);
      } else {
        setIdeas(feedData.ideas);
      }
      
      setStats(statsData);

      setLikedIds((prev) => {
        const next = new Set(prev);
        for (const id of feedData.likedIdeaIds) next.add(id);
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Feed Layout: Two-Column Discovery */}
      <div className="grid gap-12 lg:grid-cols-12">
        
        {/* Main Content: Idea Feed (65%) */}
        <div className="lg:col-span-8 space-y-10">
          <div className="mb-10 flex items-center justify-between border-b-8 border-addis-orange pb-6">
            <div>
              <h1 className="text-4xl font-black text-addis-dark dark:text-white uppercase tracking-tight">Innovation Feed</h1>
              <p className="mt-2 text-[10px] font-black text-addis-green uppercase tracking-[0.4em]">Live proposals in the network</p>
            </div>
            <Link
              href="/ideas/new"
              className="btn-addis-orange px-8 py-3 text-[11px] shadow-xl"
            >
              PROPOSE IDEA
            </Link>
          </div>

          {ideas.length === 0 ? (
            <div className="rounded-sm border-2 border-dashed border-gray-100 dark:border-white/5 p-24 text-center">
              <p className="text-sm font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">No active nodes in system.</p>
              <Link
                href="/ideas/new"
                className="mt-6 inline-block btn-addis-green px-10 py-3 text-[11px] shadow-lg"
              >
                PROPOSE FIRST NODE
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                />
              ))}
            </div>
          )}

          {hasMore && ideas.length > 0 && (
            <div className="flex justify-center py-12">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-addis-dark px-12 py-4 text-[11px] font-black text-addis-dark dark:text-white uppercase tracking-[0.2em] shadow-xl hover:border-addis-orange transition-all disabled:opacity-50"
              >
                {loadingMore ? "SYNCING..." : "LOAD MORE NODES"}
              </button>
            </div>
          )}
        </div>

        {/* Tactical Sidebar (35%) */}
        <aside className="lg:col-span-4 space-y-10">
          {/* Network Pulse Module */}
          <section className="bg-card-bg p-10 shadow-2xl rounded-sm border-t-8 border-addis-blue transition-colors relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:invert">
                <img src="/images/logo.png" className="h-20 grayscale" alt="" />
             </div>
             <h2 className="mb-8 text-[11px] font-black text-addis-dark dark:text-white uppercase tracking-[0.4em] border-b border-addis-dark/5 pb-2">Network Pulse</h2>
             <div className="space-y-8 relative z-10">
                <div className="flex items-end justify-between">
                   <div>
                      <span className="block text-4xl font-black text-addis-dark dark:text-white tabular-nums leading-none">{stats.totalProposals}</span>
                      <span className="text-[9px] font-black text-addis-blue uppercase tracking-widest mt-2 block">Active Proposals</span>
                   </div>
                   <div className="h-10 w-1 bg-addis-blue/20 rounded-full" />
                </div>
                
                <div className="flex items-end justify-between">
                   <div>
                      <span className="block text-4xl font-black text-addis-green tabular-nums leading-none">{stats.capitalAligned}</span>
                      <span className="text-[9px] font-black text-addis-green uppercase tracking-widest mt-2 block">Capital Aligned</span>
                   </div>
                   <div className="h-10 w-1 bg-addis-green/20 rounded-full" />
                </div>
             </div>
          </section>

          {/* Trending Strategic Areas */}
          <section className="bg-card-bg p-10 shadow-xl border-t-4 border-addis-green transition-colors">
             <h2 className="mb-8 text-[11px] font-black text-addis-dark dark:text-white uppercase tracking-[0.4em]">Strategic Focus</h2>
             <div className="flex flex-wrap gap-3">
                {["Sustainability", "AgriTech", "Urban", "Education", "Health"].map(tag => (
                  <Link key={tag} href={`/discover?topic=${tag}`} className="text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-addis-orange uppercase tracking-widest transition-all border-b-2 border-gray-100 dark:border-white/5 pb-1 hover:border-addis-orange">
                    #{tag}
                  </Link>
                ))}
             </div>
          </section>

          {/* System Announcements */}
          <section className="bg-card-bg p-10 shadow-xl border-l-8 border-addis-yellow transition-colors relative">
             <div className="mb-6 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-addis-yellow animate-pulse" />
                <h2 className="text-[11px] font-black text-addis-dark dark:text-white uppercase tracking-[0.4em]">Announcements</h2>
             </div>
             <p className="text-[13px] font-medium leading-relaxed text-gray-600 dark:text-gray-300 italic">
                "Project funding available for renewable energy proposals in the Addis Ababa region. Contact @impact_fund for details."
             </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
