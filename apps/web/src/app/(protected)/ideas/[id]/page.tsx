"use client";

import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiError, getAssetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type IdeaDetail = {
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
  creatorId: number;
  creatorUsername: string;
  creatorImageUrl: string | null;
};

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  username: string;
  profileImageUrl: string | null;
};

type Collaborator = {
  userId: number;
  isAdmin: boolean;
  joinedAt: string;
  username: string;
  profileImageUrl: string | null;
};

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const { user } = useAuth();

  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [addressedTo, setAddressedTo] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [liked, setLiked] = useState(false);
  const [collaborating, setCollaborating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);

  // Comment form
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadIdea = useCallback(async () => {
    try {
      const [ideaData, commentsData, collabData] = await Promise.all([
        api<{
          idea: IdeaDetail;
          topics: { topicName: string }[];
          addressedTo: { stakeholder: string }[];
          isLiked: boolean;
          isCollaborating: boolean;
        }>(`/api/ideas/${ideaId}`),
        api<{ comments: Comment[] }>(`/api/ideas/${ideaId}/comments?limit=50&offset=0`),
        api<{ collaborators: Collaborator[] }>(`/api/ideas/${ideaId}/collaborators`),
      ]);

      setIdea(ideaData.idea);
      setTopics(ideaData.topics.map((t) => t.topicName));
      setAddressedTo(ideaData.addressedTo.map((a) => a.stakeholder));
      setLiked(ideaData.isLiked);
      setCollaborating(ideaData.isCollaborating);
      setComments(commentsData.comments);
      setCollaborators(collabData.collaborators);
    } catch {
      setError("Failed to load idea");
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  useEffect(() => {
    loadIdea();
  }, [loadIdea]);

  async function handleLike() {
    setIsLiking(true);
    try {
      if (liked) {
        await api(`/api/ideas/${ideaId}/like`, { method: "DELETE" });
        setLiked(false);
        setIdea((prev) =>
          prev ? { ...prev, likesCount: Math.max(0, prev.likesCount - 1) } : prev
        );
      } else {
        await api(`/api/ideas/${ideaId}/like`, { method: "POST" });
        setLiked(true);
        setIdea((prev) =>
          prev ? { ...prev, likesCount: prev.likesCount + 1 } : prev
        );
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const fresh = await api<{
          idea: IdeaDetail;
          isLiked: boolean;
          isCollaborating: boolean;
        }>(`/api/ideas/${ideaId}`);
        setIdea(fresh.idea);
        setLiked(fresh.isLiked);
        setCollaborating(fresh.isCollaborating);
      }
    } finally {
      setIsLiking(false);
    }
  }

  async function handleCollaborate() {
    setIsCollaborating(true);
    try {
      if (collaborating) {
        await api(`/api/ideas/${ideaId}/collaborate`, { method: "DELETE" });
        setCollaborating(false);
        setIdea((prev) =>
          prev ? { ...prev, collaboratorsCount: Math.max(0, prev.collaboratorsCount - 1) } : prev
        );
        setCollaborators((prev) => prev.filter((c) => c.userId !== user?.id));
      } else {
        await api(`/api/ideas/${ideaId}/collaborate`, { method: "POST" });
        setCollaborating(true);
        setIdea((prev) =>
          prev ? { ...prev, collaboratorsCount: prev.collaboratorsCount + 1 } : prev
        );
        if (user) {
          setCollaborators((prev) => [
            ...prev,
            {
              userId: user.id,
              isAdmin: false,
              joinedAt: new Date().toISOString(),
              username: user.username,
              profileImageUrl: null,
            },
          ]);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const [fresh, collabData] = await Promise.all([
          api<{ idea: IdeaDetail; isLiked: boolean; isCollaborating: boolean }>(`/api/ideas/${ideaId}`),
          api<{ collaborators: Collaborator[] }>(`/api/ideas/${ideaId}/collaborators`),
        ]);
        setIdea(fresh.idea);
        setLiked(fresh.isLiked);
        setCollaborating(fresh.isCollaborating);
        setCollaborators(collabData.collaborators);
      }
    } finally {
      setIsCollaborating(false);
    }
  }

  async function handlePostComment(e: FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setCommentError("");
    setPostingComment(true);
    try {
      await api(`/api/ideas/${ideaId}/comments`, {
        method: "POST",
        body: { content: trimmed },
      });
      setCommentText("");
      const data = await api<{ comments: Comment[] }>(
        `/api/ideas/${ideaId}/comments?limit=50&offset=0`
      );
      setComments(data.comments);
      setIdea((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev
      );
    } catch (err) {
      setCommentError(
        err instanceof ApiError ? err.message : "Failed to post comment"
      );
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api(`/api/ideas/${ideaId}`, { method: "DELETE" });
      router.push("/feed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete idea");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-addis-orange border-t-transparent" />
      </div>
    );
  }

  if (error || !idea) {
    return <p className="py-12 text-center text-red-600 uppercase font-black text-xs tracking-[0.2em]">{error || "Idea not found"}</p>;
  }

  const isOwner = user?.id === idea.creatorId;
  const location = [idea.locationCity, idea.locationState, idea.locationCountry]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* Immersive Cinematic Hero */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mb-12 h-[500px] w-full overflow-hidden rounded-sm bg-addis-dark shadow-2xl border-t-8 border-addis-orange"
      >
        {idea.imageUrl ? (
          <>
            <img
              src={getAssetUrl(idea.imageUrl)!}
              alt={idea.title}
              className="h-full w-full object-cover opacity-60 mix-blend-luminosity grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-addis-dark via-addis-dark/40 to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center opacity-10 grayscale invert text-white">
             <img src="/images/logo.png" className="h-32 brightness-0 invert" alt="" />
          </div>
        )}

        {/* Floating Header Info */}
        <div className="absolute bottom-0 left-0 w-full p-8 sm:p-16">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1 text-left">
              <div className="mb-6 flex items-center gap-3">
                 <span className="bg-addis-green px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl">PROPOSAL_V1</span>
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] tabular-nums">{new Date(idea.createdAt).toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}</span>
              </div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter sm:text-7xl leading-[0.9]">
                {idea.title}
              </h1>
              {location && (
                <p className="mt-6 text-[11px] font-black text-addis-orange uppercase tracking-[0.4em] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-addis-orange animate-pulse" /> {location}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* War Room Layout: Split Strategy */}
      <div className="grid gap-16 lg:grid-cols-12 px-4 sm:px-0">
        
        {/* LEFT: Strategic Intelligence (65%) */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Executive Summary Module */}
          <section className="bg-card-bg p-10 shadow-2xl border-l-8 border-addis-yellow transition-colors text-left relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 dark:invert">
               <img src="/images/logo.png" className="h-16 grayscale" alt="" />
            </div>
            <h2 className="mb-8 inline-block border-b-2 border-addis-dark/10 text-[12px] font-black text-addis-dark dark:text-white uppercase tracking-[0.4em]">Strategic Summary</h2>
            <div className="whitespace-pre-wrap text-lg leading-[1.8] text-gray-700 dark:text-gray-200 font-medium">
              {idea.description}
            </div>
          </section>

          {/* Strategic Impact Map */}
          <div className="grid gap-10 sm:grid-cols-2 text-left">
            <section className="bg-white dark:bg-addis-dark p-8 shadow-md border-t-2 border-gray-100 dark:border-white/5">
              <h2 className="mb-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Strategic Impact Areas</h2>
              <div className="flex flex-wrap gap-3">
                {topics.map((topic) => (
                  <Link
                    key={topic}
                    href={`/discover?topic=${encodeURIComponent(topic)}`}
                    className="border-2 border-gray-100 dark:border-white/10 bg-white dark:bg-transparent px-5 py-2 text-[10px] font-black text-addis-dark dark:text-white uppercase tracking-widest hover:border-addis-orange transition-all shadow-sm"
                  >
                    #{topic}
                  </Link>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-addis-dark p-8 shadow-md border-t-2 border-gray-100 dark:border-white/5">
              <h2 className="mb-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Governance & Stakeholders</h2>
              <div className="flex flex-wrap gap-3">
                {addressedTo.map((s) => (
                  <span
                    key={s}
                    className="bg-addis-green/10 dark:bg-addis-green/5 px-5 py-2 text-[10px] font-black text-addis-green uppercase tracking-widest border border-addis-green/20 shadow-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Discussion Area */}
          <section className="pt-16 border-t-2 border-gray-100 dark:border-white/5 text-left">
            <div className="flex items-center justify-between mb-10">
               <div>
                 <h2 className="text-lg font-black text-addis-dark dark:text-white uppercase tracking-[0.2em]">Project Discussion</h2>
                 <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Activity Log // {idea.commentsCount} Entries</p>
               </div>
            </div>

            {/* Slick Terminal Input */}
            <form onSubmit={handlePostComment} className="mb-12 bg-white dark:bg-addis-dark p-8 shadow-xl border-2 border-gray-100 dark:border-white/5">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="PROVIDE FEEDBACK OR CONSTRUCTIVE CRITIQUE..."
                className="w-full bg-gray-50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 px-5 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-300 focus:border-addis-orange focus:outline-none transition-all resize-none"
              />
              <div className="mt-6 flex items-center justify-between">
                 <span className="flex items-center gap-2 text-[9px] font-black text-addis-green uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-addis-green animate-pulse" />
                    Verified Connection
                 </span>
                 <button
                  type="submit"
                  disabled={postingComment || !commentText.trim()}
                  className="btn-addis-orange px-10 py-3 text-[11px] shadow-2xl disabled:opacity-50"
                >
                  {postingComment ? "SENDING..." : "POST FEEDBACK"}
                </button>
              </div>
            </form>

            <div className="space-y-10">
              {comments.map((comment) => (
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} key={comment.id} className="flex gap-6 border-b border-gray-50 dark:border-white/5 pb-10 last:border-0 group">
                  <Link href={`/profile/${comment.username}`}>
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-xl dark:ring-addis-dark group-hover:ring-addis-orange transition-all">
                      <img
                        src={getAssetUrl(comment.profileImageUrl) ?? "/images/default_user.jpg"}
                        alt={comment.username}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-4 mb-2">
                      <Link
                        href={`/profile/${comment.username}`}
                        className="text-sm font-black text-addis-dark dark:text-white uppercase tracking-wider hover:text-addis-orange transition-colors"
                      >
                        @{comment.username.toUpperCase()}
                      </Link>
                      <span className="text-[10px] font-black text-gray-300 dark:text-white/10 uppercase tabular-nums">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[15px] font-medium leading-[1.6] text-gray-600 dark:text-gray-300 whitespace-pre-wrap max-w-2xl">
                      {comment.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT: Tactical Control (35%) */}
        <div className="lg:col-span-4 space-y-12 text-left">
          
          {/* Persistent Action Hub */}
          <div className="bg-addis-dark p-10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border-t-8 border-addis-blue lg:sticky lg:top-24 z-20">
             <div className="space-y-5">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`w-full py-5 text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 ${
                    liked
                      ? "bg-addis-orange text-white ring-4 ring-addis-orange/20"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <svg className="h-5 w-5" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {liked ? "ENDORSED" : "ENDORSE PROPOSAL"}
                </button>

                {!isOwner && (
                  <button
                    onClick={handleCollaborate}
                    disabled={isCollaborating}
                    className={`w-full py-5 text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 ${
                      collaborating
                        ? "bg-addis-green text-white ring-4 ring-addis-green/20"
                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    <svg className="h-5 w-5" fill={collaborating ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {collaborating ? "TEAM_ACTIVE" : "JOIN PROJECT"}
                  </button>
                )}
             </div>

             {/* Network Stats Overlay */}
             <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                <div className="text-center">
                   <span className="block text-2xl font-black text-white tabular-nums">{idea.viewsCount}</span>
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Global Reach</span>
                </div>
                <div className="text-center border-l border-white/10">
                   <span className="block text-2xl font-black text-white tabular-nums">{idea.collaboratorsCount}</span>
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Active Core</span>
                </div>
             </div>

             {isOwner && (
               <div className="mt-10 flex flex-col gap-3">
                  <Link href={`/ideas/${idea.id}/edit`} className="text-center bg-white/5 hover:bg-white/10 py-4 text-[10px] font-black text-white/60 uppercase tracking-[0.2em] transition-colors border border-white/5 shadow-inner">
                    Project Settings
                  </Link>
                  <button onClick={() => setShowDeleteConfirm(true)} className="py-2 text-[9px] font-black text-addis-red/40 hover:text-addis-red uppercase tracking-widest transition-colors">
                    Remove Proposal
                  </button>
               </div>
             )}
          </div>

          {/* Project Team */}
          <section className="bg-white dark:bg-addis-dark p-10 shadow-xl border-t-4 border-addis-green transition-colors">
            <h2 className="mb-8 text-[11px] font-black text-addis-dark dark:text-white uppercase tracking-[0.4em]">Project Team</h2>
            <div className="space-y-6">
              <Link href={`/profile/${idea.creatorUsername}`} className="flex items-center gap-5 group bg-gray-50 dark:bg-white/5 p-4 rounded-sm border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full ring-4 ring-addis-orange ring-offset-4 dark:ring-offset-addis-dark bg-white">
                   <img src={getAssetUrl(idea.creatorImageUrl) ?? "/images/default_user.jpg"} className="h-full w-full object-cover" alt="" />
                </div>
                <div className="flex flex-col">
                   <span className="text-xs font-black text-addis-dark dark:text-white uppercase tracking-tight group-hover:text-addis-orange transition-colors">@{idea.creatorUsername.toUpperCase()}</span>
                   <span className="text-[9px] font-black text-addis-orange uppercase tracking-widest mt-0.5">Project Director</span>
                </div>
              </Link>

              <div className="grid grid-cols-4 gap-3 pt-4">
                {collaborators.filter(c => !c.isAdmin).map((collab) => (
                  <Link key={collab.userId} href={`/profile/${collab.username}`} title={collab.username}>
                    <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-gray-100 dark:ring-white/5 ring-offset-2 dark:ring-offset-addis-dark bg-white hover:ring-addis-green transition-all shadow-md">
                       <img src={getAssetUrl(collab.profileImageUrl) ?? "/images/default_user.jpg"} className="h-full w-full object-cover" alt="" />
                    </div>
                  </Link>
                ))}
                {!collaborating && !isOwner && (
                  <button onClick={handleCollaborate} className="h-12 w-12 rounded-full border-2 border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-addis-green hover:border-addis-green transition-all group">
                    <span className="text-xl font-bold group-hover:scale-125 transition-transform">+</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Strategic Partners (Sponsors) */}
          <section className="bg-white dark:bg-addis-dark p-10 shadow-xl border-t-4 border-addis-blue transition-colors">
             <h2 className="mb-6 text-[11px] font-black text-addis-dark dark:text-white uppercase tracking-[0.4em]">Strategic Partners</h2>
             <div className="flex flex-col items-center justify-center py-10 opacity-20 border-2 border-dashed border-gray-100 dark:border-white/5">
                <img src="/images/sponsor_badge.png" className="h-12 grayscale mb-4" alt="" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center">Awaiting Capital Alignment</p>
             </div>
          </section>
        </div>
      </div>

      {/* Delete confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-addis-dark/90 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-addis-dark max-w-sm w-full p-10 shadow-2xl border-t-8 border-addis-red text-center">
              <h2 className="text-xl font-black text-addis-dark dark:text-white uppercase tracking-tighter mb-4">Confirm Removal</h2>
              <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed uppercase tracking-tight">Are you certain you wish to remove this proposal? This action is permanent and cannot be undone.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDelete} disabled={deleting} className="bg-addis-red py-4 text-[11px] font-black text-white uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50">
                  {deleting ? "REMOVING..." : "CONFIRM REMOVAL"}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
