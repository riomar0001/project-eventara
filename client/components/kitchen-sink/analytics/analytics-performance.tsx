'use client';

import { Users, TrendingUp, Activity, Repeat } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEventPerformance } from '@/hooks/admin/analytics';
import { KpiCard, KpiCardSkeleton, LoadingSkeleton, ErrorAlert, EmptyState } from './analytics-shared';

const LIME = 'oklch(0.648 0.2 131.684)';
const LIME_LIGHT = 'oklch(0.879 0.169 91.605)';
const LIME_PALE = 'oklch(0.922 0.08 110)';
const DONUT_COLORS = [LIME, LIME_LIGHT, LIME_PALE, 'oklch(0.556 0.15 131)', 'oklch(0.75 0.18 120)'];

export function PerformanceTab() {
  const { data, isLoading, error } = useEventPerformance();

  if (error) return <ErrorAlert message={error} />;
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }
  if (!data) return <EmptyState />;

  const totalRegistered = data.event_attendance_rates.reduce((s, e) => s + e.registered_count, 0);
  const totalAttended = data.event_attendance_rates.reduce((s, e) => s + e.attended_count, 0);
  const avgRate =
    data.event_attendance_rates.length > 0
      ? data.event_attendance_rates.reduce((s, e) => s + (e.attendance_rate_pct ?? 0), 0) / data.event_attendance_rates.length
      : null;

  const feedbackTrendData = data.feedback_trend.slice(0, 12).map((p) => ({
    name: p.event_title?.substring(0, 12) ?? 'Event',
    date: p.end_date,
    rating: p.average_rating ?? 0
  }));

  const attendanceData = data.event_attendance_rates.slice(0, 10).map((e) => ({
    name: e.event_title?.substring(0, 15) ?? 'Event',
    registered: e.registered_count,
    attended: e.attended_count
  }));

  const sessionStatusData = data.session_status_distribution.map((s) => ({
    name: s.status,
    value: s.count
  }));

  const feedbackConfig = { rating: { label: 'Avg Rating', color: LIME } };
  const attendanceConfig = {
    registered: { label: 'Registered', color: LIME },
    attended: { label: 'Attended', color: LIME_LIGHT }
  };
  const donutConfig = Object.fromEntries(sessionStatusData.map((d, i) => [d.name, { label: d.name, color: DONUT_COLORS[i % DONUT_COLORS.length] }]));

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Users} label="Total Registered" value={totalRegistered} sublabel={`${data.event_attendance_rates.length} events`} />
        <KpiCard icon={TrendingUp} label="Total Attended" value={totalAttended} sublabel="Across all sessions" />
        <KpiCard icon={Activity} label="Avg Attendance Rate" value={avgRate !== null ? `${avgRate.toFixed(1)}%` : 'N/A'} sublabel="Per event average" />
        <KpiCard
          icon={Repeat}
          label="Repeat Rate"
          value={data.repeat_attendee_rate_pct !== null ? `${data.repeat_attendee_rate_pct.toFixed(1)}%` : 'N/A'}
          sublabel="Returning attendees"
        />
      </div>

      {/* Feedback Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feedback Trends</CardTitle>
          <CardDescription>Last {feedbackTrendData.length} ended events</CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackTrendData.length > 0 ? (
            <ChartContainer config={feedbackConfig} className="h-72 w-full">
              <LineChart data={feedbackTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[0, 5]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="rating" stroke={LIME} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyState message="No feedback trend data available" />
          )}
        </CardContent>
      </Card>

      {/* Event Attendance Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Attendance Rates</CardTitle>
          <CardDescription>Registered vs attended per event</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceData.length > 0 ? (
            <ChartContainer config={attendanceConfig} className="h-80 w-full">
              <BarChart data={attendanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="registered" fill={LIME} radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="attended" fill={LIME_LIGHT} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="No event attendance data available" />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Rated Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Rated Events</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_rated_events.length > 0 ? (
              <div className="space-y-3">
                {data.top_rated_events.map((e, i) => (
                  <div key={e.event_id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {i + 1}. {e.event_title}
                      </p>
                      <p className="text-muted-foreground text-xs">{e.feedback_count} reviews</p>
                    </div>
                    <span className="text-sm font-bold text-lime-600">{e.average_rating.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No rated events yet" />
            )}
          </CardContent>
        </Card>

        {/* Session Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionStatusData.length > 0 ? (
              <ChartContainer config={donutConfig} className="mx-auto h-64 w-full max-w-xs">
                <PieChart>
                  <Pie data={sessionStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {sessionStatusData.map((_, idx) => (
                      <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyState message="No session status data available" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organizer Output Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organizer Output</CardTitle>
        </CardHeader>
        <CardContent>
          {data.organizer_output.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organizer</TableHead>
                  <TableHead className="text-right">Events Created</TableHead>
                  <TableHead className="text-right">Avg Sessions/Event</TableHead>
                  <TableHead className="text-right">Avg Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.organizer_output.map((o) => (
                  <TableRow key={o.organizer_id}>
                    <TableCell className="font-medium">{(o.alias ?? `${o.first_name ?? ''} ${o.last_name ?? ''}`.trim()) || 'Unknown'}</TableCell>
                    <TableCell className="text-right">{o.total_events_created}</TableCell>
                    <TableCell className="text-right">{o.average_sessions_per_event?.toFixed(1) ?? 'N/A'}</TableCell>
                    <TableCell className="text-right">{o.average_attendance_rate_pct?.toFixed(1) ?? 'N/A'}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No organizer data available" />
          )}
        </CardContent>
      </Card>

      {/* Volunteer Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Volunteer Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {data.volunteer_performance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                  <TableHead className="text-right">Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.volunteer_performance.map((v) => (
                  <TableRow key={v.volunteer_id}>
                    <TableCell className="font-medium">{(v.alias ?? `${v.first_name ?? ''} ${v.last_name ?? ''}`.trim()) || 'Unknown'}</TableCell>
                    <TableCell>{v.role_name ?? '—'}</TableCell>
                    <TableCell className="text-right">{v.joined_count}</TableCell>
                    <TableCell className="text-right">{v.left_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No volunteer performance data available" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
