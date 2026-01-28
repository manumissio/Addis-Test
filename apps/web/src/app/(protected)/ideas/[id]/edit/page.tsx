"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ImageUpload } from "@/components/image-upload";
import { TopicManager } from "@/components/topic-manager";

type IdeaData = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationCountry: string | null;
  creatorId: number;
};

export default function EditIdeaPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;
  const { user } = useAuth();

  const [idea, setIdea] = useState<IdeaData | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [addressedTo, setAddressedTo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadIdea = useCallback(async () => {
    try {
      const data = await api<{
        idea: IdeaData & {
          creatorUsername: string;
          creatorImageUrl: string | null;
          likesCount: number;
          viewsCount: number;
          collaboratorsCount: number;
          commentsCount: number;
          createdAt: string;
        };
        topics: { topicName: string }[];
        addressedTo: { stakeholder: string }[];
      }>(`/api/ideas/${ideaId}`);

      // Verify ownership client-side
      if (user && data.idea.creatorId !== user.id) {
        router.replace(`/ideas/${ideaId}`);
        return;
      }

      setIdea(data.idea);
      setTitle(data.idea.title);
      setDescription(data.idea.description);
      setLocationCity(data.idea.locationCity ?? "");
      setLocationState(data.idea.locationState ?? "");
      setLocationCountry(data.idea.locationCountry ?? "");
      setTopics(data.topics.map((t) => t.topicName));
      setAddressedTo(data.addressedTo.map((a) => a.stakeholder));
    } catch {
      setError("Failed to load idea");
    } finally {
      setLoading(false);
    }
  }, [ideaId, user, router]);

  useEffect(() => {
    if (user) loadIdea();
  }, [user, loadIdea]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaveError("");

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      setSaveError("Title is required");
      return;
    }
    if (!trimmedDesc) {
      setSaveError("Description is required");
      return;
    }

    setSaving(true);
    try {
      await api(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        body: {
          title: trimmedTitle,
          description: trimmedDesc,
          locationCity: locationCity.trim() || null,
          locationState: locationState.trim() || null,
          locationCountry: locationCountry.trim() || null,
        },
      });
      router.push(`/ideas/${ideaId}`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
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

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Edit Idea</h1>

      {/* Image upload */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Idea Image</h2>
        <ImageUpload
          endpoint={`/api/uploads/idea-image/${ideaId}`}
          currentImageUrl={idea.imageUrl}
          onUploaded={(url) => setIdea({ ...idea, imageUrl: url })}
        />
      </section>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-5">
        {saveError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {saveError}
          </div>
        )}

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={500}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">Location</legend>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              maxLength={255}
              placeholder="City"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            <input
              type="text"
              value={locationState}
              onChange={(e) => setLocationState(e.target.value)}
              maxLength={255}
              placeholder="State"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            <input
              type="text"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              maxLength={255}
              placeholder="Country"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
          </div>
        </fieldset>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-addis-orange px-6 py-2 text-sm font-medium text-white hover:bg-addis-orange/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/ideas/${ideaId}`)}
            className="rounded-md border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Topics */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Topics</h2>
        <TopicManager
          topics={topics}
          addEndpoint={`/api/ideas/${ideaId}/topics`}
          deleteEndpoint={(name) =>
            `/api/ideas/${ideaId}/topics/${encodeURIComponent(name)}`
          }
          onUpdate={loadIdea}
          editable
        />
      </section>

      {/* Addressed To */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Addressed To</h2>
        <TopicManager
          topics={addressedTo}
          addEndpoint={`/api/ideas/${ideaId}/addressed-to`}
          deleteEndpoint={(name) =>
            `/api/ideas/${ideaId}/addressed-to/${encodeURIComponent(name)}`
          }
          onUpdate={loadIdea}
          editable
          bodyKey="stakeholder"
          placeholder="Add stakeholder"
          emptyMessage="No stakeholders yet"
          tagClassName="bg-emerald-50 text-emerald-700"
        />
      </section>
    </div>
  );
}
