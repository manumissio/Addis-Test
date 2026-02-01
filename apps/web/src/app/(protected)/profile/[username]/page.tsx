"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, getAssetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TopicManager } from "@/components/topic-manager";

type UserProfile = {
  id: number;
  username: string;
  role: "user" | "sponsor" | "admin";
  about: string | null;
  profession: string | null;
  profileImageUrl: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationCountry: string | null;
  createdAt: string;
  ideasCount: number;
  viewsCount: number;
  sponsorProfile?: {
    companyName: string;
    website: string | null;
    industry: string | null;
    fundingFocus: string | null;
  } | null;
};

type Idea = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
};

type Collaboration = Idea & {
  creatorUsername: string;
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwnProfile = currentUser?.username === username;

  const loadProfile = useCallback(async () => {
    try {
      const [profileData, ideasData, collabsData, topicsData] = await Promise.all([
        api<{ user: UserProfile }>(`/api/users/${encodeURIComponent(username)}`),
        api<{ ideas: Idea[] }>(`/api/users/${encodeURIComponent(username)}/ideas?limit=20&offset=0`),
        api<{ collaborations: Collaboration[] }>(`/api/users/${encodeURIComponent(username)}/collaborations`),
        api<{ topics: { topicName: string }[] }>(`/api/users/${encodeURIComponent(username)}/topics`),
      ]);

      const profile = profileData.user;

      // If sponsor, fetch their company details
      if (profile.role === "sponsor") {
        try {
          const sponsorData = await api<{ profile: UserProfile["sponsorProfile"] }>(`/api/sponsorships/profile/${encodeURIComponent(username)}`);
          profile.sponsorProfile = sponsorData.profile;
        } catch (e) {
          console.error("Failed to fetch sponsor details", e);
        }
      }

      setProfile(profile);
      setIdeas(ideasData.ideas);
      setCollaborations(collabsData.collaborations);
      setTopics(topicsData.topics.map((t) => t.topicName));
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-addis-orange border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return <p className="py-12 text-center text-red-600">{error || "User not found"}</p>;
  }

  const location = [profile.locationCity, profile.locationState, profile.locationCountry]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-24">
      {/* Cinematic Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-card-bg p-10 shadow-2xl border-t-8 border-addis-orange rounded-sm transition-colors"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-addis-orange/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center gap-10 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full bg-white ring-8 ring-white shadow-xl dark:ring-addis-dark">
              <img
                src={getAssetUrl(profile.profileImageUrl) ?? "/images/default_user.jpg"}
                alt={profile.username}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-addis-green p-2 rounded-full shadow-lg border-4 border-white dark:border-addis-dark">
               <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                 <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                 <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13zM7 13a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd" />
               </svg>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-addis-dark dark:text-white tracking-tighter">
                    {profile.username.toUpperCase()}
                  </h1>
                  {profile.role === "sponsor" && (
                    <motion.img 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      src="/images/sponsor_badge.png" 
                      className="h-10 w-10 shadow-sm" 
                      alt="Verified Sponsor" 
                      title="Verified Sponsor"
                    />
                  )}
                </div>
                {profile.role === "sponsor" ? (
                  <div className="mt-1 flex flex-col items-start">
                    <p className="text-sm font-black text-addis-green uppercase tracking-[0.2em]">
                      {profile.sponsorProfile?.companyName || "VERIFIED SPONSOR"}
                    </p>
                    {profile.sponsorProfile?.industry && (
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{profile.sponsorProfile.industry}</p>
                    )}
                  </div>
                ) : profile.profession && (
                  <p className="mt-1 text-xs font-black text-addis-green uppercase tracking-[0.3em]">
                    {profile.profession}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                {isOwnProfile ? (
                  <Link href="/settings" className="btn-addis-green px-8 py-2.5 text-[11px] shadow-lg">
                    EDIT PROFILE
                  </Link>
                ) : (
                  <Link href={`/messages/new?to=${profile.id}&username=${encodeURIComponent(profile.username)}`} className="btn-addis-orange px-8 py-2.5 text-[11px] shadow-lg">
                    CONTACT EXPERT
                  </Link>
                )}
              </div>
            </div>

            {location && (
              <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">
                <span className="text-addis-orange mr-1">●</span> {location}
              </p>
            )}

            {profile.about && (
              <div className="mt-6 border-l-2 border-addis-yellow bg-white/50 dark:bg-white/5 p-6 backdrop-blur-sm italic text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                "{profile.about}"
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Impact Dashboard Main Body */}
      <div className="grid gap-12 lg:grid-cols-3">
        {/* Sidebar: Interests & Stats */}
        <div className="space-y-10">
          <section className="bg-white dark:bg-addis-dark p-8 shadow-md border-t-4 border-addis-green transition-colors">
            <h2 className="mb-6 text-[10px] font-black text-addis-dark dark:text-white uppercase tracking-[0.3em]">Strategic Focus</h2>
            <TopicManager
              topics={topics}
              addEndpoint="/api/users/topics"
              deleteEndpoint={(name) => `/api/users/topics/${encodeURIComponent(name)}`}
              onUpdate={loadProfile}
              editable={isOwnProfile}
            />
          </section>

          <section className="bg-white dark:bg-addis-dark p-8 shadow-md border-t-4 border-addis-yellow transition-colors">
            <h2 className="mb-6 text-[10px] font-black text-addis-dark dark:text-white uppercase tracking-[0.3em]">Impact Metrics</h2>
            <div className="space-y-6">
              <div>
                <span className="block text-3xl font-black text-addis-dark dark:text-white tabular-nums">{profile.ideasCount}</span>
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Proposals Launched</span>
              </div>
              <div className="h-px bg-gray-100 dark:border-white/5" />
              <div>
                <span className="block text-3xl font-black text-addis-dark dark:text-white tabular-nums">{profile.viewsCount}</span>
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Network Reach</span>
              </div>
            </div>
          </section>
        </div>

        {/* Main Content: Project Portfolio */}
        <div className="lg:col-span-2 space-y-12">
          {/* Active Proposals */}
          <section>
            <div className="mb-8 flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
              <h2 className="text-sm font-black text-addis-dark dark:text-white uppercase tracking-[0.3em]">Project Portfolio</h2>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ideas.length} Active</span>
            </div>
            
            {ideas.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-sm uppercase tracking-widest font-bold">No active proposals in system.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {ideas.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/ideas/${idea.id}`}
                    className="group flex flex-col bg-card-bg p-6 shadow-sm border-l-4 border-addis-orange hover:shadow-xl transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:scale-110 transition-transform">
                       <img src="/images/logo.png" className="h-12 grayscale dark:invert" alt="" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-black text-addis-dark dark:text-white group-hover:text-addis-orange transition-colors tracking-tight text-base mb-2 uppercase">
                        {idea.title}
                      </h3>
                      <p className="line-clamp-2 text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                        {idea.description.replace(/<[^>]*>/g, "")}
                      </p>
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex gap-6 text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-addis-orange">❤ {idea.likesCount} Endorsements</span>
                        <span className="text-addis-green">💬 {idea.commentsCount} Feedback</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Collaborative Network */}
          {collaborations.length > 0 && (
            <section>
              <div className="mb-8 flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
                <h2 className="text-sm font-black text-addis-dark dark:text-white uppercase tracking-[0.3em]">Collaborative Network</h2>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{collaborations.length} Linked</span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {collaborations.map((collab) => (
                  <Link
                    key={collab.id}
                    href={`/ideas/${collab.id}`}
                    className="group flex flex-col bg-card-bg p-6 shadow-sm border-l-4 border-addis-green hover:shadow-xl transition-all relative"
                  >
                    <div className="mb-1 flex items-center justify-between">
                       <span className="text-[9px] font-black text-addis-green uppercase tracking-widest">Team Node</span>
                       <span className="text-[9px] font-black text-gray-300 uppercase tabular-nums">{new Date(collab.createdAt).getFullYear()}</span>
                    </div>
                    <h3 className="font-black text-addis-dark dark:text-white group-hover:text-addis-orange transition-colors tracking-tight text-base mb-1 uppercase">
                      {collab.title}
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Director: @{collab.creatorUsername}</p>
                    <p className="line-clamp-2 text-[12px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                      {collab.description.replace(/<[^>]*>/g, "")}
                    </p>
                    <div className="mt-auto flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                      <span className="text-addis-orange/60">❤ {collab.likesCount}</span>
                      <span className="text-addis-green/60">💬 {collab.commentsCount}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
