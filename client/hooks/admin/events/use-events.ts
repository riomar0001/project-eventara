'use client';

import { useEffect, useState } from 'react';
import { Events } from '@/api/sdk.gen';
import type { EventRecordResponse, EventStatus } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export function useEvents(pageSize = 20) {
  const [events, setEvents] = useState<EventRecordResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilterState] = useState<EventStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await Events.getAllEventsEventsGet({
          query: {
            page,
            page_size: pageSize,
            ...(statusFilter !== null ? { status: statusFilter } : {})
          },
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load events.');

        if (!cancelled) {
          setEvents(result.data.data);
          setTotal(result.data.total);
          setTotalPages(result.data.total_pages);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load events.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, statusFilter]);

  function setStatusFilter(status: EventStatus | null) {
    setStatusFilterState(status);
    setPage(1);
  }

  return {
    events,
    total,
    page,
    pageSize,
    totalPages,
    statusFilter,
    isLoading,
    error,
    setPage,
    setStatusFilter
  };
}
