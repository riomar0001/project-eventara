'use client';

import { useEffect, useState } from 'react';
import { Venues } from '@/api/sdk.gen';
import type { VenueRecordResponse } from '@/api/types.gen';
import { getAccessToken } from '@/store/auth-store';

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as { detail?: unknown; message?: unknown };
  if (typeof p.detail === 'string') return p.detail;
  if (typeof p.message === 'string') return p.message;
  return undefined;
}

function getVenueErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    const msg = extractErrorMessage(d) ?? extractErrorMessage(error);
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

type UseVenuesOptions = {
  isPartner?: boolean | null;
};

export function useVenues(options: UseVenuesOptions = {}) {
  const isPartner = options.isPartner ?? null;
  const [venues, setVenues] = useState<VenueRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await Venues.listVenuesVenuesGet({
          query: { page_size: 100, ...(isPartner !== null ? { is_partner: isPartner } : {}) },
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load venues.');
        if (!cancelled) setVenues(result.data.data);
      } catch (err) {
        if (!cancelled) setError(getVenueErrorMessage(err, 'Unable to load venues.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isPartner]);

  return { venues, isLoading, error };
}
