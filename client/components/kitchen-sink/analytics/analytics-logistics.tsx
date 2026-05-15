'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSessionTimeline, useEventLogisticsOverview, useVolunteerLogistics, useRegistrationLogistics } from '@/hooks/admin/analytics';
import { LoadingSkeleton, LoadingSpinner, ErrorAlert, EmptyState } from './analytics-shared';

const LIME = 'oklch(0.648 0.2 131.684)';
const LIME_LIGHT = 'oklch(0.879 0.169 91.605)';

function statusColor(status: string) {
  if (status === 'started' || status === 'ongoing') return 'text-green-600 bg-green-50';
  if (status === 'scheduled' || status === 'upcoming') return 'text-blue-600 bg-blue-50';
  return 'text-muted-foreground bg-muted';
}

function EventIdInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Search className="text-muted-foreground size-4" />
          <Input placeholder="Enter event ID to load logistics data..." value={value} onChange={(e) => onChange(e.target.value)} className="max-w-md" />
        </div>
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

      {/* Event ID input */}
      <EventIdInput value={eventId} onChange={setEventId} />

      {!eventId && <EmptyState message="Enter an event ID above to load detailed logistics" />}

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
