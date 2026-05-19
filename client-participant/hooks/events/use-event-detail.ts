'use client';

import { useEffect, useState } from 'react';
import type { HomeEventRecord } from './use-home-events';

interface State {
  event: HomeEventRecord | null;
  loading: boolean;
  error: string | null;
}

export function useEventDetail(id: string) {
  const [state, setState] = useState<State>({ event: null, loading: true, error: null });

  useEffect(() => {
    if (!id) return;
    setState({ event: null, loading: true, error: null });

    fetch(`/api/events/public/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setState({ event: json.data, loading: false, error: null });
        } else {
          setState({ event: null, loading: false, error: json.message ?? 'Event not found' });
        }
      })
      .catch(() => setState({ event: null, loading: false, error: 'Failed to load event' }));
  }, [id]);

  const totalSlots = state.event?.sessions.reduce((sum, s) => sum + (s.max_slots ?? 0), 0) ?? 0;

  return {
    ...state,
    totalSlots,
    seatsFilled: 0,
    capacityPct: 0,
    isFull: false,
  };
}
