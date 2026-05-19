'use client';

import { useEffect, useState } from 'react';

export interface ApiEventSession {
  id: string;
  event_id: string;
  venue_id: string;
  venue_name: string | null;
  venue_location: string | null;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  max_slots: number | null;
}

export interface HomeEventRecord {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  banner_url: string | null;
  sessions: ApiEventSession[];
}

export interface LiveEventData {
  event: Omit<HomeEventRecord, 'sessions'>;
  sessions: ApiEventSession[];
}

export interface HomeEventsData {
  live_event: LiveEventData | null;
  events: HomeEventRecord[];
  events_type: 'upcoming' | 'past';
}

export function useHomeEvents() {
  const [data, setData] = useState<HomeEventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/events/public/home')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.message ?? 'Failed to load events');
      })
      .catch(() => setError('Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
