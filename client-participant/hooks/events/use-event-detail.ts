'use client';

import { useEffect, useState } from 'react';
import type { HomeEventRecord } from './use-home-events';
import { humanizeApiError } from '@/lib/api-error';

interface State {
  event: HomeEventRecord | null;
  loading: boolean;
  error: string | null;
}

export function useEventDetail(id: string) {
  const [state, setState] = useState<State>({ event: null, loading: true, error: null });

  function fetchEvent() {
    if (!id) return;
    fetch(`/api/events/public/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setState({ event: json.data, loading: false, error: null });
        } else {
          setState({ event: null, loading: false, error: humanizeApiError(json.message, "We couldn't find this event. It may have been removed.") });
        }
      })
      .catch(() => setState({ event: null, loading: false, error: 'Unable to load event details. Please try refreshing the page.' }));
  }

  useEffect(() => {
    setState({ event: null, loading: true, error: null });
    fetchEvent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totalSlots = state.event?.sessions.reduce((sum, s) => sum + (s.max_slots ?? 0), 0) ?? 0;
  const seatsFilled = state.event?.sessions.reduce((sum, s) => sum + s.registered_count, 0) ?? 0;
  const remaining = totalSlots - seatsFilled;
  const isFull = totalSlots > 0 && remaining <= 0;

  return {
    ...state,
    totalSlots,
    seatsFilled,
    capacityPct: totalSlots > 0 ? Math.min(100, Math.round((seatsFilled / totalSlots) * 100)) : 0,
    isFull,
    refetch: fetchEvent,
  };
}
