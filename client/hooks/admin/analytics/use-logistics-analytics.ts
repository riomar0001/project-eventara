'use client';

import { useEffect, useState } from 'react';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

interface SessionVenueAssignment {
  session_id: string;
  session_title: string;
  venue_id: string;
  venue_name: string;
  venue_city: string | null;
  venue_capacity: number;
}

interface SessionUtilisation {
  session_id: string;
  session_title: string;
  checked_in: number;
  max_slots: number | null;
  utilisation_pct: number | null;
  over_capacity: boolean;
}

interface VenueCapacityVsRegistration {
  session_id: string;
  session_title: string;
  venue_capacity: number;
  registered_count: number;
}

interface EventLogisticsOverview {
  event_id: string;
  event_title: string;
  total_sessions: number;
  scheduled_dates: string[];
  venue_assignments: SessionVenueAssignment[];
  session_utilisation: SessionUtilisation[];
  over_capacity_sessions: SessionUtilisation[];
  venue_capacity_vs_registrations: VenueCapacityVsRegistration[];
}

interface SessionTimelineEntry {
  session_id: string;
  session_title: string;
  event_id: string;
  event_title: string;
  venue_id: string;
  venue_name: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

interface SessionTimeline {
  ongoing: SessionTimelineEntry[];
  upcoming: SessionTimelineEntry[];
  completed: SessionTimelineEntry[];
}

interface VolunteerRosterEntry {
  volunteer_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  role_name: string | null;
  contact_phone: string | null;
  status: string;
}

interface VolunteerLogistics {
  event_id: string;
  event_title: string;
  joined_volunteer_count: number;
  joined_volunteer_roster: VolunteerRosterEntry[];
  volunteer_to_participant_ratio: number | null;
  pending_volunteer_count: number;
}

interface RegistrationLogistics {
  session_id: string;
  session_title: string;
  total_registrations: number;
  cancelled_count: number;
  cancellation_rate_pct: number | null;
  no_show_count: number;
  no_show_rate_pct: number | null;
  qr_checkin_count: number;
  manual_checkin_count: number;
}

export function useEventLogisticsOverview(eventId: string | null) {
  const [data, setData] = useState<EventLogisticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const res = await fetch(`/api/analytics/logistics/overview/${eventId}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load logistics overview');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: EventLogisticsOverview }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load logistics overview'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { data, isLoading, error };
}

export function useSessionTimeline() {
  const [data, setData] = useState<SessionTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/analytics/logistics/timeline', {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load session timeline');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: SessionTimeline }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load session timeline'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

export function useVolunteerLogistics(eventId: string | null) {
  const [data, setData] = useState<VolunteerLogistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const res = await fetch(`/api/analytics/logistics/volunteers/${eventId}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load volunteer logistics');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: VolunteerLogistics }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load volunteer logistics'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { data, isLoading, error };
}

export function useRegistrationLogistics(eventId: string | null) {
  const [data, setData] = useState<RegistrationLogistics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const res = await fetch(`/api/analytics/logistics/registrations/${eventId}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load registration logistics');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: { sessions: RegistrationLogistics[] } }).data.sessions);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load registration logistics'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { data, isLoading, error };
}
