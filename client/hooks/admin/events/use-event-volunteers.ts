'use client';

import { useEffect, useState } from 'react';
import { EventVolunteers } from '@/api/sdk.gen';
import type { EventVolunteerRecordResponse, EventVolunteerStatus } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export function useEventVolunteers(eventId: string, statusFilter: EventVolunteerStatus | null = null) {
  const [volunteers, setVolunteers] = useState<EventVolunteerRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await EventVolunteers.listEventVolunteersEventsEventIdVolunteersGet({
          path: { event_id: eventId },
          query: statusFilter !== null ? { status: statusFilter } : undefined,
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load event volunteers.');

        if (!cancelled) setVolunteers(result.data.data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load event volunteers.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId, statusFilter, refreshKey]);

  return {
    volunteers,
    isLoading,
    error,
    refetch: () => setRefreshKey((k) => k + 1)
  };
}
