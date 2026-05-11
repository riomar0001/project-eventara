'use client';

import { useEffect, useState } from 'react';
import { EventParticipants } from '@/api/sdk.gen';
import type { EventParticipantRecord, EventParticipantStatus } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

const PAGE_SIZE = 20;

export function useEventParticipants(eventId: string, statusFilter: EventParticipantStatus | null = null) {
  const [participants, setParticipants] = useState<EventParticipantRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setOffset(0);
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await EventParticipants.getEventParticipantsEventsEventIdParticipantsGet({
          path: { event_id: eventId },
          query: {
            limit: PAGE_SIZE,
            offset,
            ...(statusFilter !== null ? { status: statusFilter } : {})
          },
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load event participants.');

        if (!cancelled) {
          setParticipants(result.data.data);
          setTotal(result.data.meta.total);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load event participants.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId, statusFilter, offset, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return {
    participants,
    total,
    page,
    totalPages,
    pageSize: PAGE_SIZE,
    isLoading,
    error,
    setPage: (p: number) => setOffset((p - 1) * PAGE_SIZE),
    refetch: () => setRefreshKey((k) => k + 1)
  };
}
