'use client';

import { useEffect, useState } from 'react';
import { Venues } from '@/api/sdk.gen';
import type { VenueRecordResponse } from '@/api/types.gen';
import { getAccessToken } from '@/store/auth-store';

function extractMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as { detail?: unknown; message?: unknown };
  if (typeof p.detail === 'string') return p.detail;
  if (typeof p.message === 'string') return p.message;
  return undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    const msg = extractMessage(d) ?? extractMessage(error);
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useVenue(venueId: string) {
  const [venue, setVenue] = useState<VenueRecordResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await Venues.getVenueVenuesVenueIdGet({
          path: { venue_id: venueId },
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          throwOnError: false
        });
        if (cancelled) return;
        if (!result.data) throw result.error ?? new Error('Unable to load venue.');
        setVenue(result.data.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load venue.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  return { venue, isLoading, error };
}
