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
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.events} label="Back to events" />
        <Button asChild variant="outline" size="sm">
          <Link href={ADMIN_OPERATIONS_PATHS.eventEdit(event.id)}>
            <PencilLine className="size-4" />
            Edit event
          </Link>
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2 className="size-4" />
          Delete event
        </Button>
      </div>

      <PhotoPanel photo={event.photo} className="min-h-[360px]">
        <div className="flex min-h-[360px] flex-col justify-between p-7">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-white/90 text-neutral-900">
              {event.status}
            </Badge>
            <Badge variant="secondary" className="bg-white/80 text-neutral-800">
              {event.audience}
            </Badge>
          </div>
          <div className="max-w-3xl space-y-3">
            <p className="text-xs tracking-[0.2em] text-white/75 uppercase">{event.dateLabel}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{event.title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/85">{event.headline}</p>
          </div>
        </div>
      </PhotoPanel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DetailPanel title="Event overview" description="Key details for the event detail page.">
          <DetailList
            items={[
              { label: 'Venue', value: venue?.name ?? 'Venue not set' },
              { label: 'Schedule', value: event.scheduleNote },
              { label: 'Registration', value: event.registrationLabel },
              { label: 'Pricing', value: event.priceLabel },
              { label: 'Volunteer need', value: event.volunteerNeed },
              { label: 'Stage count', value: `${event.stageCount} active zones` }
            ]}
          />
        </DetailPanel>

        <DetailPanel title="Host teams" description="Functional groups attached to this event concept.">
          <div className="flex flex-wrap gap-2">
            {event.hostTeam.map((team) => (
              <Badge key={team} variant="outline" className="rounded-full px-3 py-1 text-xs">
                {team}
              </Badge>
            ))}
          </div>
        </DetailPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DetailPanel title="Event summary" description="Editorial event narrative used throughout the mock design system.">
          <p className="text-sm leading-7 text-neutral-600">{event.summary}</p>
        </DetailPanel>

        <DetailPanel title="Assigned volunteers" description="Volunteers linked to this event from the shared mock dataset.">
          <div className="space-y-3">
            {volunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage src={volunteer.photo} alt={volunteer.name} />
                    <AvatarFallback>{getVolunteerInitials(volunteer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-neutral-950">{volunteer.name}</p>
                    <p className="text-sm text-neutral-500">
                      {volunteer.primaryRole} • {volunteer.availability}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href={ADMIN_OPERATIONS_PATHS.volunteerDetail(volunteer.id)}>
                    <Users className="size-4" />
                    View volunteer
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

