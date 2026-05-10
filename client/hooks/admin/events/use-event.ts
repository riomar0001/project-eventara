'use client';

import { useEffect, useState } from 'react';
import { Events } from '@/api/sdk.gen';
import type { EventRecordResponse, EventSessionRecordResponse } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<EventRecordResponse | null>(null);
  const [sessions, setSessions] = useState<EventSessionRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await Events.getEventWithSessionsEventsEventIdGet({
          path: { event_id: eventId },
          headers: getAuthHeaders(),
          throwOnError: false,
        });

        if (cancelled) return;
        if (!result.data) throw result.error ?? new Error('Unable to load event.');

        setEvent(result.data.data);
        setSessions(result.data.sessions);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load event.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { event, sessions, isLoading, error };
}
