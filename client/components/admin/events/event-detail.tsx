'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, Clock, Info, Loader2, MapPin, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEvent } from '@/hooks/admin/events/use-event';
import { useEventParticipantAccess } from '@/hooks/admin/events/use-event-participant-access';
import { useEventParticipantStats } from '@/hooks/admin/events/use-event-participant-stats';
import { DeleteEventButton } from './event-delete-button';
import { EventFeedbackPanel } from './event-feedback-panel';
import { EventParticipantsPanel } from './event-participants-panel';
import { EventQrScannerPanel } from './event-qr-scanner-panel';
import { EventSessionCreateDialog } from './event-session-create-dialog';
import { EventSessionDeleteDialog } from './event-session-delete-dialog';
import { EventSessionEditDialog } from './event-session-edit-dialog';
import { EventVolunteersPanel } from './event-volunteers-panel';
import { BackLink, DetailPanel, PhotoPanel } from './events-shared';
import { Events } from '@/api/sdk.gen';
import type { EventSessionRecordResponse, EventSessionStatus, EventStatus } from '@/api/types.gen';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';
import { cn } from '@/lib/utils';

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
  }
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
    minute: '2-digit'
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

type EventSessionStatusAction = {
  status: EventSessionStatus;
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
      return [{ status: 'draft', label: 'Reopen as draft', description: 'Restore the event as a draft to reschedule or reuse.' }];
    case 'cancelled':
      return [{ status: 'draft', label: 'Reopen as draft', description: 'Restore the cancelled event as a draft.' }];
    default:
      return [];
  }
}

function getSessionStatusActions(status: EventSessionStatus): EventSessionStatusAction[] {
  switch (status) {
    case 'draft':
      return [
        { status: 'posted', label: 'Publish session', description: 'Make this session available to attendees.' },
        { status: 'cancelled', label: 'Cancel session', description: 'Close this draft session.', destructive: true }
      ];
    case 'posted':
      return [
        { status: 'started', label: 'Mark as started', description: 'Indicate that this session has begun.' },
        { status: 'postponed', label: 'Postpone session', description: 'Pause this session for rescheduling.' },
        { status: 'draft', label: 'Revert to draft', description: 'Move this session back to draft.' },
        { status: 'cancelled', label: 'Cancel session', description: 'Close this session immediately.', destructive: true }
      ];
    case 'started':
      return [
        { status: 'ended', label: 'Mark as ended', description: 'Close this session after it finishes.' },
        { status: 'posted', label: 'Revert to posted', description: 'Roll this session back to posted.' },
        { status: 'draft', label: 'Revert to draft', description: 'Move this session back to draft.' },
        { status: 'cancelled', label: 'Cancel session', description: 'Stop this session and mark it cancelled.', destructive: true }
      ];
    case 'postponed':
      return [
        { status: 'posted', label: 'Return to posted', description: 'Reopen this session on the schedule.' },
        { status: 'draft', label: 'Revert to draft', description: 'Move this session back to draft.' },
        { status: 'cancelled', label: 'Cancel session', description: 'Close this session instead of rescheduling.', destructive: true }
      ];
    case 'ended':
    case 'cancelled':
      return [];
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
    postponed: 'bg-amber-100 text-amber-700'
  };
  const cls = colorMap[status] ?? 'bg-neutral-100 text-neutral-700';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{formatStatusLabel(status)}</span>;
}

function EventDetailsSummary({
  attendeeCount,
  event,
  isStatsLoading,
  registeredCount,
  sessionsCount,
  statsError
}: {
  attendeeCount: number;
  event: {
    created_at: string | null;
    description: string;
    end_date: string;
    start_date: string;
    status: string;
    title: string;
  };
  isStatsLoading: boolean;
  registeredCount: number;
  sessionsCount: number;
  statsError: string | null;
}) {
  const loadingLabel = isStatsLoading ? 'Loading…' : null;
  const detailItems = [
    { label: 'Sessions', value: sessionsCount.toLocaleString() },
    { label: 'Registered', value: loadingLabel ?? registeredCount.toLocaleString() },
    { label: 'Attendees', value: loadingLabel ?? attendeeCount.toLocaleString(), accent: true }
  ];

  return (
    <DetailPanel title="Event Details" description="Operational summary and public event information." className="self-start" contentClassName="flex flex-col">
      <div className="flex flex-col gap-7">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} />
            <span className="text-xs font-medium text-neutral-400">
              {event.created_at ? `Created ${fmtDate(event.created_at)}` : 'Created date unavailable'}
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">{event.title}</h2>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              {fmtDate(event.start_date)} - {fmtDate(event.end_date)}
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-semibold text-sky-950">About Event</p>
          <div className="prose prose-sm prose-headings:font-semibold prose-p:leading-7 prose-p:my-0 max-w-none text-neutral-700">
            <div dangerouslySetInnerHTML={{ __html: event.description }} />
          </div>
        </section>

        <div className="h-px bg-neutral-200/80" />

        <dl className="flex flex-wrap gap-x-10 gap-y-5">
          {detailItems.map((item) => (
            <div key={item.label} className="max-w-[17rem] min-w-[8.5rem]">
              <dt className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">{item.label}</dt>
              <dd className={cn('mt-1.5 text-sm leading-6 font-semibold text-neutral-950', item.accent ? 'text-emerald-800' : '')}>{item.value}</dd>
            </div>
          ))}
        </dl>

        {statsError ? <p className="text-sm text-red-600">{statsError}</p> : null}
      </div>
    </DetailPanel>
  );
}

function UpdateStatusMenu({
  currentStatus,
  isUpdating,
  onUpdate
}: {
  currentStatus: EventStatus;
  isUpdating: boolean;
  onUpdate: (status: EventStatus) => Promise<void>;
}) {
  const actions = getStatusActions(currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={isUpdating} className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50">
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
                <span className={cn('text-xs leading-5', action.destructive ? 'text-destructive/80' : 'text-neutral-500')}>{action.description}</span>
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

function UpdateSessionStatusMenu({
  currentStatus,
  isUpdating,
  onUpdate
}: {
  currentStatus: EventSessionStatus;
  isUpdating: boolean;
  onUpdate: (status: EventSessionStatus) => Promise<void>;
}) {
  const actions = getSessionStatusActions(currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-xs" disabled={isUpdating} className="text-neutral-400 hover:text-sky-700">
          {isUpdating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="sr-only">Update session status</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Change session status</DropdownMenuLabel>
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
                <span className={cn('text-xs leading-5', action.destructive ? 'text-destructive/80' : 'text-neutral-500')}>{action.description}</span>
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
  const [editingSession, setEditingSession] = useState<EventSessionRecordResponse | null>(null);
  const [deletingSession, setDeletingSession] = useState<{ id: string; title: string; status: string } | null>(null);
  const [updatingSessionStatusId, setUpdatingSessionStatusId] = useState<string | null>(null);
  const [participantsRefreshKey, setParticipantsRefreshKey] = useState(0);
  const participantAccess = useEventParticipantAccess(eventId, event?.created_by);
  const canManageEvent = participantAccess.isOwner;
  const canAccessEventParticipants = participantAccess.canAccess;
  const participantStats = useEventParticipantStats(eventId, participantsRefreshKey, canAccessEventParticipants);
  const tabs = useMemo(
    () => [
      { value: 'details', label: 'Event Details' },
      ...(canAccessEventParticipants ? [{ value: 'qr', label: 'QR Check-in' }] : []),
      ...(canManageEvent ? [{ value: 'volunteers', label: 'Volunteers' }] : []),
      ...(canAccessEventParticipants ? [{ value: 'participants', label: 'Participants' }] : [])
    ],
    [canAccessEventParticipants, canManageEvent]
  );

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

  async function handleUpdateSessionStatus(session: EventSessionRecordResponse, nextStatus: EventSessionStatus) {
    if (!event || updatingSessionStatusId) return;

    setUpdatingSessionStatusId(session.id);
    try {
      const result = await Events.updateEventSessionStatusEventsEventIdSessionSessionIdStatusPatch({
        path: { event_id: event.id, session_id: session.id },
        body: { new_status: nextStatus },
        headers: getAuthHeaders(),
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to update session status right now.');

      toast.success(result.data.message ?? 'Event session status updated successfully.');
      refetch();
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, 'Unable to update session status right now.'));
    } finally {
      setUpdatingSessionStatusId(null);
    }
  }

  return (
    <div className="space-y-6">
      {event && isCreateSessionOpen && (
        <EventSessionCreateDialog event={event} sessionsCount={sessions.length} onClose={() => setIsCreateSessionOpen(false)} onCreated={refetch} />
      )}

      {event && editingSession && <EventSessionEditDialog event={event} session={editingSession} onClose={() => setEditingSession(null)} onUpdated={refetch} />}

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
        {event && canManageEvent && (
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
          <PhotoPanel photo={event.banner_url ?? ''} className="z-0 h-72">
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

          <Tabs defaultValue="details" className="z-50 mt-10">
            <TabsList
              className="grid h-auto w-full gap-1 rounded-2xl bg-white/90 p-1.5 shadow-[0_18px_55px_-48px_rgba(15,23,42,0.5)] ring-1 ring-neutral-200/80 backdrop-blur"
              style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-h-10 rounded-xl px-3 py-2.5 text-center text-sm font-semibold data-[state=active]:bg-sky-50 data-[state=active]:text-sky-800 data-[state=active]:ring-1 data-[state=active]:ring-sky-100 sm:px-5"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="details">
              <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.35fr)]">
                <EventDetailsSummary
                  attendeeCount={participantStats.attendeeCount}
                  event={event}
                  isStatsLoading={participantStats.isLoading}
                  registeredCount={participantStats.registeredCount}
                  sessionsCount={sessions.length}
                  statsError={participantStats.error}
                />

                <div className="min-w-0">
                  <DetailPanel
                    title={`Event Sessions (${sessions.length})`}
                    description="Ordered by start time with venue, slots, and live status."
                    className="h-full"
                    actions={
                      canManageEvent ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50"
                          onClick={() => setIsCreateSessionOpen(true)}
                        >
                          <Plus className="size-4" />
                          Add session
                        </Button>
                      ) : null
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
                              index % 2 === 0
                                ? 'bg-gradient-to-br from-white via-sky-50/30 to-white'
                                : 'bg-gradient-to-br from-white via-neutral-50/80 to-white'
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
                                <div className="space-y-3">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold tracking-[0.18em] text-sky-700 uppercase">Session {index + 1}</p>
                                    <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                                      <h3 className="min-w-0 text-lg font-semibold tracking-tight text-neutral-950">{session.title}</h3>
                                      <div className="flex shrink-0 items-center gap-2">
                                        <StatusBadge status={session.status} />
                                        {canManageEvent && (
                                          <>
                                            <UpdateSessionStatusMenu
                                              currentStatus={session.status as EventSessionStatus}
                                              isUpdating={updatingSessionStatusId === session.id}
                                              onUpdate={(nextStatus) => handleUpdateSessionStatus(session, nextStatus)}
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon-xs"
                                              onClick={() => setEditingSession(session)}
                                              className="text-neutral-400 hover:text-sky-700"
                                            >
                                              <Pencil className="size-4" />
                                              <span className="sr-only">Edit session</span>
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon-xs"
                                              onClick={() => setDeletingSession({ id: session.id, title: session.title, status: session.status })}
                                              className="text-neutral-400 hover:text-red-600"
                                            >
                                              <Trash2 className="size-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    {session.description ? (
                                      <p className="mt-1.5 text-sm leading-6 text-neutral-600">{session.description}</p>
                                    ) : (
                                      <p className="mt-1.5 text-sm text-neutral-400">No session description provided.</p>
                                    )}
                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-neutral-500">
                                      <span>
                                        <strong className="text-neutral-950">
                                          {(participantStats.sessionStats[session.id]?.registered ?? 0).toLocaleString()}
                                        </strong>{' '}
                                        registered
                                      </span>
                                      <span>
                                        <strong className="text-emerald-700">
                                          {(participantStats.sessionStats[session.id]?.checkedIn ?? 0).toLocaleString()}
                                        </strong>{' '}
                                        checked in
                                      </span>
                                    </div>
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
                                        {session.venue_location && <p className="text-xs text-neutral-500">{session.venue_location}</p>}
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
                </div>
              </div>
            </TabsContent>

            {canAccessEventParticipants && (
              <TabsContent value="qr">
                <DetailPanel title="QR Check-in" description="Scan attendee QR codes at the venue and mark participants checked in.">
                  <EventQrScannerPanel onCheckedIn={() => setParticipantsRefreshKey((key) => key + 1)} />
                </DetailPanel>
              </TabsContent>
            )}

            {canManageEvent && (
              <TabsContent value="volunteers">
                <DetailPanel title="Volunteers" description="Volunteers assigned to this event and their current acceptance status.">
                  <EventVolunteersPanel eventId={event.id} />
                </DetailPanel>
              </TabsContent>
            )}

            {canAccessEventParticipants && (
              <TabsContent value="participants">
                <DetailPanel title="Participants" description="All registered participants across every session of this event.">
                  <div className="space-y-8">
                    <EventParticipantsPanel eventId={event.id} refreshKey={participantsRefreshKey} />
                    <section className="space-y-3">
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-neutral-950">Event Feedback</h3>
                        <p className="mt-1 text-sm text-neutral-500">Submitted by checked-in attendees after the event ends.</p>
                      </div>
                      <EventFeedbackPanel eventId={event.id} />
                    </section>
                  </div>
                </DetailPanel>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}
