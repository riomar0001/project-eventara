'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, Clock, Info, Loader2, MapPin, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import type { EventStatus } from '@/api/types.gen';
import { Events } from '@/api/sdk.gen';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { useEvent } from '@/hooks/admin/events/use-event';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';
import { cn } from '@/lib/utils';
import { DeleteEventButton } from './event-delete-button';
import { EventParticipantsPanel } from './event-participants-panel';
import { EventSessionCreateDialog } from './event-session-create-dialog';
import { EventSessionDeleteDialog } from './event-session-delete-dialog';
import { EventVolunteersPanel } from './event-volunteers-panel';
import { BackLink, DetailList, DetailPanel, PhotoPanel } from './events-shared';
import { toast } from 'sonner';

const SESSION_STATUS_WARNINGS: Record<string, { message: string; icon: React.ElementType; className: string }> = {
  draft: {
    message: 'This session is in draft and not yet visible to attendees.',
    icon: Info,
    className: 'border-neutral-200 bg-neutral-50 text-neutral-600'
  },
  started: {
    message: 'This session is currently in progress.',
    icon: Info,
    className: 'border-green-100 bg-green-50 text-green-700'
  },
  ended: {
    message: 'This session has ended. No further changes are expected.',
    icon: Info,
    className: 'border-neutral-200 bg-neutral-50 text-neutral-500'
  },
  cancelled: {
    message: 'This session has been cancelled and is no longer available to attendees.',
    icon: AlertTriangle,
    className: 'border-red-100 bg-red-50 text-red-700'
  },
  postponed: {
    message: 'This session has been postponed. Attendees may be awaiting updates.',
    icon: AlertTriangle,
    className: 'border-amber-100 bg-amber-50 text-amber-700'
  },
};

function SessionStatusWarning({ status }: { status: string }) {
  const warning = SESSION_STATUS_WARNINGS[status];
  if (!warning) return null;
  const Icon = warning.icon;
  return (
    <div className={`mt-3 flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm ${warning.className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      {warning.message}
    </div>
  );
}

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

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
  started: 'Started',
  ended: 'Ended',
  cancelled: 'Cancelled',
  postponed: 'Postponed'
};

type EventStatusAction = {
  status: EventStatus;
  label: string;
  description: string;
  destructive?: boolean;
};

function formatStatusLabel(status: EventStatus | string) {
  return EVENT_STATUS_LABELS[status as EventStatus] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusActions(status: EventStatus): EventStatusAction[] {
  switch (status) {
    case 'draft':
      return [
        { status: 'posted', label: 'Publish event', description: 'Move this event onto the public calendar.' },
        { status: 'cancelled', label: 'Cancel event', description: 'Close the draft without publishing.', destructive: true }
      ];
    case 'posted':
      return [
        { status: 'started', label: 'Mark as started', description: 'Indicate that the event has begun.' },
        { status: 'postponed', label: 'Postpone event', description: 'Push the event back and requeue it.' },
        { status: 'draft', label: 'Revert to draft', description: 'Unpublish the event and move it back to draft.' },
        { status: 'cancelled', label: 'Cancel event', description: 'Close the event immediately.', destructive: true }
      ];
    case 'started':
      return [
        { status: 'ended', label: 'Mark as ended', description: 'Close the event after it finishes.' },
        { status: 'posted', label: 'Revert to posted', description: 'Roll the event back to posted.' },
        { status: 'draft', label: 'Revert to draft', description: 'Unpublish and move back to draft.' },
        { status: 'cancelled', label: 'Cancel event', description: 'Stop the event and mark it cancelled.', destructive: true }
      ];
    case 'postponed':
      return [
        { status: 'posted', label: 'Return to posted', description: 'Reopen the event on the public calendar.' },
        { status: 'draft', label: 'Revert to draft', description: 'Move back to draft for rescheduling.' },
        { status: 'cancelled', label: 'Cancel event', description: 'Close the event instead of rescheduling.', destructive: true }
      ];
    case 'ended':
      return [
        { status: 'draft', label: 'Reopen as draft', description: 'Restore the event as a draft to reschedule or reuse.' }
      ];
    case 'cancelled':
      return [
        { status: 'draft', label: 'Reopen as draft', description: 'Restore the cancelled event as a draft.' }
      ];
    default:
      return [];
  }
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
      {formatStatusLabel(status)}
    </span>
  );
}

function UpdateStatusMenu({ currentStatus, isUpdating, onUpdate }: { currentStatus: EventStatus; isUpdating: boolean; onUpdate: (status: EventStatus) => Promise<void> }) {
  const actions = getStatusActions(currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50"
        >
          {isUpdating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {isUpdating ? 'Updating…' : 'Update status'}
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Change event status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.length > 0 ? (
          actions.map((action) => (
            <DropdownMenuItem
              key={action.status}
              variant={action.destructive ? 'destructive' : 'default'}
              onSelect={() => {
                void onUpdate(action.status);
              }}
              className="items-start py-2.5"
            >
              <div className="flex min-w-0 flex-col items-start gap-0.5">
                <span className="font-medium">{action.label}</span>
                <span className={cn('text-xs leading-5', action.destructive ? 'text-destructive/80' : 'text-neutral-500')}>
                  {action.description}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No further status transitions</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-72 rounded-[32px] bg-neutral-200" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-[28px] bg-white p-6 ring-1 ring-neutral-200/80">
            <div className="h-4 w-1/3 rounded bg-neutral-200" />
            <div className="h-3 w-full rounded bg-neutral-100" />
            <div className="h-3 w-5/6 rounded bg-neutral-100" />
            <div className="h-3 w-3/4 rounded bg-neutral-100" />
          </div>
          <div className="space-y-4 rounded-[28px] bg-white p-6 ring-1 ring-neutral-200/80">
            <div className="h-4 w-1/2 rounded bg-neutral-200" />
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 rounded-[24px] bg-neutral-100" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4 rounded-[28px] bg-white p-6 ring-1 ring-neutral-200/80">
          <div className="h-4 w-1/2 rounded bg-neutral-200" />
          <div className="h-24 rounded-2xl bg-neutral-100" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventDetail({ eventId }: { eventId: string }) {
  const { event, sessions, isLoading, error, refetch } = useEvent(eventId);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState<{ id: string; title: string; status: string } | null>(null);

  async function handleUpdateStatus(nextStatus: EventStatus) {
    if (!event || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const result = await Events.updateEventStatusEventsEventIdStatusPatch({
        path: { event_id: event.id },
        body: { new_status: nextStatus },
        headers: getAuthHeaders(),
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to update event status right now.');

      toast.success(result.data.message ?? 'Event status updated successfully.');
      refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update event status right now.'));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      {event && isCreateSessionOpen && (
        <EventSessionCreateDialog
          event={event}
          sessionsCount={sessions.length}
          onClose={() => setIsCreateSessionOpen(false)}
          onCreated={refetch}
        />
      )}

      {event && deletingSession && (
        <EventSessionDeleteDialog
          eventId={event.id}
          sessionId={deletingSession.id}
          sessionTitle={deletingSession.title}
          sessionStatus={deletingSession.status}
          onClose={() => setDeletingSession(null)}
          onDeleted={refetch}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href={ADMIN_OPERATIONS_PATHS.events} label="Back to events" />
        {event && (
          <div className="flex flex-wrap items-center gap-2">
            <UpdateStatusMenu currentStatus={event.status as EventStatus} isUpdating={isUpdatingStatus} onUpdate={handleUpdateStatus} />
            <Button asChild variant="outline" size="sm">
              <Link href={ADMIN_OPERATIONS_PATHS.eventEdit(event.id)}>Edit</Link>
            </Button>
            <DeleteEventButton eventId={event.id} eventTitle={event.title} eventStatus={event.status} />
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <DetailPanel title="Description" description="The event narrative and public-facing copy shown to organizers and staff.">
                <div className="rounded-2xl bg-neutral-50/70 p-5">
                  <div className="prose prose-sm max-w-none text-neutral-700 prose-headings:font-semibold prose-p:leading-7 prose-p:my-0">
                    <div dangerouslySetInnerHTML={{ __html: event.description }} />
                  </div>
                </div>
              </DetailPanel>

              <DetailPanel
                title={`Session schedule (${sessions.length})`}
                description="Ordered by start time with venue, slots, and live status."
                actions={
                    <Button type="button" variant="outline" size="sm" className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50" onClick={() => setIsCreateSessionOpen(true)}>
                      <Plus className="size-4" />
                      Add session
                    </Button>
                }
              >
                {sessions.length === 0 ? (
                  <div className="rounded-2xl bg-neutral-50/80 px-4 py-10 text-center">
                    <p className="text-sm font-medium text-neutral-500">No sessions found for this event.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session, index) => (
                      <article
                        key={session.id}
                        className={cn(
                          'overflow-hidden rounded-[26px] p-4 shadow-[0_18px_55px_-46px_rgba(15,23,42,0.34)]',
                          index % 2 === 0 ? 'bg-gradient-to-br from-white via-sky-50/30 to-white' : 'bg-gradient-to-br from-white via-neutral-50/80 to-white'
                        )}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <div className="flex shrink-0 items-start gap-3 sm:w-14 sm:flex-col sm:items-center">
                            <span className="flex size-10 items-center justify-center rounded-2xl bg-sky-50 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="hidden h-full w-px flex-1 bg-gradient-to-b from-sky-200 via-neutral-200 to-transparent sm:block" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-700 uppercase">Session {index + 1}</p>
                                <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">{session.title}</h3>
                                {session.description ? (
                                  <p className="mt-1.5 text-sm leading-6 text-neutral-600">{session.description}</p>
                                ) : (
                                  <p className="mt-1.5 text-sm text-neutral-400">No session description provided.</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={session.status} />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => setDeletingSession({ id: session.id, title: session.title, status: session.status })}
                                  className="text-neutral-400 hover:text-red-600"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>

                            <SessionStatusWarning status={session.status} />

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl bg-neutral-50/80 px-3 py-2.5">
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">Schedule</p>
                                <div className="mt-1 flex items-start gap-2">
                                  <Clock className="mt-0.5 size-4 shrink-0 text-sky-600" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-neutral-950">{fmtDateTime(session.start_datetime)}</p>
                                    <p className="text-xs text-neutral-500">Ends {fmtDateTime(session.end_datetime)}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl bg-neutral-50/80 px-3 py-2.5">
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">Venue</p>
                                <div className="mt-1 flex items-start gap-2">
                                  <MapPin className="mt-0.5 size-4 shrink-0 text-sky-600" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-neutral-950">{session.venue_name ?? '—'}</p>
                                    {session.venue_location && (
                                      <p className="text-xs text-neutral-500">{session.venue_location}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl bg-neutral-50/80 px-3 py-2.5">
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">Slots</p>
                                <div className="mt-1 flex items-start gap-2">
                                  <Users className="mt-0.5 size-4 shrink-0 text-sky-600" />
                                  <p className="text-sm font-medium text-neutral-950">
                                    {session.max_slots !== null ? `${session.max_slots.toLocaleString()} slots` : 'Unlimited capacity'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </DetailPanel>

              <DetailPanel title="Volunteers" description="Volunteers assigned to this event and their current acceptance status.">
                <EventVolunteersPanel eventId={event.id} />
              </DetailPanel>

              <DetailPanel title="Participants" description="All registered participants across every session of this event.">
                <EventParticipantsPanel eventId={event.id} />
              </DetailPanel>
            </div>

            <div className="space-y-6">
              <DetailPanel title="Event overview" description="Administrative snapshot for dates, status, and audit details.">
                <div className="rounded-2xl bg-sky-50/70 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-sky-700 uppercase">Current status</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        Use the update action in the header to move this event through its lifecycle.
                      </p>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                </div>

                <div className="mt-4">
                  <DetailList
                    items={[
                      { label: 'Status', value: formatStatusLabel(event.status) },
                      { label: 'Start date', value: fmtDate(event.start_date) },
                      { label: 'End date', value: fmtDate(event.end_date) },
                      { label: 'Sessions', value: String(sessions.length) },
                      {
                        label: 'Created',
                        value: event.created_at ? fmtDate(event.created_at) : '—'
                      },
                      {
                        label: 'Last updated',
                        value: event.updated_at ? fmtDate(event.updated_at) : '—'
                      }
                    ]}
                  />
                </div>
              </DetailPanel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
