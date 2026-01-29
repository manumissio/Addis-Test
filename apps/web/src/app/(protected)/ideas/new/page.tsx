"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { createIdeaSchema } from "@addis/shared";

export default function CreateIdeaPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      locationCity: locationCity.trim() || undefined,
      locationState: locationState.trim() || undefined,
      locationCountry: locationCountry.trim() || undefined,
    };

    // Client-side validation with shared schema
    const parsed = createIdeaSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    try {
      const data = await api<{ idea: { id: number } }>("/api/ideas", {
        method: "POST",
        body: payload,
      });
      router.push(`/ideas/${data.idea.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Failed to create idea. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Share a New Idea</h1>
        <p className="mt-2 text-gray-500">
          Have a spark? Share it with the community to find collaborators and support.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {serverError && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {serverError}
          </div>
        )}

        {/* Section: Basic Details */}
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-lg font-medium text-gray-900">Basic Details</h3>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              placeholder="e.g., Community Garden Project"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your idea, the problem it solves, and who you need..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description[0]}</p>
            )}
          </div>
        </div>

        {/* Section: Location */}
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Location <span className="font-normal text-gray-400">(Optional)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                maxLength={255}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                id="state"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                maxLength={255}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                id="country"
                value={locationCountry}
                onChange={(e) => setLocationCountry(e.target.value)}
                maxLength={255}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
          <Link
            href="/feed"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-addis-orange px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-addis-orange/90 disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish Idea"}
          </button>
        </div>
      </form>
    </div>
  );
}
