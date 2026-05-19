import { toCsvRow } from './csv-utils';
import type {
  CombinedAnalyticsData,
  DemographicAnalytics,
  EventPerformance,
  HistoricalEventData,
  HistoricalPerformance,
  OngoingEventData,
  OngoingPerformance,
  SessionTimeline
} from './fetch-analytics';

// ── Helpers ──

function sectionHeader(label: string): string {
  return `--- ${label} ---`;
}

function arraySection<T>(label: string, headers: string[], items: T[] | null | undefined, rowFn: (item: T) => unknown[]): string {
  const lines: string[] = [sectionHeader(label), toCsvRow(headers)];
  if (!items || items.length === 0) {
    lines.push('No data available');
  } else {
    for (const item of items) {
      lines.push(toCsvRow(rowFn(item)));
    }
  }
  lines.push('');
  return lines.join('\n');
}

function kpiSection(label: string, kpis: [string, unknown][]): string {
  const lines: string[] = [sectionHeader(label), toCsvRow(['Metric', 'Value'])];
  for (const [metric, value] of kpis) {
    lines.push(toCsvRow([metric, value]));
  }
  lines.push('');
  return lines.join('\n');
}

// ── Tab-specific section builders ──

function buildPerformanceSections(ep: EventPerformance | null): string {
  if (!ep) return sectionHeader('Performance') + '\nNo data available\n\n';

  const parts: string[] = [];

  parts.push(
    kpiSection('Performance: Overview', [
      ['repeat_attendee_rate_pct', ep.repeat_attendee_rate_pct],
      ['average_registration_to_checkin_lead_time_hours', ep.average_registration_to_checkin_lead_time_hours]
    ])
  );

  parts.push(
    arraySection(
      'Performance: Attendance Rates (Sessions)',
      ['session_id', 'session_title', 'event_id', 'registered_count', 'attended_count', 'attendance_rate_pct'],
      ep.attendance_rates,
      (r) => [r.session_id, r.session_title, r.event_id, r.registered_count, r.attended_count, r.attendance_rate_pct]
    )
  );

  parts.push(
    arraySection(
      'Performance: Event Attendance Rates',
      ['event_id', 'event_title', 'registered_count', 'attended_count', 'attendance_rate_pct'],
      ep.event_attendance_rates,
      (r) => [r.event_id, r.event_title, r.registered_count, r.attended_count, r.attendance_rate_pct]
    )
  );

  parts.push(
    arraySection('Performance: Feedback Summaries', ['event_id', 'event_title', 'average_rating', 'total_feedback_count'], ep.feedback_summaries, (r) => [
      r.event_id,
      r.event_title,
      r.average_rating,
      r.total_feedback_count
    ])
  );

  parts.push(
    arraySection('Performance: Feedback Trend', ['event_id', 'event_title', 'end_date', 'average_rating', 'feedback_count'], ep.feedback_trend, (r) => [
      r.event_id,
      r.event_title,
      r.end_date,
      r.average_rating,
      r.feedback_count
    ])
  );

  parts.push(
    arraySection('Performance: Top Rated Events', ['event_id', 'event_title', 'average_rating', 'feedback_count'], ep.top_rated_events, (r) => [
      r.event_id,
      r.event_title,
      r.average_rating,
      r.feedback_count
    ])
  );

  parts.push(
    arraySection(
      'Performance: Volunteer Performance',
      ['volunteer_id', 'user_id', 'first_name', 'last_name', 'alias', 'role_name', 'joined_count', 'left_count'],
      ep.volunteer_performance,
      (r) => [r.volunteer_id, r.user_id, r.first_name, r.last_name, r.alias, r.role_name, r.joined_count, r.left_count]
    )
  );

  parts.push(
    arraySection(
      'Performance: Organizer Output',
      ['organizer_id', 'first_name', 'last_name', 'alias', 'total_events_created', 'average_sessions_per_event', 'average_attendance_rate_pct'],
      ep.organizer_output,
      (r) => [r.organizer_id, r.first_name, r.last_name, r.alias, r.total_events_created, r.average_sessions_per_event, r.average_attendance_rate_pct]
    )
  );

  parts.push(arraySection('Performance: Session Status Distribution', ['status', 'count'], ep.session_status_distribution, (r) => [r.status, r.count]));

  return parts.join('\n');
}

function buildOngoingPerformanceSections(op: OngoingPerformance | null): string {
  if (!op) return sectionHeader('Performance (Ongoing)') + '\nNo data available\n\n';

  const parts: string[] = [];

  parts.push(
    arraySection(
      'Performance (Ongoing): Live Attendance',
      ['session_id', 'session_title', 'event_id', 'event_title', 'checked_in_count', 'max_slots', 'remaining_slots'],
      op.live_attendance,
      (r) => [r.session_id, r.session_title, r.event_id, r.event_title, r.checked_in_count, r.max_slots, r.remaining_slots]
    )
  );

  parts.push(
    arraySection(
      'Performance (Ongoing): Real-time Slot Availability',
      ['session_id', 'session_title', 'event_id', 'event_title', 'checked_in_count', 'max_slots', 'remaining_slots'],
      op.real_time_slot_availability,
      (r) => [r.session_id, r.session_title, r.event_id, r.event_title, r.checked_in_count, r.max_slots, r.remaining_slots]
    )
  );

  return parts.join('\n');
}

function buildHistoricalPerformanceSections(hp: HistoricalPerformance | null): string {
  if (!hp) return sectionHeader('Performance (Historical)') + '\nNo data available\n\n';

  const parts: string[] = [];

  parts.push(
    arraySection('Performance (Historical): Year-over-Year Attendance', ['year', 'attended_count', 'growth_pct'], hp.year_over_year_attendance, (r) => [
      r.year,
      r.attended_count,
      r.growth_pct
    ])
  );

  parts.push(
    arraySection('Performance (Historical): Events by Status Over Time', ['period', 'status', 'count'], hp.events_by_status_over_time, (r) => [
      r.period,
      r.status,
      r.count
    ])
  );

  return parts.join('\n');
}

function buildDemographicsSections(d: DemographicAnalytics | null): string {
  if (!d) return sectionHeader('Demographics') + '\nNo data available\n\n';

  const parts: string[] = [];

  parts.push(
    arraySection('Demographics: Device Breakdown', ['device_type', 'count', 'percentage'], d.device_breakdown, (r) => [r.device_type, r.count, r.percentage])
  );

  parts.push(arraySection('Demographics: OS Breakdown', ['os', 'count', 'percentage'], d.os_breakdown, (r) => [r.os, r.count, r.percentage]));

  parts.push(
    arraySection('Demographics: Browser Breakdown', ['browser', 'count', 'percentage'], d.browser_breakdown, (r) => [r.browser, r.count, r.percentage])
  );

  parts.push(
    arraySection('Demographics: Top Participating Cities', ['city', 'country', 'participant_count'], d.top_cities, (r) => [
      r.city,
      r.country,
      r.participant_count
    ])
  );

  parts.push(
    arraySection('Demographics: Account Age Distribution', ['bucket', 'count', 'percentage'], d.account_age_distribution, (r) => [
      r.bucket,
      r.count,
      r.percentage
    ])
  );

  parts.push(arraySection('Demographics: Volunteer Role Breakdown', ['role_name', 'count'], d.volunteer_role_breakdown, (r) => [r.role_name, r.count]));

  parts.push(
    arraySection('Demographics: Event Interest Categories', ['category', 'event_count', 'registration_count'], d.event_interest_categories, (r) => [
      r.category,
      r.event_count,
      r.registration_count
    ])
  );

  parts.push(
    arraySection(
      'Demographics: First-Time vs Returning',
      ['event_id', 'event_title', 'first_time_count', 'returning_count'],
      d.first_time_vs_returning,
      (r) => [r.event_id, r.event_title, r.first_time_count, r.returning_count]
    )
  );

  parts.push(
    arraySection('Demographics: Gender Distribution', ['gender', 'count', 'percentage'], d.gender_distribution, (r) => [r.gender, r.count, r.percentage])
  );

  parts.push(
    arraySection('Demographics: Geographic Spread', ['city', 'latitude', 'longitude', 'participant_count'], d.geographic_spread, (r) => [
      r.city,
      r.latitude,
      r.longitude,
      r.participant_count
    ])
  );

  return parts.join('\n');
}

function buildOngoingSections(o: OngoingEventData | null): string {
  if (!o) return sectionHeader('Ongoing Events') + '\nNo data available\n\n';

  const parts: string[] = [];

  parts.push(
    arraySection('Ongoing: Started Events', ['event_id', 'event_title', 'session_count', 'checked_in_count', 'remaining_slots'], o.started_events, (r) => [
      r.event_id,
      r.event_title,
      r.session_count,
      r.checked_in_count,
      r.remaining_slots
    ])
  );

  parts.push(
    arraySection(
      'Ongoing: Live Check-in Feed',
      [
        'participant_id',
        'user_id',
        'first_name',
        'last_name',
        'alias',
        'session_id',
        'session_title',
        'event_id',
        'event_title',
        'checked_in_time',
        'checkin_method'
      ],
      o.live_checkin_feed,
      (r) => [
        r.participant_id,
        r.user_id,
        r.first_name,
        r.last_name,
        r.alias,
        r.session_id,
        r.session_title,
        r.event_id,
        r.event_title,
        r.checked_in_time,
        r.checkin_method
      ]
    )
  );

  parts.push(
    arraySection(
      'Ongoing: Volunteers on Duty',
      ['volunteer_id', 'user_id', 'first_name', 'last_name', 'alias', 'contact_phone', 'role_name', 'event_id', 'event_title'],
      o.volunteer_on_duty,
      (r) => [r.volunteer_id, r.user_id, r.first_name, r.last_name, r.alias, r.contact_phone, r.role_name, r.event_id, r.event_title]
    )
  );

  parts.push(
    arraySection(
      'Ongoing: Session Progress',
      ['session_id', 'session_title', 'event_id', 'event_title', 'start_datetime', 'end_datetime', 'elapsed_pct'],
      o.session_progress,
      (r) => [r.session_id, r.session_title, r.event_id, r.event_title, r.start_datetime, r.end_datetime, r.elapsed_pct]
    )
  );

  parts.push(
    arraySection('Ongoing: Pending Withdrawals', ['session_id', 'session_title', 'event_id', 'withdrawal_count'], o.pending_withdrawals, (r) => [
      r.session_id,
      r.session_title,
      r.event_id,
      r.withdrawal_count
    ])
  );

  parts.push(
    arraySection(
      'Ongoing: Late Registrations',
      ['participant_id', 'user_id', 'first_name', 'last_name', 'alias', 'session_id', 'session_title', 'event_id', 'registered_at', 'session_started_at'],
      o.late_registrations,
      (r) => [r.participant_id, r.user_id, r.first_name, r.last_name, r.alias, r.session_id, r.session_title, r.event_id, r.registered_at, r.session_started_at]
    )
  );

  return parts.join('\n');
}

function buildHistoricalSections(h: HistoricalEventData | null): string {
  if (!h) return sectionHeader('Historical Events') + '\nNo data available\n\n';

  const parts: string[] = [];

  parts.push(
    arraySection(
      'Historical: Ended Events',
      ['event_id', 'event_title', 'start_date', 'end_date', 'total_registered', 'total_attended', 'total_no_show', 'total_cancelled', 'average_feedback'],
      h.ended_events,
      (r) => [r.event_id, r.event_title, r.start_date, r.end_date, r.total_registered, r.total_attended, r.total_no_show, r.total_cancelled, r.average_feedback]
    )
  );

  parts.push(
    arraySection(
      'Historical: Cancelled Events',
      ['event_id', 'event_title', 'cancelled_at', 'created_by', 'creator_first_name', 'creator_last_name', 'creator_alias', 'session_count'],
      h.cancelled_events,
      (r) => [r.event_id, r.event_title, r.cancelled_at, r.created_by, r.creator_first_name, r.creator_last_name, r.creator_alias, r.session_count]
    )
  );

  parts.push(
    arraySection(
      'Historical: Feedback Completeness',
      ['event_id', 'event_title', 'attended_count', 'feedback_count', 'completeness_rate_pct'],
      h.feedback_completeness,
      (r) => [r.event_id, r.event_title, r.attended_count, r.feedback_count, r.completeness_rate_pct]
    )
  );

  parts.push(
    arraySection(
      'Historical: Period Comparisons',
      ['period_label', 'from_date', 'to_date', 'total_events', 'total_registered', 'total_attended', 'average_attendance_rate_pct', 'average_feedback'],
      h.period_comparisons,
      (r) => [r.period_label, r.from_date, r.to_date, r.total_events, r.total_registered, r.total_attended, r.average_attendance_rate_pct, r.average_feedback]
    )
  );

  return parts.join('\n');
}

function buildTimelineSections(t: SessionTimeline | null): string {
  if (!t) return sectionHeader('Logistics: Session Timeline') + '\nNo data available\n\n';

  const cols = ['session_id', 'session_title', 'event_id', 'event_title', 'venue_id', 'venue_name', 'start_datetime', 'end_datetime', 'status'];
  const rowFn = (r: {
    session_id: string;
    session_title: string;
    event_id: string;
    event_title: string;
    venue_id: string;
    venue_name: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
  }) => [r.session_id, r.session_title, r.event_id, r.event_title, r.venue_id, r.venue_name, r.start_datetime, r.end_datetime, r.status];

  const parts: string[] = [];
  parts.push(arraySection('Logistics: Session Timeline (Ongoing)', cols, t.ongoing, rowFn));
  parts.push(arraySection('Logistics: Session Timeline (Upcoming)', cols, t.upcoming, rowFn));
  parts.push(arraySection('Logistics: Session Timeline (Completed)', cols, t.completed, rowFn));

  return parts.join('\n');
}

function buildMetadataSection(data: CombinedAnalyticsData): string {
  const lines: string[] = [sectionHeader('Export Metadata'), toCsvRow(['Field', 'Value'])];
  lines.push(toCsvRow(['exported_at', new Date().toISOString()]));

  const errorKeys = Object.keys(data.errors);
  lines.push(toCsvRow(['endpoints_with_errors', errorKeys.length]));
  if (errorKeys.length > 0) {
    lines.push(toCsvRow(['error_details', errorKeys.map((k) => `${k}: ${data.errors[k]}`).join('; ')]));
  }
  lines.push('');
  return lines.join('\n');
}

// ── Main ──

export function generateAnalyticsCsv(data: CombinedAnalyticsData): string {
  const sections: string[] = [];

  sections.push(buildPerformanceSections(data.eventPerformance));
  sections.push(buildOngoingPerformanceSections(data.ongoingPerformance));
  sections.push(buildHistoricalPerformanceSections(data.historicalPerformance));
  sections.push(buildDemographicsSections(data.demographics));
  sections.push(buildOngoingSections(data.ongoing));
  sections.push(buildHistoricalSections(data.historical));
  sections.push(buildTimelineSections(data.timeline));
  sections.push(buildMetadataSection(data));

  return sections.join('\n');
}
