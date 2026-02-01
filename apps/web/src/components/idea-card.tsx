"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { getAssetUrl } from "@/lib/api";

type IdeaCardProps = {
  idea: {
    id: number;
    title: string;
    description: string;
    imageUrl: string | null;
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    createdAt: string;
    creatorUsername: string;
  };
};

export function IdeaCard({ idea }: IdeaCardProps) {
  const imageUrl = getAssetUrl(idea.imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <Link
        href={`/ideas/${idea.id}`}
        className="group relative flex h-full flex-col overflow-hidden border-t-4 border-[#FFDA55] bg-card-bg shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_20px_50px_rgba(225,122,24,0.1)] dark:hover:shadow-[0_20px_50px_rgba(225,122,24,0.15)] hover:border-b-4 hover:border-addis-green rounded-sm"
      >
        {/* Image with Slick Overlay */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-addis-dark">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={idea.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-addis-orange/20 to-transparent mix-blend-multiply opacity-60 transition-opacity group-hover:opacity-40" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#fdfdfd] dark:bg-addis-dark">
              <img src="/images/default_idea.png" alt="Default" className="h-16 w-auto opacity-10 dark:invert dark:opacity-20" />
            </div>
          )}
          
          {/* Subtle Sponsor Indicator if applicable */}
          <div className="absolute top-3 right-3">
             {/* Placeholder for future badge logic */}
          </div>
        </div>

        {/* Content with Refined Typography */}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center justify-between">
             <span className="text-[10px] font-black tracking-[0.2em] text-addis-green uppercase">NEW IDEA</span>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter tabular-nums">
              {new Date(idea.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <h3 className="mb-2 text-lg font-black leading-tight text-gray-900 dark:text-white group-hover:text-addis-orange transition-colors tracking-tight">
            {idea.title.toUpperCase()}
          </h3>
          <p className="mb-6 line-clamp-3 text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
            {idea.description.replace(/<[^>]*>/g, "")}
          </p>

          {/* Stats Bar - Slick Modernized Icons */}
          <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-5">
            <div className="flex gap-5">
              <motion.span whileHover={{ y: -2 }} className="flex items-center gap-2 cursor-default text-xs font-black text-gray-400 group-hover:text-addis-orange transition-colors">
                <svg className="h-4 w-4 text-addis-orange/40 group-hover:text-addis-orange transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {idea.likesCount}
              </motion.span>
              <motion.span whileHover={{ y: -2 }} className="flex items-center gap-2 cursor-default text-xs font-black text-gray-400 group-hover:text-addis-green transition-colors">
                <svg className="h-4 w-4 text-addis-green/40 group-hover:text-addis-green transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {idea.commentsCount}
              </motion.span>
            </div>
            
            <div className="flex -space-x-2">
               {/* Team avatars could go here for more slickness */}
               <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-addis-dark border-2 border-white dark:border-addis-dark flex items-center justify-center text-[8px] font-black text-gray-400">
                 +{idea.viewsCount}
               </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}