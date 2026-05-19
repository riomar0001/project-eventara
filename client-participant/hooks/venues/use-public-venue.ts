'use client';

import { useEffect, useState } from 'react';
import type { ApiVenue } from '@/types/venue';

function toApiVenue(data: Record<string, unknown>): ApiVenue {
  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string) ?? '',
    address_line: data.address_line as string,
    city: data.city as string,
    province: data.province as string,
    capacity: data.capacity as number,
    venue_type: data.venue_type as ApiVenue['venue_type'],
    popularity_count: data.popularity_count as number,
    usage_count: data.usage_count as number,
    is_partner: data.is_partner as boolean,
    amenities: (data.amenities as string[]) ?? [],
    image_url: (data.image_url as string) ?? null,
    average_rating: (data.average_rating as number) ?? null,
    rating_count: (data.rating_count as number) ?? 0,
    orb: (data.is_partner as boolean) ? 'lime' : 'amber',
    angle: '135deg',
  };
}

export function usePublicVenue(venueId: string) {
  const [venue, setVenue] = useState<ApiVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let res = await fetch(`/api/venues/public/partners/${venueId}`);
        if (!res.ok) res = await fetch(`/api/venues/public/community/${venueId}`);
        if (!res.ok) { if (!cancelled) setError('Venue not found.'); return; }
        const json = await res.json();
        if (!cancelled && json.success) setVenue(toApiVenue(json.data));
      } catch {
        if (!cancelled) setError('Failed to load venue.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [venueId]);

  return { venue, loading, error };
}
