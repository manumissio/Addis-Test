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
        <Link href="/feed" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Addis Ideas" className="h-8 w-auto" />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 text-sm sm:flex">
          <Link href="/feed" className="text-gray-600 hover:text-gray-900">
            Feed
          </Link>
          <Link href="/discover" className="text-gray-600 hover:text-gray-900">
            Discover
          </Link>
          <Link href="/messages" className="text-gray-600 hover:text-gray-900">
            Messages
          </Link>

          {/* Primary CTA */}
          <Link
            href="/ideas/new"
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800"
          >
            New Idea
          </Link>

          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-gray-200" />

          {/* User Identity Group */}
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${user.username}`}
              className="group flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-gray-50"
            >
              <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 ring-1 ring-gray-200 transition-all group-hover:ring-gray-300">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-500">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium leading-none text-gray-700 group-hover:text-gray-900">
                {user.username}
              </span>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Settings
            </Link>

            {/* Logout */}
            <button
              onClick={logout}
              className="text-xs font-medium text-gray-400 transition-colors hover:text-red-600"
            >
              Log out
            </button>
          </div>
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
            {/* User info at top of mobile menu */}
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-bold text-gray-500">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">{user.username}</div>
                <Link
                  href={`/profile/${user.username}`}
                  onClick={() => setMenuOpen(false)}
                  className="text-xs text-addis-orange"
                >
                  View profile
                </Link>
              </div>
            </div>

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
              href="/messages"
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              Messages
            </Link>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              Settings
            </Link>
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="text-left text-red-600 hover:text-red-700"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
