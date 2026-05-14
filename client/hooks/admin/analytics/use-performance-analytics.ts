'use client';

import { useEffect, useState } from 'react';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

interface AttendanceRate {
  session_id: string;
  session_title: string;
  event_id: string;
  registered_count: number;
  attended_count: number;
  attendance_rate_pct: number | null;
}

interface EventAttendanceRate {
  event_id: string;
  event_title: string;
  registered_count: number;
  attended_count: number;
  attendance_rate_pct: number | null;
}

interface FeedbackScoreSummary {
  event_id: string;
  event_title: string;
  average_rating: number | null;
  total_feedback_count: number;
}

interface FeedbackTrendPoint {
  event_id: string;
  event_title: string;
  end_date: string | null;
  average_rating: number | null;
  feedback_count: number;
}

interface TopRatedEvent {
  event_id: string;
  event_title: string;
  average_rating: number;
  feedback_count: number;
}

interface VolunteerPerformance {
  volunteer_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  role_name: string | null;
  joined_count: number;
  left_count: number;
}

interface OrganizerOutput {
  organizer_id: string;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  total_events_created: number;
  average_sessions_per_event: number | null;
  average_attendance_rate_pct: number | null;
}

interface SessionStatusDistribution {
  status: string;
  count: number;
}

interface EventPerformance {
  attendance_rates: AttendanceRate[];
  event_attendance_rates: EventAttendanceRate[];
  feedback_summaries: FeedbackScoreSummary[];
  feedback_trend: FeedbackTrendPoint[];
  top_rated_events: TopRatedEvent[];
  volunteer_performance: VolunteerPerformance[];
  organizer_output: OrganizerOutput[];
  session_status_distribution: SessionStatusDistribution[];
  repeat_attendee_rate_pct: number | null;
  average_registration_to_checkin_lead_time_hours: number | null;
}

interface LiveAttendance {
  session_id: string;
  session_title: string;
  event_id: string;
  event_title: string;
  checked_in_count: number;
  max_slots: number | null;
  remaining_slots: number | null;
}

interface OngoingPerformance {
  live_attendance: LiveAttendance[];
  real_time_slot_availability: LiveAttendance[];
}

interface YearOverYearAttendance {
  year: number;
  attended_count: number;
  growth_pct: number | null;
}

interface EventStatusTransition {
  period: string;
  status: string;
  count: number;
}

interface HistoricalPerformance {
  year_over_year_attendance: YearOverYearAttendance[];
  events_by_status_over_time: EventStatusTransition[];
}

export function useEventPerformance(eventId?: string | null) {
  const [data, setData] = useState<EventPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function load() {
      try {
        const params = new URLSearchParams();
        if (eventId) params.set('event_id', eventId);
        const url = `/api/analytics/performance/event?${params}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load event performance');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: EventPerformance }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load event performance'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [eventId]);

  return { data, isLoading, error };
}

export function useOngoingPerformance() {
  const [data, setData] = useState<OngoingPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function load() {
      try {
        const res = await fetch('/api/analytics/performance/ongoing', {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load ongoing performance');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: OngoingPerformance }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load ongoing performance'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  return { data, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}

export function useHistoricalPerformance() {
  const [data, setData] = useState<HistoricalPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/analytics/performance/historical', {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load historical performance');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: HistoricalPerformance }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load historical performance'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
