/**
 * Venue Card component - main venue display card
 */

"use client"

import React, { useState } from "react"
import type { Venue } from "@/types/venue"
import { RatingBadge } from "./rating-badge"
import { CapacityBadge } from "./capacity-badge"
import { Icon } from "@/components/ui/icon"
import { formatDate } from "@/lib/formatters"

interface VenueCardProps {
  venue: Venue
  onView: (v: Venue) => void
  onEdit: (v: Venue) => void
  onShare: (v: Venue) => void
  onReport: (v: Venue) => void
}

export function VenueCard({
  venue,
  onView,
  onEdit,
  onShare,
  onReport,
}: VenueCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="duration-280 overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] transition-all hover:border-[oklch(0.9_0.22_128_/_0.45)] hover:shadow-lg hover:shadow-[oklch(0.9_0.22_128_/_0.15)]">
      {/* Visual Section */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[oklch(0.2_0.01_150)] to-[oklch(0.15_0.008_150)]">
        {/* Stripe pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(${venue.angle}, transparent 0 22px, oklch(1 0 0 / 0.035) 22px 24px)`,
          }}
        />

        {/* Orbs */}
        <div
          className="absolute rounded-full opacity-55 blur-[34px]"
          style={{
            width: "220px",
            height: "220px",
            left: "18%",
            top: "22%",
            background: venue.orb === "lime" ? "var(--lime)" : "var(--amber)",
            opacity: venue.orb === "lime" ? 0.3 : 0.4,
          }}
        />
        <div
          className="absolute rounded-full opacity-55 blur-[34px]"
          style={{
            width: "180px",
            height: "180px",
            right: "14%",
            bottom: "18%",
            background: venue.orb === "lime" ? "var(--amber)" : "var(--lime)",
            opacity: 0.25,
          }}
        />

        {/* Badges */}
        <div className="absolute left-3 top-3">
          <RatingBadge rating={venue.rating} reviews={venue.reviews} />
        </div>
        <div className="absolute right-3 top-3">
          <CapacityBadge type={venue.type} capacity={venue.capacity} />
        </div>

        {/* Placeholder label */}
        <div className="absolute bottom-4 left-4 font-mono text-xs uppercase tracking-widest text-[oklch(1_0_0_/_0.3)]">
          [ venue cover · 16:9 ]
        </div>
      </div>

      {/* Body Section */}
      <div className="flex flex-col gap-2.5 p-5">
        {/* Title & Contributor */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 text-lg font-semibold tracking-[-0.02em] text-[var(--text)]">
            {venue.name}
          </h3>
          <div className="flex-shrink-0 text-xs">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[var(--amber)] to-[oklch(0.72_0.16_75)] text-xs font-bold text-white">
              {venue.contributor.username[1]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Contributor info */}
        <div className="text-xs text-[var(--text-dim)]">
          <div className="font-semibold">{venue.contributor.username}</div>
          <div className="text-[var(--text-mute)]">
            {formatDate(venue.contributor.date)}
          </div>
        </div>

        {/* Specs */}
        <div className="space-y-1.5 py-1.5">
          <div className="flex items-center gap-2 text-sm text-[var(--text)]">
            <Icon name="mapPin" size={16} className="text-[var(--text-mute)]" />
            <span>{venue.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text)]">
            <Icon name="users" size={16} className="text-[var(--text-mute)]" />
            <span>{venue.capacity} capacity</span>
          </div>
        </div>

        {/* Tags */}
        {venue.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1.5">
            {venue.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[oklch(0_0_0_/_0.025)] px-2 py-1 text-xs font-medium text-[var(--text-dim)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action row */}
        <div className="border-t border-dashed border-[var(--line-soft)] pt-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(venue)}
              className="flex-1 rounded-full border border-[var(--lime)] bg-[oklch(0.9_0.22_128_/_0.05)] px-3 py-2 text-sm font-medium text-[var(--lime)] transition-all hover:bg-[oklch(0.9_0.22_128_/_0.12)] hover:shadow-lg hover:shadow-[var(--lime-glow)]"
            >
              View
            </button>

            {/* Menu button */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-full border border-[var(--text-dim)] p-2 text-[var(--text-dim)] transition-all hover:border-[oklch(0.82_0.17_75_/_0.4)] hover:bg-[oklch(0.82_0.17_75_/_0.06)] hover:text-[var(--amber)]"
              >
                <Icon name="moreVertical" size={16} />
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-lg">
                  <button
                    onClick={() => {
                      onEdit(venue)
                      setIsMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-dim)] hover:bg-[oklch(1_0_0_/_0.04)] hover:text-[var(--text)]"
                  >
                    Edit details
                  </button>
                  <button
                    onClick={() => {
                      onShare(venue)
                      setIsMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-dim)] hover:bg-[oklch(1_0_0_/_0.04)] hover:text-[var(--text)]"
                  >
                    Share venue
                  </button>
                  <button
                    onClick={() => {
                      onReport(venue)
                      setIsMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--amber)] hover:bg-[oklch(0.82_0.17_75_/_0.06)]"
                  >
                    Report venue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
