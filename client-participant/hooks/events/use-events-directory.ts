'use client';

import { useEffect, useRef, useState } from 'react';
import type { HomeEventRecord } from './use-home-events';

export interface EventsDirectoryPage {
  events: HomeEventRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  eventsType: 'upcoming' | 'past';
}

interface UseEventsDirectoryParams {
  q: string;
  page: number;
  pageSize: number;
}

interface State extends EventsDirectoryPage {
  loading: boolean;
  error: string | null;
}

const EMPTY: EventsDirectoryPage = {
  events: [],
  total: 0,
  page: 1,
  pageSize: 9,
  totalPages: 1,
  eventsType: 'upcoming',
};

export function useEventsDirectory({ q, page, pageSize }: UseEventsDirectoryParams): State {
  const [state, setState] = useState<State>({ ...EMPTY, loading: true, error: null });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (q.trim()) params.set('q', q.trim());

    fetch(`/api/events/public?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const d = json.data;
          setState({
            events: d.events,
            total: d.total,
            page: d.page,
            pageSize: d.page_size,
            totalPages: d.total_pages,
            eventsType: d.events_type,
            loading: false,
            error: null,
          });
        } else {
          setState((prev) => ({ ...prev, loading: false, error: json.message ?? 'Failed to load events' }));
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setState((prev) => ({ ...prev, loading: false, error: 'Failed to load events' }));
        }
      });

    return () => controller.abort();
  }, [q, page, pageSize]);

  return state;
}
