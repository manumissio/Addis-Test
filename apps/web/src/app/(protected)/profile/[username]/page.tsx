"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TopicManager } from "@/components/topic-manager";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type UserProfile = {
  id: number;
  username: string;
  about: string | null;
  profession: string | null;
  profileImageUrl: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationCountry: string | null;
  createdAt: string;
  ideasCount: number;
  viewsCount: number;
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

      setProfile(profileData.user);
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
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-200">
          {profile.profileImageUrl ? (
            <img
              src={`${API_URL}${profile.profileImageUrl}`}
              alt={profile.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
              {profile.username[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <h1 className="text-xl font-bold">{profile.username}</h1>
            {isOwnProfile ? (
              <Link
                href="/profile/edit"
                className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                Edit Profile
              </Link>
            ) : (
              <Link
                href={`/messages/new?to=${profile.id}&username=${encodeURIComponent(profile.username)}`}
                className="rounded-md bg-addis-orange px-3 py-1 text-xs text-white hover:bg-addis-orange/90"
              >
                Message
              </Link>
            )}
          </div>
          {profile.profession && (
            <p className="mt-1 text-sm text-gray-500">{profile.profession}</p>
          )}
          {location && (
            <p className="mt-1 text-sm text-gray-400">{location}</p>
          )}
          {profile.about && (
            <p className="mt-3 text-sm text-gray-700">{profile.about}</p>
          )}

          <div className="mt-4 flex justify-center gap-6 text-sm sm:justify-start">
            <div>
              <span className="font-semibold">{profile.ideasCount}</span>{" "}
              <span className="text-gray-500">ideas</span>
            </div>
            <div>
              <span className="font-semibold">{profile.viewsCount}</span>{" "}
              <span className="text-gray-500">profile views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topics */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Interests</h2>
        <TopicManager
          topics={topics}
          addEndpoint="/api/users/topics"
          deleteEndpoint={(name) => `/api/users/topics/${encodeURIComponent(name)}`}
          onUpdate={loadProfile}
          editable={isOwnProfile}
        />
      </section>

      {/* Ideas */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Ideas</h2>
        {ideas.length === 0 ? (
          <p className="text-sm text-gray-400">No ideas yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="rounded-lg border p-4 hover:border-addis-orange/50 hover:shadow-sm"
              >
                <h3 className="font-medium">{idea.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {idea.description}
                </p>
                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                  <span>{idea.likesCount} likes</span>
                  <span>{idea.commentsCount} comments</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Collaborations */}
      {collaborations.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Collaborating On</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {collaborations.map((collab) => (
              <Link
                key={collab.id}
                href={`/ideas/${collab.id}`}
                className="rounded-lg border p-4 hover:border-addis-orange/50 hover:shadow-sm"
              >
                <h3 className="font-medium">{collab.title}</h3>
                <p className="mt-1 text-xs text-gray-400">by {collab.creatorUsername}</p>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {collab.description}
                </p>
                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                  <span>{collab.likesCount} likes</span>
                  <span>{collab.commentsCount} comments</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
