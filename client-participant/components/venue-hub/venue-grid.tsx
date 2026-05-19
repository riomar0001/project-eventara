'use client';

import type { ApiVenue } from '@/types/venue';
import { VenueCard } from './venue-card';

interface VenueGridProps {
  venues: ApiVenue[];
  loading?: boolean;
  perPage?: number;
  onViewDetail: (v: ApiVenue) => void;
}

export function VenueGrid({ venues, loading, perPage = 9, onViewDetail }: VenueGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: perPage }).map((_, i) => (
          <div key={i} className="border-line-soft bg-surface animate-pulse rounded-2xl border" style={{ minHeight: 340 }} />
        ))}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 text-5xl">🏢</div>
        <h4 className="text-text m-0 mb-2 text-xl font-semibold">No venues found</h4>
        <p className="text-text-dim text-base">Try adjusting your search terms.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} onView={onViewDetail} />
      ))}
    </div>
  );
}
