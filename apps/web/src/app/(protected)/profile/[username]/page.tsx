"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, getAssetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TopicManager } from "@/components/topic-manager";

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
    <div className="space-y-8 bg-[#FFFFF3] p-8 shadow-sm border-t-8 border-addis-orange">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-md">
          <img
            src={getAssetUrl(profile.profileImageUrl) ?? "/images/default_user.jpg"}
            alt={profile.username}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-addis-dark">{profile.username.toUpperCase()}</h1>
              {profile.profession && (
                <p className="text-sm font-bold text-addis-green uppercase tracking-wide">{profile.profession}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  className="btn-addis-green px-6 py-2 text-sm shadow-sm"
                >
                  EDIT PROFILE
                </Link>
              ) : (
                <Link
                  href={`/messages/new?to=${profile.id}&username=${encodeURIComponent(profile.username)}`}
                  className="btn-addis-orange px-6 py-2 text-sm shadow-sm"
                >
                  SEND MESSAGE
                </Link>
              )}
            </div>
          </div>

          {location && (
            <p className="mt-2 text-sm text-gray-500 font-medium">
              <span className="text-addis-orange">📍</span> {location}
            </p>
          )}

          {profile.about && (
            <div className="mt-4 border-l-4 border-addis-yellow bg-white p-4 shadow-sm italic text-gray-700 leading-relaxed">
              "{profile.about}"
            </div>
          )}

          <div className="mt-6 flex justify-center gap-8 text-center sm:justify-start">
            <div className="border-r border-gray-200 pr-8">
              <span className="block text-2xl font-bold text-addis-dark">{profile.ideasCount}</span>
              <span className="text-xs font-bold text-gray-400 uppercase">Ideas</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-addis-dark">{profile.viewsCount}</span>
              <span className="text-xs font-bold text-gray-400 uppercase">Profile Views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topics */}
      <section className="pt-8 border-t border-gray-100">
        <h2 className="mb-4 inline-block border-b-4 border-addis-green text-sm font-bold text-addis-dark uppercase tracking-widest">
          Interests & Skills
        </h2>
        <TopicManager
          topics={topics}
          addEndpoint="/api/users/topics"
          deleteEndpoint={(name) => `/api/users/topics/${encodeURIComponent(name)}`}
          onUpdate={loadProfile}
          editable={isOwnProfile}
        />
      </section>

      {/* Ideas */}
      <section className="pt-8 border-t border-gray-100">
        <h2 className="mb-6 inline-block border-b-4 border-addis-orange text-sm font-bold text-addis-dark uppercase tracking-widest">
          My Ideas
        </h2>
        {ideas.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">No ideas published yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="group flex flex-col border-l-4 border-addis-yellow bg-white p-5 shadow-sm transition-all hover:bg-orange-50/20 hover:border-addis-orange"
              >
                <h3 className="font-bold text-addis-dark group-hover:text-addis-orange">{idea.title.toUpperCase()}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {idea.description.replace(/<[^>]*>/g, "")}
                </p>
                <div className="mt-4 flex gap-6 text-xs font-bold">
                  <span className="text-addis-orange">❤ {idea.likesCount}</span>
                  <span className="text-addis-green">💬 {idea.commentsCount}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Collaborations */}
      {collaborations.length > 0 && (
        <section className="pt-8 border-t border-gray-100">
          <h2 className="mb-6 inline-block border-b-4 border-addis-yellow text-sm font-bold text-addis-dark uppercase tracking-widest">
            Collaborating On
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {collaborations.map((collab) => (
              <Link
                key={collab.id}
                href={`/ideas/${collab.id}`}
                className="group flex flex-col border-l-4 border-addis-green bg-white p-5 shadow-sm transition-all hover:bg-green-50/20 hover:border-addis-orange"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-addis-dark group-hover:text-addis-orange">{collab.title.toUpperCase()}</h3>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 uppercase">TEAM</span>
                </div>
                <p className="mt-1 text-xs font-bold text-addis-green">BY @{collab.creatorUsername.toUpperCase()}</p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {collab.description.replace(/<[^>]*>/g, "")}
                </p>
                <div className="mt-4 flex gap-6 text-xs font-bold">
                  <span className="text-addis-orange">❤ {collab.likesCount}</span>
                  <span className="text-addis-green">💬 {collab.commentsCount}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
