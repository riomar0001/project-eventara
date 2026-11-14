'use client';

import { useEffect, useState } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import type { AttendedEventResponse } from '@/api/types.gen';
import { humanizeApiError } from '@/lib/api-error';
import { useAuthStore } from '@/store/auth-store';

export type MyEventRecord = AttendedEventResponse;

interface UseAttendedEventsReturn {
  events: MyEventRecord[];
  loading: boolean;
  error: string | null;
}

export function useAttendedEvents(limit = 50): UseAttendedEventsReturn {
  const token = useAuthStore((s) => s.accessToken);
  const [events, setEvents] = useState<MyEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    AccountSettings.getMyEventsUserProfileMyEventsGet({
      query: { limit },
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ data, error: apiError }) => {
      if (apiError || !data) {
        setError(humanizeApiError((apiError as { message?: string } | null)?.message, 'Unable to load your events. Please try refreshing.'));
      } else {
        setEvents(data.data);
      }
      setLoading(false);
    });
  }, [token, limit]);

  return { events, loading, error };
}
