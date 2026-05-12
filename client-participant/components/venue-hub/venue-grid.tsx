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
  currentPage?: number
}

export function VenueGrid({
  venues,
  onViewDetail,
  onEditVenue,
  onShareVenue,
  onReportVenue,
  onAddVenue,
  currentPage = 1,
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

  // On page 1: show top 3, banner, then remaining
  // On other pages: show all, then banner
  const isFirstPage = currentPage === 1
  const partnerCount = isFirstPage ? 3 : 0
  const partneredVenues = venues.slice(0, partnerCount)
  const communityVenues = venues.slice(partnerCount)

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Partnered venues (top 3 on page 1) */}
      {partneredVenues.map((venue) => (
        <div key={venue.id}>
          <VenueCard
            venue={venue}
            onView={onViewDetail}
            onEdit={onEditVenue}
            onShare={onShareVenue}
            onReport={onReportVenue}
          />
        </div>
      ))}

      {/* Contribution banner - only after partnered venues on page 1, or after all on other pages */}
      {isFirstPage && (
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <ContributionBanner onAddVenue={onAddVenue} />
        </div>
      )}

      {/* Community venues (rest on page 1, all on other pages) */}
      {communityVenues.map((venue) => (
        <div key={venue.id}>
          <VenueCard
            venue={venue}
            onView={onViewDetail}
            onEdit={onEditVenue}
            onShare={onShareVenue}
            onReport={onReportVenue}
          />
        </div>
      ))}

      {/* Contribution banner on page 2+ */}
      {!isFirstPage && (
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <ContributionBanner onAddVenue={onAddVenue} />
        </div>
      )}
    </div>
  )
}
