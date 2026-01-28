"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function Nav() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/feed" className="text-lg font-bold text-addis-orange">
          Addis Ideas
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 text-sm sm:flex">
          <Link href="/feed" className="text-gray-600 hover:text-gray-900">
            Feed
          </Link>
          <Link href="/discover" className="text-gray-600 hover:text-gray-900">
            Discover
          </Link>
          <Link
            href={`/profile/${user.username}`}
            className="text-gray-600 hover:text-gray-900"
          >
            Profile
          </Link>
          <Link
            href="/ideas/new"
            className="rounded-md bg-addis-orange px-3 py-1.5 text-white hover:bg-addis-orange/90"
          >
            New Idea
          </Link>
          <span className="text-gray-400">
            {user.username}
          </span>
          <button
            onClick={logout}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <Link
              href="/feed"
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              Feed
            </Link>
            <Link
              href="/discover"
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              Discover
            </Link>
            <Link
              href="/ideas/new"
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              New Idea
            </Link>
            <Link
              href={`/profile/${user.username}`}
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              Profile
            </Link>
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="text-left text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
