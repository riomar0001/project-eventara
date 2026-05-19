import { getAuthHeaders } from '@/lib/system/api-request';

// ── Types (mirrors API response shapes from the analytics hooks) ──

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

export interface EventPerformance {
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

export interface OngoingPerformance {
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

export interface HistoricalPerformance {
  year_over_year_attendance: YearOverYearAttendance[];
  events_by_status_over_time: EventStatusTransition[];
}

interface DeviceBreakdown {
  device_type: string;
  count: number;
  percentage: number | null;
}

interface OsBreakdown {
  os: string;
  count: number;
  percentage: number | null;
}

interface BrowserBreakdown {
  browser: string;
  count: number;
  percentage: number | null;
}

interface CityParticipation {
  city: string;
  country: string | null;
  participant_count: number;
}

interface AccountAgeDistribution {
  bucket: string;
  count: number;
  percentage: number | null;
}

interface VolunteerRoleBreakdown {
  role_name: string;
  count: number;
}

interface EventInterestCategory {
  category: string | null;
  event_count: number;
  registration_count: number;
}

interface FirstTimeVsReturning {
  event_id: string;
  event_title: string;
  first_time_count: number;
  returning_count: number;
}

interface GenderDistribution {
  gender: string;
  count: number;
  percentage: number | null;
}

interface GeographicSpread {
  city: string;
  latitude: number | null;
  longitude: number | null;
  participant_count: number;
}

export interface DemographicAnalytics {
  device_breakdown: DeviceBreakdown[];
  os_breakdown: OsBreakdown[];
  browser_breakdown: BrowserBreakdown[];
  top_cities: CityParticipation[];
  account_age_distribution: AccountAgeDistribution[];
  volunteer_role_breakdown: VolunteerRoleBreakdown[];
  event_interest_categories: EventInterestCategory[];
  first_time_vs_returning: FirstTimeVsReturning[];
  gender_distribution: GenderDistribution[];
  geographic_spread: GeographicSpread[];
}

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

export interface OngoingEventData {
  started_events: StartedEventSummary[];
  live_checkin_feed: LiveCheckinEntry[];
  volunteer_on_duty: VolunteerOnDuty[];
  session_progress: SessionProgress[];
  pending_withdrawals: PendingWithdrawalAlert[];
  late_registrations: LateRegistration[];
}

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

export interface HistoricalEventData {
  ended_events: EndedEventSummary[];
  cancelled_events: CancelledEventReport[];
  feedback_completeness: FeedbackCompleteness[];
  period_comparisons: PeriodComparison[] | null;
  total_count: number;
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

export interface SessionTimeline {
  ongoing: SessionTimelineEntry[];
  upcoming: SessionTimelineEntry[];
  completed: SessionTimelineEntry[];
}

// ── Combined result ──

export interface CombinedAnalyticsData {
  eventPerformance: EventPerformance | null;
  ongoingPerformance: OngoingPerformance | null;
  historicalPerformance: HistoricalPerformance | null;
  demographics: DemographicAnalytics | null;
  ongoing: OngoingEventData | null;
  historical: HistoricalEventData | null;
  timeline: SessionTimeline | null;
  errors: Record<string, string>;
}

// ── Fetch helpers ──

async function fetchEndpoint<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      console.warn(`CSV export: ${url} returned ${res.status}`);
      return null;
    }
    const json = await res.json();
    return (json as { data: T }).data;
  } catch (err) {
    console.warn(`CSV export: ${url} failed`, err);
    return null;
  }
}

// ── Main export ──

export async function fetchAllAnalyticsData(): Promise<CombinedAnalyticsData> {
  const results = await Promise.allSettled([
    fetchEndpoint<EventPerformance>('/api/analytics/performance/event'),
    fetchEndpoint<OngoingPerformance>('/api/analytics/performance/ongoing'),
    fetchEndpoint<HistoricalPerformance>('/api/analytics/performance/historical'),
    fetchEndpoint<DemographicAnalytics>('/api/analytics/demographics'),
    fetchEndpoint<OngoingEventData>('/api/analytics/ongoing'),
    fetchEndpoint<HistoricalEventData>('/api/analytics/historical'),
    fetchEndpoint<SessionTimeline>('/api/analytics/logistics/timeline')
  ]);

  const keys = ['eventPerformance', 'ongoingPerformance', 'historicalPerformance', 'demographics', 'ongoing', 'historical', 'timeline'];

  const errors: Record<string, string> = {};
  const values = results.map((r, i) => {
    if (r.status === 'fulfilled') {
      if (r.value === null) errors[keys[i]] = 'No data returned';
      return r.value;
    }
    errors[keys[i]] = r.reason?.message ?? 'Request failed';
    return null;
  });

  return {
    eventPerformance: values[0] as EventPerformance | null,
    ongoingPerformance: values[1] as OngoingPerformance | null,
    historicalPerformance: values[2] as HistoricalPerformance | null,
    demographics: values[3] as DemographicAnalytics | null,
    ongoing: values[4] as OngoingEventData | null,
    historical: values[5] as HistoricalEventData | null,
    timeline: values[6] as SessionTimeline | null,
    errors
  };
}
