'use client';

import { useEffect, useState } from 'react';

export interface PublicRating {
  id: string;
  alias: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
}

export interface RatingPagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export function useVenuePublicRatings(venueId: string, page = 1, pageSize = 10) {
  const [ratings, setRatings] = useState<PublicRating[]>([]);
  const [pagination, setPagination] = useState<RatingPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/venues/${venueId}/ratings/public?page=${page}&page_size=${pageSize}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setRatings(json.data);
          setPagination(json.pagination);
        } else {
          setError('Failed to load ratings.');
        }
      })
      .catch(() => { if (!cancelled) setError('Failed to load ratings.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [venueId, page, pageSize]);

  return { ratings, pagination, loading, error };
}
