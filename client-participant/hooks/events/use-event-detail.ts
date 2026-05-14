'use client';

import { useMemo } from 'react';
import { ALL_EVENTS } from '@/constants/events-directory';
import { getSessionsForEvent } from '@/constants/sessions';

export function useEventDetail(id: number) {
  const event = useMemo(() => ALL_EVENTS.find((e) => e.id === id) ?? null, [id]);
  const sessions = useMemo(() => getSessionsForEvent(id), [id]);

  const seatsFilled = event ? event.total - event.seats : 0;
  const capacityPct = event ? Math.round((seatsFilled / event.total) * 100) : 0;
  const isFull = event?.seats === 0;

  return { event, sessions, seatsFilled, capacityPct, isFull };
}
