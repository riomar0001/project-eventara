'use client';

import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOngoingEventData } from '@/hooks/admin/analytics';
import { LoadingSkeleton, ErrorAlert, EmptyState } from './analytics-shared';

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function OngoingTab() {
  const { data, isLoading, error, refetch } = useOngoingEventData();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => refetch(), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch]);

  if (error) return <ErrorAlert message={error} />;
  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }
  if (!data) return <EmptyState message="No ongoing event data available" />;

  const hasAny = data.started_events.length > 0 || data.live_checkin_feed.length > 0 || data.session_progress.length > 0 || data.volunteer_on_duty.length > 0;

  if (!hasAny) return <EmptyState message="No ongoing activity at this time" />;

  return (
    <div className="space-y-6">
      {/* Started Events Summary */}
      {data.started_events.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.started_events.map((e) => {
            const total = e.checked_in_count + (e.remaining_slots ?? 0);
            const pct = total > 0 ? Math.round((e.checked_in_count / total) * 100) : 0;
            return (
              <Card key={e.event_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{e.event_title}</CardTitle>
                  <p className="text-muted-foreground text-xs">{e.session_count} sessions</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Checked in</span>
                    <span className="font-bold">{e.checked_in_count}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-muted-foreground text-xs">{e.remaining_slots !== null ? `${e.remaining_slots} slots remaining` : 'Unlimited slots'}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Live Check-in Feed */}
        {data.live_checkin_feed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Check-in Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <div className="space-y-3">
                  {data.live_checkin_feed.map((c) => (
                    <div key={c.participant_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{(c.alias ?? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()) || 'Unknown'}</p>
                        <p className="text-muted-foreground text-xs">{c.session_title}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={c.checkin_method === 'qr' ? 'default' : 'secondary'} className="text-xs">
                          {c.checkin_method}
                        </Badge>
                        <p className="text-muted-foreground mt-1 text-xs">{formatTime(c.checked_in_time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Session Progress */}
        {data.session_progress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.session_progress.map((s) => (
                <div key={s.session_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="max-w-[200px] truncate font-medium">{s.session_title}</span>
                    <span className="text-muted-foreground">{s.elapsed_pct}%</span>
                  </div>
                  <Progress value={s.elapsed_pct} className="h-2" />
                  <p className="text-muted-foreground text-xs">{s.event_title}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Volunteers on Duty */}
      {data.volunteer_on_duty.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Volunteers on Duty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.volunteer_on_duty.map((v) => (
                <div key={v.volunteer_id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{(v.alias ?? `${v.first_name ?? ''} ${v.last_name ?? ''}`.trim()) || 'Unknown'}</p>
                  <p className="text-muted-foreground text-xs">{v.role_name ?? 'Volunteer'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {v.contact_phone && <span className="text-muted-foreground text-xs">{v.contact_phone}</span>}
                    <Badge variant="outline" className="text-xs">
                      {v.event_title}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Withdrawals */}
      {data.pending_withdrawals.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg text-amber-800">Pending Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.pending_withdrawals.map((w) => (
                <Badge key={w.session_id} variant="outline" className="border-amber-300 text-amber-700">
                  {w.session_title}: {w.withdrawal_count} withdrawal{w.withdrawal_count !== 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Late Registrations */}
      {data.late_registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Late Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.late_registrations.map((r) => (
                <div key={r.participant_id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{(r.alias ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim()) || 'Unknown'}</p>
                    <p className="text-muted-foreground text-xs">{r.session_title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">{new Date(r.registered_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
