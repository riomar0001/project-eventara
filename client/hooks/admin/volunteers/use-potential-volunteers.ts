'use client';

import { useEffect, useState } from 'react';
import { Volunteers } from '@/api/sdk.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export type PotentialVolunteerRecord = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  email: string;
  events_count: number;
};

type PotentialVolunteersResponse = {
  potential_volunteers: PotentialVolunteerRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export function usePotentialVolunteers(pageSize = 20) {
  const [potentialVolunteers, setPotentialVolunteers] = useState<PotentialVolunteerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [minEvents, setMinEventsState] = useState(1);
  const [search, setSearchState] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await Volunteers.getPotentialVolunteersVolunteersPotentialGet({
          query: {
            page,
            page_size: pageSize,
            min_events: minEvents,
            ...(search ? { search } : {}),
          },
          headers: getAuthHeaders(),
          throwOnError: false,
        });

        if (!result.data) throw result.error ?? new Error('Unable to load potential volunteers.');

        const payload = result.data as { data: PotentialVolunteersResponse };
        if (!cancelled) {
          setPotentialVolunteers(payload.data.potential_volunteers);
          setTotal(payload.data.total);
          setTotalPages(payload.data.total_pages);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load potential volunteers.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, minEvents, search, refreshKey]);

  function setMinEvents(value: number) {
    setMinEventsState(value);
    setPage(1);
  }

  function setSearch(value: string) {
    setSearchState(value);
    setPage(1);
  }

  return {
    potentialVolunteers,
    total,
    page,
    pageSize,
    totalPages,
    minEvents,
    search,
    isLoading,
    error,
    setPage,
    setMinEvents,
    setSearch,
    refetch: () => setRefreshKey((k) => k + 1),
  };
}
