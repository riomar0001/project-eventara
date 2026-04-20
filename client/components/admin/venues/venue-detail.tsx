import { CalendarRange, PencilLine, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackLink, DetailList, DetailPanel, PhotoPanel } from './venues-shared';
import { ADMIN_OPERATIONS_PATHS, getEventsByVenueId, getVenueById } from '@/constants/admin/operations';

export function VenueDetail({ venueId }: { venueId: string }) {
  const venue = getVenueById(venueId);

  if (!venue) {
    notFound();
  }

  const relatedEvents = getEventsByVenueId(venue.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.venues} label="Back to venues" />
        <Button asChild variant="outline" size="sm">
          <Link href={ADMIN_OPERATIONS_PATHS.venueEdit(venue.id)}>
            <PencilLine className="size-4" />
            Edit venue
          </Link>
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2 className="size-4" />
          Delete venue
        </Button>
      </div>

      <PhotoPanel photo={venue.photo} className="min-h-90">
        <div className="flex min-h-90 flex-col justify-between p-7">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-white/90 text-neutral-900">
              {venue.status}
            </Badge>
            <Badge variant="secondary" className="bg-white/80 text-neutral-800">
              {venue.setting}
            </Badge>
            <Badge variant="secondary" className="bg-white/80 text-neutral-800">
              {venue.venueType}
            </Badge>
          </div>
          <div className="max-w-3xl space-y-3">
            <p className="text-xs tracking-[0.2em] text-white/75 uppercase">{venue.neighborhood}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{venue.name}</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/85">{venue.description}</p>
          </div>
        </div>
      </PhotoPanel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DetailPanel title="Venue overview" description="A focused page for reviewing the venue before editing or deleting it.">
          <DetailList
            items={[
              { label: 'Address', value: venue.address },
              { label: 'Capacity', value: `${venue.capacity} guests` },
              { label: 'Lead contact', value: venue.leadContact },
              { label: 'Booking window', value: venue.bookingWindow },
              { label: 'Email', value: venue.leadEmail },
              { label: 'Phone', value: venue.leadPhone }
            ]}
          />
        </DetailPanel>

        <DetailPanel title="Amenities" description="Operational notes and setup highlights.">
          <div className="flex flex-wrap gap-2">
            {venue.amenities.map((amenity) => (
              <Badge key={amenity} variant="outline" className="rounded-full px-3 py-1 text-xs">
                {amenity}
              </Badge>
            ))}
          </div>
        </DetailPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DetailPanel title="Venue tags" description="Quick descriptors used in the design preview.">
          <div className="space-y-3">
            {venue.tags.map((tag) => (
              <div key={tag} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
                {tag}
              </div>
            ))}
          </div>
        </DetailPanel>

        <DetailPanel title="Scheduled sample events" description="Linked event pages included in the same UI-only admin preview.">
          <div className="space-y-3">
            {relatedEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-neutral-950">{event.title}</p>
                  <p className="text-sm text-neutral-500">{event.dateLabel}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={ADMIN_OPERATIONS_PATHS.eventDetail(event.id)}>
                    <CalendarRange className="size-4" />
                    View event
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
