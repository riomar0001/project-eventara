'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSessionTimeline, useEventLogisticsOverview, useVolunteerLogistics, useRegistrationLogistics } from '@/hooks/admin/analytics';
import { LoadingSkeleton, LoadingSpinner, ErrorAlert, EmptyState } from './analytics-shared';
import { Events } from '@/api/sdk.gen';
import type { EventRecordResponse } from '@/api/types.gen';

const LIME = 'oklch(0.648 0.2 131.684)';
const LIME_LIGHT = 'oklch(0.879 0.169 91.605)';

function statusColor(status: string) {
  if (status === 'started' || status === 'ongoing') return 'text-green-600 bg-green-50';
  if (status === 'scheduled' || status === 'upcoming') return 'text-blue-600 bg-blue-50';
  return 'text-muted-foreground bg-muted';
}

function eventStatusBadge(status: string) {
  switch (status) {
    case 'started':
      return { variant: 'default' as const, label: 'Live' };
    case 'posted':
      return { variant: 'secondary' as const, label: 'Upcoming' };
    case 'ended':
      return { variant: 'outline' as const, label: 'Ended' };
    case 'cancelled':
      return { variant: 'destructive' as const, label: 'Cancelled' };
    case 'draft':
      return { variant: 'ghost' as const, label: 'Draft' };
    default:
      return { variant: 'outline' as const, label: status };
  }
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function matchesDate(query: string, event: EventRecordResponse) {
  const trimmed = query.trim();
  // Match YYYY-MM-DD or partial
  if (!/^\d{1,4}(-\d{1,2}(-\d{1,2})?)?$/.test(trimmed)) return false;
  const start = event.start_date.substring(0, 10);
  const end = event.end_date.substring(0, 10);
  return start.includes(trimmed) || end.includes(trimmed);
}

function EventSearchCombobox({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<EventRecordResponse[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Events.getAllEventsEventsGet({ query: { page_size: 100 } })
      .then((r) => r.data)
      .then((data) => {
        if (data?.data) setEvents(data.data);
      })
      .catch(() => setEvents([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      if (e.title.toLowerCase().includes(q)) return true;
      if (matchesDate(query, e)) return true;
      return false;
    });
  }, [events, query]);

  const selectedEvent = events.find((e) => e.id === value);

  function handleSelect(id: string) {
    onChange(id);
    const ev = events.find((e) => e.id === id);
    setQuery(ev?.title ?? '');
    setOpen(false);
    setHighlightedIdx(0);
  }

  function handleClear() {
    onChange('');
    setQuery('');
    setOpen(false);
    setHighlightedIdx(0);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') setOpen(true);
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightedIdx]) handleSelect(filtered[highlightedIdx].id);
        break;
      case 'Escape':
        setOpen(false);
        setHighlightedIdx(0);
        break;
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative flex w-full max-w-lg items-center">
              <Search className="text-muted-foreground absolute left-3 size-4" />
              <Input
                ref={inputRef}
                placeholder={selectedEvent ? selectedEvent.title : 'Search events by title or date...'}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                  setHighlightedIdx(0);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                className="pr-9 pl-9"
              />
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground absolute right-3"
                  aria-label="Clear selection"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <ScrollArea className="max-h-72">
              {filtered.length === 0 ? (
                <p className="text-muted-foreground p-4 text-center text-sm">{events.length === 0 ? 'Loading events...' : 'No events found'}</p>
              ) : (
                <div className="py-1">
                  {query.trim() === '' && <p className="text-muted-foreground px-3 py-2 text-xs">Type to search events by title or date (e.g. 2025-01-15)</p>}
                  {filtered.map((event, idx) => {
                    const badge = eventStatusBadge(event.status);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        className={`hover:bg-muted flex w-full items-center gap-3 px-3 py-2 text-left ${idx === highlightedIdx ? 'bg-muted' : ''}`}
                        onClick={() => handleSelect(event.id)}
                        onMouseEnter={() => setHighlightedIdx(idx)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{event.title}</p>
                          <p className="text-muted-foreground text-xs">{formatEventDate(event.start_date)}</p>
                        </div>
                        <Badge variant={badge.variant} className="shrink-0 text-xs">
                          {badge.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}

export function LogisticsTab() {
  const [eventId, setEventId] = useState('');

  const { data: timeline, isLoading: timelineLoading, error: timelineError } = useSessionTimeline();

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useEventLogisticsOverview(eventId || null);

  const { data: volunteerData, isLoading: volunteerLoading, error: volunteerError } = useVolunteerLogistics(eventId || null);

  const { data: registrationData, isLoading: registrationLoading, error: registrationError } = useRegistrationLogistics(eventId || null);

  return (
    <div className="space-y-6">
      {/* Session Timeline */}
      {timelineError && <ErrorAlert message={timelineError} />}
      {timelineLoading ? (
        <LoadingSkeleton height={200} />
      ) : timeline ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['ongoing', 'upcoming', 'completed'] as const).map((section) => {
            const items = timeline[section];
            const titles = { ongoing: 'Ongoing', upcoming: 'Upcoming', completed: 'Completed' };
            const colors = { ongoing: 'border-l-green-400', upcoming: 'border-l-blue-400', completed: 'border-l-muted' };
            return (
              <Card key={section}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{titles[section]}</CardTitle>
                  <CardDescription>{items.length} sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-72 space-y-3 overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-muted-foreground py-4 text-center text-xs">No {section} sessions</p>
                    ) : (
                      items.slice(0, 15).map((s) => (
                        <div key={s.session_id} className={`rounded border-l-4 p-2 ${colors[section]}`}>
                          <p className="truncate text-sm font-medium">{s.session_title}</p>
                          <p className="text-muted-foreground text-xs">{s.event_title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">{s.venue_name}</span>
                            <Badge variant="outline" className={`text-xs ${statusColor(s.status)}`}>
                              {s.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* Event search */}
      <EventSearchCombobox value={eventId} onChange={setEventId} />

      {!eventId && <EmptyState message="Search and select an event above to load detailed logistics" />}

      {eventId && overviewLoading && <LoadingSpinner />}
      {eventId && overviewError && <ErrorAlert message={overviewError} />}

      {/* Session Utilisation + Venue Capacity */}
      {eventId && overview ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Utilisation</CardTitle>
              <CardDescription>{overview.event_title}</CardDescription>
            </CardHeader>
            <CardContent>
              {overview.session_utilisation.length > 0 ? (
                <ChartContainer config={{ checked_in: { label: 'Checked In', color: LIME } }} className="h-64 w-full">
                  <BarChart
                    data={overview.session_utilisation.map((s) => ({
                      name: s.session_title?.substring(0, 12) ?? 'Session',
                      checked_in: s.checked_in,
                      pct: s.utilisation_pct ?? 0,
                      over: s.over_capacity
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={110} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="checked_in" fill={LIME} radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyState message="No session utilisation data available" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Venue Capacity vs Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.venue_capacity_vs_registrations.length > 0 ? (
                <ChartContainer
                  config={{ venue_capacity: { label: 'Capacity', color: LIME_LIGHT }, registered: { label: 'Registered', color: LIME } }}
                  className="h-64 w-full"
                >
                  <BarChart
                    data={overview.venue_capacity_vs_registrations.map((v) => ({
                      name: v.session_title?.substring(0, 12) ?? 'Session',
                      venue_capacity: v.venue_capacity,
                      registered: v.registered_count
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={110} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="venue_capacity" fill={LIME_LIGHT} radius={[0, 4, 4, 0]} barSize={14} />
                    <Bar dataKey="registered" fill={LIME} radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyState message="No venue capacity data available" />
              )}
            </CardContent>
          </Card>
        </div>
      ) : eventId && !overviewLoading && !overviewError ? (
        <EmptyState message="No logistics overview available for this event" />
      ) : null}

      {/* Registration Logistics */}
      {eventId && registrationLoading && <LoadingSkeleton height={150} />}
      {eventId && registrationError && <ErrorAlert message={registrationError} />}
      {eventId && !registrationLoading && !registrationError && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registration Logistics</CardTitle>
          </CardHeader>
          <CardContent>
            {registrationData && registrationData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead className="text-right">Registrations</TableHead>
                    <TableHead className="text-right">Cancel Rate</TableHead>
                    <TableHead className="text-right">No-Show Rate</TableHead>
                    <TableHead className="text-right">QR Check-ins</TableHead>
                    <TableHead className="text-right">Manual Check-ins</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrationData.map((s) => (
                    <TableRow key={s.session_id}>
                      <TableCell className="max-w-[160px] truncate font-medium">{s.session_title}</TableCell>
                      <TableCell className="text-right">{s.total_registrations}</TableCell>
                      <TableCell className="text-right">{s.cancellation_rate_pct?.toFixed(1) ?? '0'}%</TableCell>
                      <TableCell className="text-right">{s.no_show_rate_pct?.toFixed(1) ?? '0'}%</TableCell>
                      <TableCell className="text-right">{s.qr_checkin_count}</TableCell>
                      <TableCell className="text-right">{s.manual_checkin_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState message="No registration logistics data available" />
            )}
          </CardContent>
        </Card>
      )}

      {/* Volunteer Roster */}
      {eventId && volunteerLoading && <LoadingSkeleton height={150} />}
      {eventId && volunteerError && <ErrorAlert message={volunteerError} />}
      {eventId && !volunteerLoading && !volunteerError && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Volunteer Roster{volunteerData ? ` — ${volunteerData.event_title}` : ''}</CardTitle>
            {volunteerData && (
              <CardDescription>
                {volunteerData.joined_volunteer_count} joined
                {volunteerData.volunteer_to_participant_ratio !== null && <> &middot; Ratio: 1:{volunteerData.volunteer_to_participant_ratio.toFixed(1)}</>}
                {volunteerData.pending_volunteer_count > 0 && <> &middot; {volunteerData.pending_volunteer_count} pending</>}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {volunteerData && volunteerData.joined_volunteer_roster.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteerData.joined_volunteer_roster.map((v) => (
                    <TableRow key={v.volunteer_id}>
                      <TableCell className="font-medium">{(v.alias ?? `${v.first_name ?? ''} ${v.last_name ?? ''}`.trim()) || 'Unknown'}</TableCell>
                      <TableCell>{v.role_name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{v.contact_phone ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {v.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState message="No volunteers in the roster" />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
