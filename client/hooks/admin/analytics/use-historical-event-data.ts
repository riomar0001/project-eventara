'use client';

import { useEffect, useState } from 'react';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

interface EndedEventSummary {
  event_id: string;
  event_title: string;
  start_date: string;
  end_date: string;
  total_registered: number;
  total_attended: number;
  total_no_show: number;
  total_cancelled: number;
  average_feedback: number | null;
}

interface CancelledEventReport {
  event_id: string;
  event_title: string;
  cancelled_at: string | null;
  created_by: string;
  creator_first_name: string | null;
  creator_last_name: string | null;
  creator_alias: string | null;
  session_count: number;
}

interface FeedbackCompleteness {
  event_id: string;
  event_title: string;
  attended_count: number;
  feedback_count: number;
  completeness_rate_pct: number | null;
}

interface PeriodComparison {
  period_label: string;
  from_date: string;
  to_date: string;
  total_events: number;
  total_registered: number;
  total_attended: number;
  average_attendance_rate_pct: number | null;
  average_feedback: number | null;
}

interface HistoricalEventData {
  ended_events: EndedEventSummary[];
  cancelled_events: CancelledEventReport[];
  feedback_completeness: FeedbackCompleteness[];
  period_comparisons: PeriodComparison[] | null;
  total_count: number;
}

export interface HistoricalFilters {
  from_date?: string;
  to_date?: string;
  organizer_id?: string;
  venue_id?: string;
  compare_from_date?: string;
  compare_to_date?: string;
}

export function useHistoricalEventData(filters?: HistoricalFilters) {
  const [data, setData] = useState<HistoricalEventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function load() {
      try {
        const params = new URLSearchParams();
        if (filters?.from_date) params.set('from_date', filters.from_date);
        if (filters?.to_date) params.set('to_date', filters.to_date);
        if (filters?.organizer_id) params.set('organizer_id', filters.organizer_id);
        if (filters?.venue_id) params.set('venue_id', filters.venue_id);
        if (filters?.compare_from_date) params.set('compare_from_date', filters.compare_from_date);
        if (filters?.compare_to_date) params.set('compare_to_date', filters.compare_to_date);

        const qs = params.toString();
        const url = `/api/analytics/historical${qs ? `?${qs}` : ''}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load historical event data');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: HistoricalEventData }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load historical event data'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [
    filters?.from_date, filters?.to_date, filters?.organizer_id,
    filters?.venue_id, filters?.compare_from_date, filters?.compare_to_date
  ]);

  return { data, isLoading, error };
}

export function useCancelledEventsReport() {
  const [data, setData] = useState<CancelledEventReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/analytics/historical', {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load cancelled events report');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: HistoricalEventData }).data.cancelled_events);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load cancelled events report'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
