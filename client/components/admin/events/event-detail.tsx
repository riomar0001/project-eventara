import { PencilLine, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BackLink, DetailList, DetailPanel, PhotoPanel } from './events-shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ADMIN_OPERATIONS_PATHS, getEventById, getVenueById, getVolunteerInitials, getVolunteersByEventId } from '@/constants/admin/operations';

export function EventDetail({ eventId }: { eventId: string }) {
  const event = getEventById(eventId);

  if (!event) {
    notFound();
  }

  const venue = getVenueById(event.venueId);
  const volunteers = getVolunteersByEventId(event.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.events} label="Back to events" />
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={ADMIN_OPERATIONS_PATHS.eventEdit(event.id)}>
              <PencilLine className="size-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <PhotoPanel photo={event.photo} className="min-h-90">
        <div className="flex min-h-90 flex-col justify-end p-7">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-xs tracking-[0.2em] text-white/60 uppercase">{event.dateLabel}</p>
              <span className="text-white/25">·</span>
              <Badge variant="secondary" className="border-0 bg-white/15 text-white backdrop-blur-sm">{event.status}</Badge>
              <Badge variant="secondary" className="border-0 bg-white/15 text-white backdrop-blur-sm">{event.audience}</Badge>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{event.title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/80">{event.headline}</p>
          </div>
        </div>
      </PhotoPanel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DetailPanel title="Event overview">
          <DetailList
            items={[
              { label: 'Venue', value: venue?.name ?? 'Venue not set' },
              { label: 'Schedule', value: event.scheduleNote },
              { label: 'Registration', value: event.registrationLabel },
              { label: 'Volunteer need', value: event.volunteerNeed },
              { label: 'Stage count', value: `${event.stageCount} active zones` }
            ]}
          />
        </DetailPanel>

        <DetailPanel title="Host teams">
          <div className="divide-y divide-neutral-100">
            {event.hostTeam.map((team) => (
              <p key={team} className="py-2.5 text-sm text-neutral-950 first:pt-0 last:pb-0">{team}</p>
            ))}
          </div>
        </DetailPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DetailPanel title="Event summary">
          <p className="text-sm leading-7 text-neutral-600">{event.summary}</p>
        </DetailPanel>

        <DetailPanel title="Assigned volunteers">
          <div className="divide-y divide-neutral-100">
            {volunteers.map((volunteer) => (
              <div key={volunteer.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage src={volunteer.photo} alt={volunteer.name} />
                    <AvatarFallback>{getVolunteerInitials(volunteer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-neutral-950">{volunteer.name}</p>
                    <p className="text-sm text-neutral-500">{volunteer.primaryRole} · {volunteer.availability}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={ADMIN_OPERATIONS_PATHS.volunteerDetail(volunteer.id)}>
                    <Users className="size-4" />
                    View
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </DetailPanel>
      </div>
    </div>
  );
}

