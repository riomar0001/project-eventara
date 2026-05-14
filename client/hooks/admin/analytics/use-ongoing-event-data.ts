'use client';

import { useEffect, useState } from 'react';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

interface StartedEventSummary {
  event_id: string;
  event_title: string;
  session_count: number;
  checked_in_count: number;
  remaining_slots: number | null;
}

interface LiveCheckinEntry {
  participant_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  session_id: string;
  session_title: string;
  event_id: string;
  event_title: string;
  checked_in_time: string | null;
  checkin_method: string;
}

interface VolunteerOnDuty {
  volunteer_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  contact_phone: string;
  role_name: string | null;
  event_id: string;
  event_title: string;
}

interface SessionProgress {
  session_id: string;
  session_title: string;
  event_id: string;
  event_title: string;
  start_datetime: string;
  end_datetime: string;
  elapsed_pct: number;
}

interface PendingWithdrawalAlert {
  session_id: string;
  session_title: string;
  event_id: string;
  withdrawal_count: number;
}

interface LateRegistration {
  participant_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  session_id: string;
  session_title: string;
  event_id: string;
  registered_at: string;
  session_started_at: string;
}

interface OngoingEventData {
  started_events: StartedEventSummary[];
  live_checkin_feed: LiveCheckinEntry[];
  volunteer_on_duty: VolunteerOnDuty[];
  session_progress: SessionProgress[];
  pending_withdrawals: PendingWithdrawalAlert[];
  late_registrations: LateRegistration[];
}

export function useOngoingEventData() {
  const [data, setData] = useState<OngoingEventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function load() {
      try {
        const res = await fetch('/api/analytics/ongoing', {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load ongoing event data');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: OngoingEventData }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load ongoing event data'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  return { data, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
