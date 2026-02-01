"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <div className="mx-auto max-w-3xl py-10 px-4">
      {/* Professional Header */}
      <div className="mb-12 border-b-8 border-addis-blue pb-8">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl font-black text-addis-dark dark:text-white uppercase tracking-tighter"
        >
          New Proposal
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-xs font-black text-addis-green uppercase tracking-[0.4em]"
        >
          Drafting a solution for the community
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {serverError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-l-4 border-addis-red bg-red-50 p-6 shadow-sm"
          >
            <p className="text-xs font-black text-red-700 uppercase tracking-widest">Error: {serverError}</p>
          </motion.div>
        )}

        {/* Section: Project Details */}
        <section className="bg-card-bg p-8 shadow-2xl border-t-4 border-addis-yellow transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] grayscale dark:invert">
             <img src="/images/logo.png" className="h-24" alt="" />
          </div>
          
          <div className="mb-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-addis-yellow" />
            <h3 className="text-[11px] font-black text-addis-dark dark:text-white uppercase tracking-[0.3em]">Project Overview</h3>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="space-y-2">
              <label htmlFor="title" className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Idea Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
                placeholder="E.G., RENEWABLE ENERGY MICRO-GRID"
                className="w-full border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-addis-dark px-4 py-3 text-sm font-bold text-gray-900 dark:text-white dark:text-white placeholder:text-gray-200 focus:border-addis-orange focus:outline-none transition-all rounded-sm"
              />
              {errors.title && (
                <p className="text-[9px] font-black text-addis-red uppercase tracking-tight">{errors.title[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Detailed Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="DESCRIBE THE PROBLEM, YOUR PROPOSED SOLUTION, AND THE IMPACT IT WILL HAVE..."
                className="w-full border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-addis-dark px-4 py-3 text-sm font-bold text-gray-900 dark:text-white dark:text-white placeholder:text-gray-200 focus:border-addis-orange focus:outline-none transition-all rounded-sm leading-relaxed"
              />
              {errors.description && (
                <p className="text-[9px] font-black text-addis-red uppercase tracking-tight">{errors.description[0]}</p>
              )}
            </div>
          </div>
        </section>

        {/* Section: Regional Focus */}
        <section className="bg-card-bg p-8 shadow-xl border-t-4 border-addis-green transition-colors">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-addis-green" />
            <h3 className="text-[11px] font-black text-addis-dark dark:text-white uppercase tracking-[0.3em]">Geographic Focus</h3>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="city" className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                City / Community
              </label>
              <input
                type="text"
                id="city"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                maxLength={255}
                placeholder="E.G., ADDIS ABABA"
                className="w-full border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-addis-dark px-4 py-3 text-sm font-bold text-gray-900 dark:text-white dark:text-white placeholder:text-gray-200 focus:border-addis-orange focus:outline-none transition-all rounded-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="state" className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Region / State
              </label>
              <input
                type="text"
                id="state"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                maxLength={255}
                placeholder="E.G., OROMIA"
                className="w-full border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-addis-dark px-4 py-3 text-sm font-bold text-gray-900 dark:text-white dark:text-white placeholder:text-gray-200 focus:border-addis-orange focus:outline-none transition-all rounded-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="country" className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Country
              </label>
              <input
                type="text"
                id="country"
                value={locationCountry}
                onChange={(e) => setLocationCountry(e.target.value)}
                maxLength={255}
                placeholder="E.G., ETHIOPIA"
                className="w-full border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-addis-dark px-4 py-3 text-sm font-bold text-gray-900 dark:text-white dark:text-white placeholder:text-gray-200 focus:border-addis-orange focus:outline-none transition-all rounded-sm"
              />
            </div>
          </div>
        </section>

        {/* Tactical Actions */}
        <div className="flex items-center justify-end gap-6 pt-6 border-t border-gray-100 dark:border-white/5">
          <Link
            href="/feed"
            className="text-[11px] font-black text-gray-400 hover:text-addis-red transition-colors uppercase tracking-[0.2em]"
          >
            DISCARD_DRAFT
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-addis-orange px-12 py-4 text-xs shadow-2xl disabled:opacity-50"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT PROPOSAL"}
          </button>
        </div>
      </form>
    </div>
  );
}
