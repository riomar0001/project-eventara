'use client';

import { useEffect, useRef, useState } from 'react';
import type { ApiVenue, VenuePagination } from '@/types/venue';
import { humanizeApiError } from '@/lib/api-error';

export type VenueHub = 'community' | 'contribute';

const ORBS: Array<'lime' | 'amber'> = ['lime', 'amber'];
const ANGLES = ['112deg', '115deg', '118deg', '121deg', '124deg', '127deg'];

interface UseVenuesParams {
  hub: VenueHub;
  search: string;
  page: number;
  pageSize?: number;
}

interface UseVenuesState {
  venues: ApiVenue[];
  pagination: VenuePagination | null;
  loading: boolean;
  error: string | null;
}

export function useVenues({ hub, search, page, pageSize = 9 }: UseVenuesParams): UseVenuesState {
  const [state, setState] = useState<UseVenuesState>({ venues: [], pagination: null, loading: true, error: null });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const endpoint = hub === 'community' ? '/api/venues/public/partners' : '/api/venues/public/community';
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search.trim()) params.set('search', search.trim());

    fetch(`${endpoint}?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const venues: ApiVenue[] = (json.data as ApiVenue[]).map((v, i) => ({
            ...v,
            orb: ORBS[i % ORBS.length],
            angle: ANGLES[i % ANGLES.length],
          }));
          setState({ venues, pagination: json.pagination, loading: false, error: null });
        } else {
          setState((prev) => ({ ...prev, loading: false, error: humanizeApiError(json.message, 'Unable to load venues. Please try refreshing the page.') }));
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setState((prev) => ({ ...prev, loading: false, error: 'Unable to load venues. Please try refreshing the page.' }));
        }
      });

    return () => controller.abort();
  }, [hub, search, page, pageSize]);

  return state;
}
