'use client';

import { useEffect, useState } from 'react';
import { EventParticipants } from '@/api/sdk.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

const STATS_PAGE_SIZE = 100;

export type EventSessionParticipantStats = {
  checkedIn: number;
  registered: number;
};

export function useEventParticipantStats(eventId: string, refreshKey = 0, enabled = true) {
  const [registeredCount, setRegisteredCount] = useState(0);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [sessionStats, setSessionStats] = useState<Record<string, EventSessionParticipantStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      setRegisteredCount(0);
      setAttendeeCount(0);
      setSessionStats({});
      setIsLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        let nextOffset = 0;
        let total = 0;
        let checkedIn = 0;
        const nextSessionStats: Record<string, EventSessionParticipantStats> = {};

        do {
          const result = await EventParticipants.getEventParticipantsEventsEventIdParticipantsGet({
            path: { event_id: eventId },
            query: { limit: STATS_PAGE_SIZE, offset: nextOffset },
            headers: getAuthHeaders(),
            throwOnError: false
          });

          if (!result.data) throw result.error ?? new Error('Unable to load participant stats.');

          total = result.data.meta.total;
          result.data.data.forEach((participant) => {
            const current = nextSessionStats[participant.event_session_id] ?? { checkedIn: 0, registered: 0 };
            current.registered += 1;
            if (participant.is_checked_in) {
              current.checkedIn += 1;
              checkedIn += 1;
            }
            nextSessionStats[participant.event_session_id] = current;
          });
          nextOffset += STATS_PAGE_SIZE;
        } while (nextOffset < total && !cancelled);

        if (!cancelled) {
          setRegisteredCount(total);
          setAttendeeCount(checkedIn);
          setSessionStats(nextSessionStats);
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
  }, [enabled, eventId, refreshKey]);

  return { registeredCount, attendeeCount, sessionStats, isLoading, error };
}
