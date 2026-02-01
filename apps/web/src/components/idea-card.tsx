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
        className="group flex h-full flex-col overflow-hidden border-t-4 border-[#FFDA55] bg-[#FFFFF3] shadow-lg transition-all hover:border-b-4 hover:border-addis-green"
      >
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={idea.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#fdfdfd]">
              <img src="/images/default_idea.png" alt="Default" className="h-20 w-auto opacity-20" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-addis-orange transition-colors">
            {idea.title.toUpperCase()}
          </h3>
          <p className="mb-6 line-clamp-3 text-sm text-gray-600 leading-relaxed">
            {idea.description.replace(/<[^>]*>/g, "")}
          </p>

          {/* Stats Bar - Legacy Colored Icons */}
          <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-bold text-gray-500">
            <div className="flex gap-4">
              <motion.span whileHover={{ scale: 1.2 }} className="flex items-center gap-1.5 cursor-default">
                <svg className="h-4 w-4 text-addis-orange" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {idea.likesCount}
              </motion.span>
              <motion.span whileHover={{ scale: 1.2 }} className="flex items-center gap-1.5 cursor-default">
                <svg className="h-4 w-4 text-addis-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {idea.commentsCount}
              </motion.span>
              <motion.span whileHover={{ scale: 1.2 }} className="flex items-center gap-1.5 cursor-default">
                <svg className="h-4 w-4 text-addis-yellow" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {idea.viewsCount}
              </motion.span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              {new Date(idea.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}