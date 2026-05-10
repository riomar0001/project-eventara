'use client';

import { AlertCircle, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { useEvent } from '@/hooks/admin/events/use-event';
import { DeleteEventButton } from './event-delete-button';
import { BackLink, DetailList, DetailPanel, PhotoPanel } from './events-shared';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-700',
    posted: 'bg-sky-100 text-sky-700',
    started: 'bg-green-100 text-green-700',
    ended: 'bg-neutral-200 text-neutral-500',
    cancelled: 'bg-red-100 text-red-700',
    postponed: 'bg-amber-100 text-amber-700',
  };
  const cls = colorMap[status] ?? 'bg-neutral-100 text-neutral-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-72 rounded-[32px] bg-neutral-200" />
      <div className="space-y-3 rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
        <div className="h-4 w-1/3 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-5/6 rounded bg-neutral-100" />
        <div className="h-3 w-3/4 rounded bg-neutral-100" />
      </div>
      <div className="space-y-3 rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
        <div className="h-4 w-1/4 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-4/5 rounded bg-neutral-100" />
      </div>
    </div>
  );
}

export function EventDetail({ eventId }: { eventId: string }) {
  const { event, sessions, isLoading, error } = useEvent(eventId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackLink href={ADMIN_OPERATIONS_PATHS.events} label="Back to events" />
        {event && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={ADMIN_OPERATIONS_PATHS.eventEdit(event.id)}>Edit</Link>
            </Button>
            <DeleteEventButton eventId={event.id} eventTitle={event.title} />
          </div>
        )}
      </div>

      {isLoading && <DetailSkeleton />}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {!isLoading && !error && event && (
        <>
          <PhotoPanel photo={event.banner_url ?? ''} className="h-72">
            <div className="flex h-full flex-col justify-end p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={event.status} />
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{event.title}</h1>
              <p className="mt-1 text-sm text-white/70">
                {fmtDate(event.start_date)} &ndash; {fmtDate(event.end_date)}
              </p>
            </div>
          </PhotoPanel>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <DetailPanel title="Description">
                <div
                  className="prose prose-sm max-w-none text-neutral-700"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </DetailPanel>

              <DetailPanel title={`Sessions (${sessions.length})`} description="All sessions for this event, ordered by start time.">
                {sessions.length === 0 ? (
                  <p className="text-sm text-neutral-400">No sessions found for this event.</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {sessions.map((session) => (
                      <div key={session.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-neutral-950">{session.title}</p>
                            {session.description && (
                              <p className="mt-0.5 text-sm text-neutral-500">{session.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {fmtDateTime(session.start_datetime)} &ndash; {fmtDateTime(session.end_datetime)}
                              </span>
                              {session.max_slots !== null && (
                                <span className="flex items-center gap-1">
                                  <Users className="size-3" />
                                  {session.max_slots} slots
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3" />
                                {session.venue_id}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={session.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DetailPanel>
            </div>

            <div className="space-y-6">
              <DetailPanel title="Event Details">
                <DetailList
                  items={[
                    { label: 'Status', value: event.status.charAt(0).toUpperCase() + event.status.slice(1) },
                    { label: 'Start date', value: fmtDate(event.start_date) },
                    { label: 'End date', value: fmtDate(event.end_date) },
                    { label: 'Sessions', value: String(sessions.length) },
                    {
                      label: 'Created',
                      value: event.created_at ? fmtDate(event.created_at) : '—',
                    },
                    {
                      label: 'Last updated',
                      value: event.updated_at ? fmtDate(event.updated_at) : '—',
                    },
                  ]}
                />
              </DetailPanel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
