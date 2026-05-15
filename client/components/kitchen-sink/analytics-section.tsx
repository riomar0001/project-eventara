'use client';

import { TrendingUp, Users, Calendar, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDemographicAnalytics, useEventPerformance, useOngoingEventData, useHistoricalEventData } from '@/hooks/admin/analytics';
import { Section } from './shared';

const COLORS = ['#84cc16', '#a3e635', '#bef264'];

interface StatCard {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
}

function LoadingSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="text-muted-foreground size-8 animate-spin" />
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, change, trend }: StatCard) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{change}</p>
          </div>
          <Icon className="size-8 text-lime-200" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsSection() {
  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useEventPerformance();
  const { data: demographicData, isLoading: demographicLoading, error: demographicError } = useDemographicAnalytics();
  const { data: ongoingData, isLoading: ongoingLoading, error: ongoingError } = useOngoingEventData();
  const { data: historicalData, isLoading: historicalLoading, error: historicalError } = useHistoricalEventData();

  // Build KPI stat cards from performance data
  const statCards: StatCard[] = [];

  if (performanceData) {
    const totalRegistered = performanceData.event_attendance_rates.reduce((sum: number, e) => sum + e.registered_count, 0);
    const avgAttendanceRate =
      performanceData.event_attendance_rates.length > 0
        ? (
            performanceData.event_attendance_rates.reduce((sum: number, e) => sum + (e.attendance_rate_pct ?? 0), 0) /
            performanceData.event_attendance_rates.length
          ).toFixed(1)
        : 'N/A';
    const avgFeedback =
      performanceData.feedback_summaries.length > 0
        ? (performanceData.feedback_summaries.reduce((sum: number, f) => sum + (f.average_rating ?? 0), 0) / performanceData.feedback_summaries.length).toFixed(
            1
          )
        : 'N/A';
    const repeatRate = performanceData.repeat_attendee_rate_pct?.toFixed(1) ?? 'N/A';

    statCards.push(
      {
        icon: Users,
        label: 'Total Registered',
        value: totalRegistered,
        change: `${performanceData.event_attendance_rates.length} events tracked`,
        trend: 'up'
      },
      {
        icon: Calendar,
        label: 'Avg Attendance Rate',
        value: `${avgAttendanceRate}%`,
        change: 'Across all events',
        trend: 'up'
      },
      {
        icon: Activity,
        label: 'Avg Event Rating',
        value: avgFeedback,
        change: 'From feedback summaries',
        trend: 'up'
      },
      {
        icon: TrendingUp,
        label: 'Repeat Attendee Rate',
        value: `${repeatRate}%`,
        change: 'Returning participants',
        trend: 'up'
      }
    );
  }

  // Prepare feedback trend data for line chart
  const feedbackTrendData =
    performanceData?.feedback_trend?.slice(0, 12).map((point) => ({
      name: point.event_title?.substring(0, 10) || 'Event',
      rating: point.average_rating ?? 0,
      count: point.feedback_count
    })) || [];

  // Prepare event attendance data for bar chart
  const eventAttendanceData =
    performanceData?.event_attendance_rates?.slice(0, 10).map((e) => ({
      name: e.event_title?.substring(0, 15) || 'Event',
      registered: e.registered_count,
      attended: e.attended_count
    })) || [];

  // Prepare demographic breakdown
  const deviceData =
    demographicData?.device_breakdown?.map((d) => ({
      name: d.device_type,
      value: d.percentage ?? d.count
    })) || [];

  // Prepare top cities data
  const topCitiesData =
    demographicData?.top_cities?.slice(0, 5).map((c, idx) => ({
      rank: idx + 1,
      name: c.city,
      count: c.participant_count
    })) || [];

  // Prepare ongoing events data
  const ongoingEventsData =
    ongoingData?.started_events?.map((e) => ({
      name: e.event_title?.substring(0, 15) || 'Event',
      checkedIn: e.checked_in_count,
      remaining: e.remaining_slots ?? 0
    })) || [];

  // Prepare historical ended events
  const endedEventsData =
    historicalData?.ended_events?.slice(0, 8).map((e) => ({
      name: e.event_title?.substring(0, 12) || 'Event',
      registered: e.total_registered,
      attended: e.total_attended
    })) || [];

  const allErrors = [performanceError, demographicError, ongoingError, historicalError].filter((e): e is string => e !== null);

  return (
    <div className="space-y-6">
      {/* Errors Section */}
      {allErrors.length > 0 && (
        <Section title="Errors">
          <div className="space-y-2">
            {allErrors.map((err, idx) => (
              <ErrorAlert key={idx} message={err} />
            ))}
          </div>
        </Section>
      )}

      {/* KPI Cards */}
      <Section title="Analytics Dashboard">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {performanceLoading ? (
            <div className="col-span-full">
              <LoadingSpinner />
            </div>
          ) : statCards.length > 0 ? (
            statCards.map((stat) => <StatCard key={stat.label} {...stat} />)
          ) : (
            <div className="text-muted-foreground col-span-full text-center">No performance data available</div>
          )}
        </div>
      </Section>

      {/* Feedback Trend Chart */}
      {performanceLoading ? (
        <Section title="Feedback Trends (Last 12 Events)">
          <LoadingSpinner />
        </Section>
      ) : feedbackTrendData.length > 0 ? (
        <Section title="Feedback Trends (Last 12 Events)">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={feedbackTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rating" stroke="#84cc16" name="Avg Rating" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {/* Event Attendance Chart */}
      {performanceLoading ? (
        <Section title="Event Attendance (Top 10 Events)">
          <LoadingSpinner />
        </Section>
      ) : eventAttendanceData.length > 0 ? (
        <Section title="Event Attendance (Top 10 Events)">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="registered" fill="#84cc16" name="Registered" />
                  <Bar dataKey="attended" fill="#bef264" name="Attended" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {/* Device & Location Distribution */}
      {demographicLoading ? (
        <Section title="User Demographics">
          <LoadingSpinner />
        </Section>
      ) : (
        <Section title="User Demographics">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Device Breakdown */}
            {deviceData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${Math.round(value as number)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : null}

            {/* Top Cities */}
            {topCitiesData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Participating Cities</CardTitle>
                  <CardDescription>Top {topCitiesData.length} cities by participant count</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topCitiesData.map((city) => (
                    <div key={city.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {city.rank}. {city.name}
                        </p>
                        <span className="text-muted-foreground text-xs">{city.count} participants</span>
                      </div>
                      <div className="bg-muted h-2 w-full rounded-full">
                        <div className="h-full rounded-full bg-lime-400" style={{ width: `${(city.count / (topCitiesData[0]?.count || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </Section>
      )}

      {/* Ongoing Events */}
      {ongoingLoading ? (
        <Section title="Ongoing Events">
          <LoadingSpinner />
        </Section>
      ) : ongoingEventsData.length > 0 ? (
        <Section title="Ongoing Events - Live Check-ins">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ongoingEventsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="checkedIn" fill="#84cc16" name="Checked In" />
                  <Bar dataKey="remaining" fill="#a3e635" name="Remaining Slots" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {/* Historical Events */}
      {historicalLoading ? (
        <Section title="Historical Events Analysis">
          <LoadingSpinner />
        </Section>
      ) : endedEventsData.length > 0 ? (
        <Section title="Historical Events Analysis (Last 8 Events)">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={endedEventsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="registered" fill="#84cc16" name="Registered" />
                  <Bar dataKey="attended" fill="#bef264" name="Attended" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {/* Ended Events Summary Table */}
      {historicalLoading ? null : historicalData?.ended_events && historicalData.ended_events.length > 0 ? (
        <Section title="Recent Ended Events">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-muted-foreground text-left font-medium">Event</th>
                      <th className="text-muted-foreground text-right font-medium">Registered</th>
                      <th className="text-muted-foreground text-right font-medium">Attended</th>
                      <th className="text-muted-foreground text-right font-medium">Attendance %</th>
                      <th className="text-muted-foreground text-right font-medium">Avg Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.ended_events.slice(0, 10).map((event) => (
                      <tr key={event.event_id} className="border-b">
                        <td className="py-2">{event.event_title}</td>
                        <td className="text-right">{event.total_registered}</td>
                        <td className="text-right">{event.total_attended}</td>
                        <td className="text-right">
                          {event.total_registered > 0 ? ((event.total_attended / event.total_registered) * 100).toFixed(1) : 'N/A'}%
                        </td>
                        <td className="text-right">{event.average_feedback?.toFixed(1) ?? 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Section>
      ) : null}
    </div>
  );
}
