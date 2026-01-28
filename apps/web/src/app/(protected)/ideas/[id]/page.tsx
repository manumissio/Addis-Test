"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const { user } = useAuth();

  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [addressedTo, setAddressedTo] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comment form
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadIdea = useCallback(async () => {
    try {
      const [ideaData, commentsData] = await Promise.all([
        api<{
          idea: IdeaDetail;
          topics: { topicName: string }[];
          addressedTo: { stakeholder: string }[];
        }>(`/api/ideas/${ideaId}`),
        api<{ comments: Comment[] }>(`/api/ideas/${ideaId}/comments?limit=50&offset=0`),
      ]);

      setIdea(ideaData.idea);
      setTopics(ideaData.topics.map((t) => t.topicName));
      setAddressedTo(ideaData.addressedTo.map((a) => a.stakeholder));
      setComments(commentsData.comments);
    } catch {
      setError("Failed to load idea");
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  // Check if user has liked this idea
  const checkLiked = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api<{ ideas: unknown[]; likedIdeaIds: number[] }>(
        `/api/ideas?limit=1&offset=0`
      );
      setLiked(data.likedIdeaIds.includes(Number(ideaId)));
    } catch {
      // Non-critical
    }
  }, [user, ideaId]);

  useEffect(() => {
    loadIdea();
    checkLiked();
  }, [loadIdea, checkLiked]);

  async function handleLike() {
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
        // Already in desired state — toggle local state
        setLiked(!liked);
      }
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
      // Reload comments
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
    return <p className="py-12 text-center text-red-600">{error || "Idea not found"}</p>;
  }

  const isOwner = user?.id === idea.creatorId;
  const location = [idea.locationCity, idea.locationState, idea.locationCountry]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Creator header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${idea.creatorUsername}`}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
            {idea.creatorImageUrl ? (
              <img
                src={`${API_URL}${idea.creatorImageUrl}`}
                alt={idea.creatorUsername}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400">
                {idea.creatorUsername[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 hover:text-addis-orange">
              {idea.creatorUsername}
            </span>
            <p className="text-xs text-gray-400">
              {new Date(idea.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Link>

        {isOwner && (
          <div className="flex gap-2">
            <Link
              href={`/ideas/${idea.id}/edit`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Are you sure you want to delete this idea? This cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-4 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Idea content */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
        {location && (
          <p className="mt-1 text-sm text-gray-400">{location}</p>
        )}
      </div>

      {idea.imageUrl && (
        <img
          src={`${API_URL}${idea.imageUrl}`}
          alt={idea.title}
          className="w-full rounded-lg object-cover"
        />
      )}

      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {idea.description}
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Addressed to */}
      {addressedTo.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Addressed to:</p>
          <div className="flex flex-wrap gap-2">
            {addressedTo.map((s) => (
              <span
                key={s}
                className="rounded-full bg-addis-green/10 px-3 py-1 text-xs text-addis-green"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats + actions bar */}
      <div className="flex items-center gap-5 border-y py-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm ${
            liked
              ? "font-medium text-addis-orange"
              : "text-gray-500 hover:text-addis-orange"
          }`}
        >
          <svg
            className="h-5 w-5"
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
          {idea.likesCount} {idea.likesCount === 1 ? "like" : "likes"}
        </button>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          {idea.viewsCount} views
        </span>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {idea.collaboratorsCount} collaborators
        </span>
      </div>

      {/* Comments section */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          Comments ({idea.commentsCount})
        </h2>

        {/* Comment form */}
        <form onSubmit={handlePostComment} className="mb-6">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="Share your thoughts..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
          {commentError && (
            <p className="mt-1 text-xs text-red-600">{commentError}</p>
          )}
          <button
            type="submit"
            disabled={postingComment || !commentText.trim()}
            className="mt-2 rounded-md bg-addis-orange px-4 py-1.5 text-sm text-white hover:bg-addis-orange/90 disabled:opacity-50"
          >
            {postingComment ? "Posting..." : "Post Comment"}
          </button>
        </form>

        {/* Comments list */}
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Link href={`/profile/${comment.username}`}>
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200">
                    {comment.profileImageUrl ? (
                      <img
                        src={`${API_URL}${comment.profileImageUrl}`}
                        alt={comment.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                        {comment.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${comment.username}`}
                      className="text-sm font-medium text-gray-700 hover:text-addis-orange"
                    >
                      {comment.username}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
