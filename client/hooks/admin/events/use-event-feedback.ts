'use client';

import { useEffect, useState } from 'react';
import { EventFeedback } from '@/api/sdk.gen';
import type { EventFeedbackRecordResponse } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

const PAGE_SIZE = 20;

export function useEventFeedback(eventId: string) {
  const [feedback, setFeedback] = useState<EventFeedbackRecordResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await EventFeedback.listEventFeedbackEventsEventIdFeedbackGet({
          path: { event_id: eventId },
          query: { limit: PAGE_SIZE, offset },
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load event feedback.');

        if (!cancelled) {
          setFeedback(result.data.data);
          setTotal(result.data.meta.total);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load event feedback.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId, offset, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return {
    feedback,
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
