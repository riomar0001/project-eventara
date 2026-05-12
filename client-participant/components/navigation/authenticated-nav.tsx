/**
 * Authenticated Navigation Bar
 * Grid layout: logo | centered-nav | user-avatar
 * Reusable across all protected pages (Venue Hub, Events, etc.)
 */

"use client"

import { useState } from "react"

interface AuthenticatedNavProps {
  userName?: string
  userTier?: string
  activeLink?: "Home" | "Events" | "Venue Hub" | "About"
  onLogout?: () => void
}

export function AuthenticatedNav({
  userName = "User",
  userTier = "Participant",
  activeLink = "Venue Hub",
  onLogout,
}: AuthenticatedNavProps) {
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const navLinks = ["Home", "Events", "Venue Hub", "About"] as const

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--line-soft)] bg-white">
      <div className="mx-auto max-w-[1240px] px-8">
        <div className="grid h-[68px] grid-cols-[1fr_auto_1fr] items-center gap-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5 font-bold tracking-[-0.02em]">
            <div className="h-6.5 w-6.5 flex items-center justify-center rounded-lg bg-gradient-to-br from-[var(--lime)] to-[oklch(0.78_0.19_128)] shadow-lg shadow-[var(--lime-glow)]">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2L15 8H12V14H8V8H5L10 2Z"
                  fill="currentColor"
                  className="text-[#0a1005]"
                />
              </svg>
            </div>
            <span className="text-lg text-[var(--text)]">Eventara</span>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex items-center gap-1.5">
            {navLinks.map((link) => (
              <button
                key={link}
                className={`rounded-xl px-3.5 py-2 text-[14.5px] transition-colors ${
                  link === activeLink
                    ? "relative text-[var(--lime)] after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-8 after:-translate-x-1/2 after:bg-[var(--lime)] after:shadow-lg after:shadow-[var(--lime-glow)]"
                    : "text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Right: User Avatar & Dropdown */}
          <div className="flex justify-end">
            <div className="relative">
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--line-soft)] px-3 py-1.5 transition-all hover:border-[var(--text-mute)] hover:bg-[oklch(1_0_0_/_0.03)]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--amber)] to-[oklch(0.72_0.16_75)] text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="hidden flex-col items-start sm:flex">
                  <div className="text-xs font-semibold text-[var(--text)]">
                    {userName}
                  </div>
                  <div className="font-mono text-xs font-medium text-[var(--lime)]">
                    {userTier}
                  </div>
                </div>
              </button>

              {/* Avatar Dropdown */}
              {avatarMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-xl">
                  <button className="w-full px-4 py-2 text-left text-sm text-[var(--text-dim)] hover:bg-[oklch(1_0_0_/_0.04)] hover:text-[var(--text)]">
                    Dashboard
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-[var(--text-dim)] hover:bg-[oklch(1_0_0_/_0.04)] hover:text-[var(--text)]">
                    My Venues
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-[var(--text-dim)] hover:bg-[oklch(1_0_0_/_0.04)] hover:text-[var(--text)]">
                    Wallet
                  </button>
                  <div className="border-t border-[var(--line-soft)]" />
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-dim)] hover:bg-[oklch(1_0_0_/_0.04)] hover:text-[var(--text)]"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
