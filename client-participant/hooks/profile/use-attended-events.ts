'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { humanizeApiError } from '@/lib/api-error';

export interface MyEventRecord {
  participant_id: string;
  event_id: string;
  event_title: string;
  event_start_date: string;
  event_end_date: string;
  event_banner_url: string | null;
  session_id: string;
  session_title: string;
  session_start_datetime: string;
  session_end_datetime: string;
  attended_at: string | null;
  status: 'registered' | 'attended';
}

interface UseAttendedEventsReturn {
  events: MyEventRecord[];
  loading: boolean;
  error: string | null;
}

export function useAttendedEvents(limit = 50): UseAttendedEventsReturn {
  const { accessToken: token } = useAuthStore();
  const [events, setEvents] = useState<MyEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`/api/user/profile/my-events?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setEvents(json.data);
        } else {
          setError(humanizeApiError(json.message, 'Unable to load your events. Please try refreshing.'));
        }
      })
      .catch(() => setError('Unable to load your events. Please try refreshing.'))
      .finally(() => setLoading(false));
  }, [token, limit]);

  return { events, loading, error };
}
