'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useHistoricalEventData, useCancelledEventsReport } from '@/hooks/admin/analytics';
import { LoadingSkeleton, ErrorAlert, EmptyState } from './analytics-shared';

const LIME = 'oklch(0.648 0.2 131.684)';
const LIME_LIGHT = 'oklch(0.879 0.169 91.605)';
const LIME_PALE = 'oklch(0.922 0.08 110)';

export function HistoricalTab() {
  const { data, isLoading, error } = useHistoricalEventData();
  const { data: cancelledData, isLoading: cancelledLoading } = useCancelledEventsReport();

  if (error) return <ErrorAlert message={error} />;
  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }
  if (!data) return <EmptyState />;

  const attendanceVsNoShow = data.ended_events.slice(0, 8).map((e) => ({
    name: e.event_title?.substring(0, 12) ?? 'Event',
    attended: e.total_attended,
    noShow: e.total_no_show
  }));

  const completenessData = data.feedback_completeness.map((f) => ({
    name: f.event_title?.substring(0, 12) ?? 'Event',
    rate: f.completeness_rate_pct ?? 0
  }));

  const periodData = (data.period_comparisons ?? []).map((p) => ({
    name: p.period_label,
    registered: p.total_registered,
    attended: p.total_attended
  }));

  const attConfig = { attended: { label: 'Attended', color: LIME }, noShow: { label: 'No Show', color: LIME_PALE } };
  const periodConfig = { registered: { label: 'Registered', color: LIME_LIGHT }, attended: { label: 'Attended', color: LIME } };

  const hasAny = data.ended_events.length > 0 || completenessData.length > 0 || periodData.length > 0 || (cancelledData && cancelledData.length > 0);

  if (!hasAny) return <EmptyState message="No historical event data available" />;

  return (
    <div className="space-y-6">
      {/* Ended Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ended Events</CardTitle>
          <CardDescription>{data.total_count} events total</CardDescription>
        </CardHeader>
        <CardContent>
          {data.ended_events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Registered</TableHead>
                  <TableHead className="text-right">Attended</TableHead>
                  <TableHead className="text-right">No-Show</TableHead>
                  <TableHead className="text-right">Cancelled</TableHead>
                  <TableHead className="text-right">Avg Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ended_events.map((e) => {
                  const pct = e.total_registered > 0 ? ((e.total_attended / e.total_registered) * 100).toFixed(1) : 'N/A';
                  return (
                    <TableRow key={e.event_id}>
                      <TableCell className="max-w-[180px] truncate font-medium">{e.event_title}</TableCell>
                      <TableCell className="text-right">{e.total_registered}</TableCell>
                      <TableCell className="text-right">
                        {e.total_attended}
                        <span className="text-muted-foreground ml-1 text-xs">({pct}%)</span>
                      </TableCell>
                      <TableCell className="text-right">{e.total_no_show}</TableCell>
                      <TableCell className="text-right">{e.total_cancelled}</TableCell>
                      <TableCell className="text-right">{e.average_feedback?.toFixed(1) ?? 'N/A'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No ended events found" />
          )}
        </CardContent>
      </Card>

      {/* Attendance vs No-Show Stacked Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance vs No-Show</CardTitle>
          <CardDescription>Top ended events</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceVsNoShow.length > 0 ? (
            <ChartContainer config={attConfig} className="h-72 w-full">
              <BarChart data={attendanceVsNoShow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="attended" stackId="a" fill={LIME} radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="noShow" stackId="a" fill={LIME_PALE} radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="No attendance data available" />
          )}
        </CardContent>
      </Card>

      {/* Feedback Completeness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feedback Completeness</CardTitle>
          <CardDescription>% of attendees who left feedback</CardDescription>
        </CardHeader>
        <CardContent>
          {completenessData.length > 0 ? (
            <ChartContainer config={{ rate: { label: 'Completion %', color: LIME } }} className="h-64 w-full">
              <BarChart data={completenessData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="rate" fill={LIME} radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="No feedback completeness data available" />
          )}
        </CardContent>
      </Card>

      {/* Period Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Period Comparisons</CardTitle>
        </CardHeader>
        <CardContent>
          {periodData.length > 0 ? (
            <ChartContainer config={periodConfig} className="h-72 w-full">
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="registered" fill={LIME_LIGHT} radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="attended" fill={LIME} radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="No period comparisons available" />
          )}
        </CardContent>
      </Card>

      {/* Cancelled Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cancelled Events</CardTitle>
        </CardHeader>
        <CardContent>
          {cancelledLoading ? (
            <LoadingSkeleton height={120} />
          ) : cancelledData && cancelledData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Cancelled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelledData.map((c) => (
                  <TableRow key={c.event_id}>
                    <TableCell className="font-medium">{c.event_title}</TableCell>
                    <TableCell>{(c.creator_alias ?? `${c.creator_first_name ?? ''} ${c.creator_last_name ?? ''}`.trim()) || 'Unknown'}</TableCell>
                    <TableCell className="text-right">{c.session_count}</TableCell>
                    <TableCell className="text-muted-foreground text-right text-xs">
                      {c.cancelled_at ? new Date(c.cancelled_at).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No cancelled events" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
