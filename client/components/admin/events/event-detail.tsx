import { CalendarRange, Clock, MapPin, PencilLine, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackLink, DetailPanel, PhotoPanel } from './events-shared';
import { DeleteEventButton } from './event-delete-button';
import {
  ADMIN_OPERATIONS_PATHS,
  getEventDetailById,
  getEventVolunteersByEventId,
  getRatingsByEventId,
  getSessionsByEventId,
  getVenueById,
  getVolunteerById,
  getVolunteerInitials,
  type EventDbStatus
} from '@/constants/admin/operations';

// ── Small inline helpers ───────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 py-3 last:border-0">
      <span className="mt-0.5 shrink-0 text-neutral-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">{label}</p>
        <p className="mt-0.5 text-sm font-medium wrap-break-word text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center">
      <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-amber-600' : 'text-neutral-900'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">{label}</p>
    </div>
  );
}

const STATUS_STYLES: Record<EventDbStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  posted: 'bg-sky-100 text-sky-700',
  started: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  ended: 'bg-purple-100 text-purple-700',
  postponed: 'bg-amber-100 text-amber-700'
};

function StatusBadge({ status, hero }: { status: EventDbStatus; hero?: boolean }) {
  if (hero) {
    return (
      <Badge variant="secondary" className="border-0 bg-white/15 text-white capitalize backdrop-blur-sm">
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className={`border-0 capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </Badge>
  );
}

const VOLUNTEER_STATUS_STYLES: Record<string, string> = {
  joined: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  left: 'border-neutral-200 bg-neutral-100 text-neutral-500',
  rejected: 'border-red-200 bg-red-50 text-red-700'
};

function VolunteerStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`shrink-0 capitalize ${VOLUNTEER_STATUS_STYLES[status] ?? 'border-neutral-200 text-neutral-500'}`}>
      {status}
    </Badge>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ── Main component ─────────────────────────────────────────────────────────────

export function EventDetail({ eventId }: { eventId: string }) {
  const event = getEventDetailById(eventId);

  if (!event) {
    notFound();
  }

  const venue = getVenueById(event.venueId);
  const sessions = getSessionsByEventId(event.id);
  const volunteerAssignments = getEventVolunteersByEventId(event.id);
  const ratings = getRatingsByEventId(event.id);

  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {/* ── Action bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.events} label="Back to events" />
        <Button asChild variant="outline" size="sm">
          <Link href={ADMIN_OPERATIONS_PATHS.eventEdit(event.id)}>
            <PencilLine className="size-4" />
            Edit
          </Link>
        </Button>
        <DeleteEventButton eventId={event.id} eventTitle={event.title} />
      </div>

      {/* ── Hero photo panel ─────────────────────────────────────────────────── */}
      <PhotoPanel photo={event.photo} className="min-h-90">
        <div className="flex min-h-90 flex-col justify-end p-7">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-xs tracking-[0.2em] text-white/60 uppercase">
                {formatDate(event.startDate)} &mdash; {formatDate(event.endDate)}
              </p>
              <span className="text-white/25">&middot;</span>
              <StatusBadge status={event.status} hero />
              <Badge variant="secondary" className="border-0 bg-white/15 text-white backdrop-blur-sm">
                {event.audience}
              </Badge>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{event.title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/80">{event.headline}</p>
          </div>
        </div>
      </PhotoPanel>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCell label="Sessions" value={`${sessions.length}`} accent />
        <StatCell label="Volunteers" value={`${volunteerAssignments.filter((v) => v.status === 'joined').length}`} />
        <StatCell label="Host teams" value={`${event.hostTeam.length}`} />
        <StatCell label="Avg rating" value={avgRating ? `${avgRating} / 5` : '--'} />
      </div>

      {/* ── Row 1: Event Overview + Sessions ─────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DetailPanel title="Event overview">
          <InfoRow icon={<MapPin className="size-4" />} label="Venue" value={venue?.name ?? 'Venue not set'} />
          <InfoRow icon={<CalendarRange className="size-4" />} label="Start date" value={formatDate(event.startDate)} />
          <InfoRow icon={<CalendarRange className="size-4" />} label="End date" value={formatDate(event.endDate)} />
          <InfoRow icon={<Clock className="size-4" />} label="Schedule" value={event.scheduleNote} />
          <InfoRow icon={<Users className="size-4" />} label="Registration" value={event.registrationLabel} />
        </DetailPanel>

        <DetailPanel title="Sessions" description={`${sessions.length} session${sessions.length !== 1 ? 's' : ''} scheduled for this event.`}>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => {
                const sessionVenue = getVenueById(session.venueId);
                return (
                  <div key={session.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium text-neutral-950">{session.title}</p>
                      <StatusBadge status={session.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatTime(session.startDatetime)} &ndash; {formatTime(session.endDatetime)}
                      </span>
                      {sessionVenue && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {sessionVenue.name}
                        </span>
                      )}
                    </div>
                    {session.description && <p className="mt-2 text-sm leading-6 text-neutral-600">{session.description}</p>}
                    {session.maxSlots && <p className="mt-2 text-xs text-neutral-400">Capacity: {session.maxSlots.toLocaleString()} seats</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No sessions scheduled for this event.</p>
          )}
        </DetailPanel>
      </div>

      {/* ── Row 2: Volunteers + Ratings ──────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DetailPanel
          title="Volunteer assignments"
          description={`${volunteerAssignments.length} volunteer${volunteerAssignments.length !== 1 ? 's' : ''} linked to this event.`}
        >
          {volunteerAssignments.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {volunteerAssignments.map((assignment) => {
                const volunteer = getVolunteerById(assignment.volunteerId);
                if (!volunteer) return null;
                return (
                  <div key={assignment.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar size="lg">
                        <AvatarImage src={volunteer.photo} alt={volunteer.name} />
                        <AvatarFallback>{getVolunteerInitials(volunteer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-neutral-950">{volunteer.name}</p>
                        <p className="text-sm text-neutral-500">
                          {volunteer.primaryRole} &middot; {volunteer.availability}
                        </p>
                      </div>
                    </div>
                    <VolunteerStatusBadge status={assignment.status} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No volunteers assigned to this event.</p>
          )}
        </DetailPanel>

        <DetailPanel
          title="Ratings & reviews"
          description={ratings.length > 0 ? `${ratings.length} review${ratings.length !== 1 ? 's' : ''} from attendees.` : undefined}
        >
          {ratings.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {ratings.map((rating) => (
                <div key={rating.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-neutral-950">{rating.userName}</p>
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-neutral-700">{rating.overallRating}/5</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm font-medium text-neutral-800">{rating.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-600">{rating.review}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-neutral-400">{rating.createdAt ? formatDate(rating.createdAt) : ''}</span>
                    {rating.wouldRecommend && (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700">
                        Recommends
                      </Badge>
                    )}
                    {rating.helpfulCount > 0 && <span className="text-xs text-neutral-400">{rating.helpfulCount} found helpful</span>}
                  </div>
                  {rating.creatorResponse && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-amber-600 uppercase">Creator response</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-700">{rating.creatorResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No ratings yet for this event.</p>
          )}
        </DetailPanel>
      </div>

      {/* ── Full-width: Description ──────────────────────────────────────────── */}
      <DetailPanel title="Description">
        <p className="text-sm leading-7 whitespace-pre-line text-neutral-600">{event.description}</p>
      </DetailPanel>
    </div>
  );
}
