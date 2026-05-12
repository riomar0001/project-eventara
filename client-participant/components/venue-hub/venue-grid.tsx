/**
 * Venue Grid - displays venues with contribution banner injection
 */

"use client"

import type { Venue } from "@/types/venue"
import { VenueCard } from "./venue-card"
import { ContributionBanner } from "./contribution-banner"

interface VenueGridProps {
  venues: Venue[]
  onViewDetail: (v: Venue) => void
  onEditVenue: (v: Venue) => void
  onShareVenue: (v: Venue) => void
  onReportVenue: (v: Venue) => void
  onAddVenue: () => void
}

export function VenueGrid({
  venues,
  onViewDetail,
  onEditVenue,
  onShareVenue,
  onReportVenue,
  onAddVenue,
}: VenueGridProps) {
  if (venues.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 text-6xl">🏢</div>
        <h4 className="m-0 mb-2 text-xl font-semibold text-[var(--text)]">
          No venues found
        </h4>
        <p className="text-base text-[var(--text-dim)]">
          Try adjusting your filters or search terms
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue, idx) => (
        <div key={venue.id}>
          <VenueCard
            venue={venue}
            onView={onViewDetail}
            onEdit={onEditVenue}
            onShare={onShareVenue}
            onReport={onReportVenue}
          />

          {/* Contribution banner after 3rd card */}
          {idx === 2 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <ContributionBanner onAddVenue={onAddVenue} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
