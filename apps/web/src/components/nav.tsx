"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { getAssetUrl } from "@/lib/api";
import { NotificationDropdown } from "./notification-dropdown";

export function Nav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const linkClass = (path: string) =>
    `px-4 py-2 text-[11px] font-black tracking-[0.15em] transition-all border-b-2 ${
      isActive(path)
        ? "text-white border-addis-yellow bg-white/10"
        : "text-white/80 border-transparent hover:text-white hover:border-addis-green"
    }`;

  const profileImageUrl = getAssetUrl(user.profileImageUrl);

  return (
    <nav className="sticky top-0 z-50 bg-addis-orange/90 backdrop-blur-md shadow-sm border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/feed" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/images/logo.png" alt="Addis Ideas" className="h-9 w-auto brightness-0 invert" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden h-16 items-center gap-0 sm:flex">
            <Link href="/feed" className={linkClass("/feed")}>
              HOME
            </Link>
            <Link href="/discover" className={linkClass("/discover")}>
              SEARCH
            </Link>
            <Link href="/messages" className={linkClass("/messages")}>
              MESSAGES
            </Link>
          </div>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-4 sm:flex">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Primary CTA */}
          <Link
            href="/ideas/new"
            className="rounded-sm bg-addis-green px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-addis-yellow hover:border-b-4 hover:border-addis-orange"
          >
            CREATE
          </Link>

          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-white/20" />

          {/* User Identity Group */}
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${user.username}`}
              className="group flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-white/10"
            >
              <div className="h-8 w-8 overflow-hidden rounded-full bg-white/20 ring-1 ring-white/30 transition-all group-hover:ring-white">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs font-bold text-white">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-bold leading-none text-white">
                {user.username.toUpperCase()}
              </span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="text-xs font-bold text-white/70 transition-colors hover:text-white"
            >
              LOGOUT
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
            {/* User info at top */}
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
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
              className={isActive("/feed") ? "font-medium text-addis-orange" : "text-gray-600 hover:text-gray-900"}
            >
              Feed
            </Link>
            <Link
              href="/discover"
              onClick={() => setMenuOpen(false)}
              className={isActive("/discover") ? "font-medium text-addis-orange" : "text-gray-600 hover:text-gray-900"}
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
              href="/notifications"
              onClick={() => setMenuOpen(false)}
              className={isActive("/notifications") ? "font-medium text-addis-orange" : "text-gray-600 hover:text-gray-900"}
            >
              Notifications
            </Link>
            <Link
              href="/messages"
              onClick={() => setMenuOpen(false)}
              className={isActive("/messages") ? "font-medium text-addis-orange" : "text-gray-600 hover:text-gray-900"}
            >
              Messages
            </Link>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className={isActive("/settings") ? "font-medium text-addis-orange" : "text-gray-600 hover:text-gray-900"}
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
