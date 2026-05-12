'use client';

import { useEffect, useState } from 'react';
import { EventParticipants } from '@/api/sdk.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

const STATS_PAGE_SIZE = 100;

export function useEventParticipantStats(eventId: string, refreshKey = 0) {
  const [registeredCount, setRegisteredCount] = useState(0);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        let nextOffset = 0;
        let total = 0;
        let checkedIn = 0;

        do {
          const result = await EventParticipants.getEventParticipantsEventsEventIdParticipantsGet({
            path: { event_id: eventId },
            query: { limit: STATS_PAGE_SIZE, offset: nextOffset },
            headers: getAuthHeaders(),
            throwOnError: false
          });

          if (!result.data) throw result.error ?? new Error('Unable to load participant stats.');

          total = result.data.meta.total;
          checkedIn += result.data.data.filter((participant) => participant.is_checked_in).length;
          nextOffset += STATS_PAGE_SIZE;
        } while (nextOffset < total && !cancelled);

        if (!cancelled) {
          setRegisteredCount(total);
          setAttendeeCount(checkedIn);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load participant stats.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId, refreshKey]);

  return { registeredCount, attendeeCount, isLoading, error };
}
