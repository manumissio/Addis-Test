"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ImageUpload } from "@/components/image-upload";
import { updateProfileSchema } from "@addis/shared";

type ProfileData = {
  about: string;
  profession: string;
  locationCity: string;
  locationState: string;
  locationCountry: string;
  profileImageUrl: string | null;
};

export default function ProfileEditPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<ProfileData>({
    about: "",
    profession: "",
    locationCity: "",
    locationState: "",
    locationCountry: "",
    profileImageUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    api<{ user: Record<string, unknown> }>(`/api/users/${encodeURIComponent(user.username)}`)
      .then((data) => {
        const u = data.user;
        setForm({
          about: (u.about as string) ?? "",
          profession: (u.profession as string) ?? "",
          locationCity: (u.locationCity as string) ?? "",
          locationState: (u.locationState as string) ?? "",
          locationCountry: (u.locationCountry as string) ?? "",
          profileImageUrl: (u.profileImageUrl as string) ?? null,
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  function updateField(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsed = updateProfileSchema.safeParse({
      about: form.about || undefined,
      profession: form.profession || undefined,
      locationCity: form.locationCity || null,
      locationState: form.locationState || null,
      locationCountry: form.locationCountry || null,
    });

    if (!parsed.success) {
      setError("Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/users/profile", {
        method: "PATCH",
        body: parsed.data,
      });
      setSuccess("Profile updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageRemove() {
    try {
      await api("/api/uploads/profile-image", { method: "DELETE" });
      setForm((prev) => ({ ...prev, profileImageUrl: null }));
    } catch {
      setError("Failed to remove image");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-addis-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-lg font-bold">Edit Profile</h1>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Profile Picture
        </label>
        <ImageUpload
          endpoint="/api/uploads/profile-image"
          currentImageUrl={form.profileImageUrl}
          onUploaded={(url) => setForm((prev) => ({ ...prev, profileImageUrl: url }))}
          onRemoved={handleImageRemove}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        <div>
          <label htmlFor="about" className="mb-1 block text-sm font-medium text-gray-700">
            About
          </label>
          <textarea
            id="about"
            rows={4}
            maxLength={2000}
            value={form.about}
            onChange={(e) => updateField("about", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
        </div>

        <div>
          <label htmlFor="profession" className="mb-1 block text-sm font-medium text-gray-700">
            Profession
          </label>
          <input
            id="profession"
            type="text"
            maxLength={255}
            value={form.profession}
            onChange={(e) => updateField("profession", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">Location</legend>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="City"
              maxLength={255}
              value={form.locationCity}
              onChange={(e) => updateField("locationCity", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            <input
              type="text"
              placeholder="State"
              maxLength={255}
              value={form.locationState}
              onChange={(e) => updateField("locationState", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            <input
              type="text"
              placeholder="Country"
              maxLength={255}
              value={form.locationCountry}
              onChange={(e) => updateField("locationCountry", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
          </div>
        </fieldset>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-addis-green px-4 py-2 text-sm font-medium text-white hover:bg-addis-green/90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/profile/${user?.username}`)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
