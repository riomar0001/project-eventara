import { Building2, CalendarRange, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { CatalogCard, OperationsPageIntro } from '@/components/admin/event-management/shared';
import { Button } from '@/components/ui/button';
import { EVENT_MANAGEMENT_PATHS, getEventsByVenueId, venueRecords } from '@/constants/event-management';

export function VenuesCatalog() {
  const activeVenueCount = venueRecords.filter((venue) => venue.status === 'Active').length;
  const totalCapacity = venueRecords.reduce((sum, venue) => sum + venue.capacity, 0);

  return (
    <div className="space-y-6">
      <OperationsPageIntro
        tone="venue"
        badge="Venue Pages"
        title="Venue Management"
        description="A UI-only venue surface for reviewing the catalog, opening detail pages, and previewing add or edit flows without touching backend integrations."
        metrics={[
          {
            label: 'Live venues',
            value: activeVenueCount,
            hint: 'Spaces currently presented as active in the mock admin catalog.'
          },
          {
            label: 'Portfolio capacity',
            value: totalCapacity.toLocaleString(),
            hint: 'Combined guest capacity across the current venue preview set.'
          },
          {
            label: 'Event-ready spaces',
            value: venueRecords.filter((venue) => getEventsByVenueId(venue.id).length > 0).length,
            hint: 'Venues already connected to sample events in this UI-only flow.'
          }
        ]}
        actions={
          <Button asChild>
            <Link href={EVENT_MANAGEMENT_PATHS.venueCreate}>
              <Plus className="size-4" />
              Add venue
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {venueRecords.map((venue) => (
          <CatalogCard
            key={venue.id}
            tone="venue"
            title={venue.name}
            subtitle={venue.neighborhood}
            photo={venue.photo}
            description={venue.summary}
            href={EVENT_MANAGEMENT_PATHS.venueDetail(venue.id)}
            editHref={EVENT_MANAGEMENT_PATHS.venueEdit(venue.id)}
            badges={[venue.status, venue.setting, venue.venueType]}
            meta={[
              {
                label: 'Capacity',
                value: `${venue.capacity} guests`
              },
              {
                label: 'Event use',
                value: `${getEventsByVenueId(venue.id).length} sample events`
              },
              {
                label: 'Location',
                value: venue.city
              },
              {
                label: 'Booking window',
                value: venue.bookingWindow
              }
            ]}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-950">Card-first index</p>
              <p className="text-sm text-neutral-500">Each venue presents with a large photo-led cover.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-950">Detail route</p>
              <p className="text-sm text-neutral-500">Every venue has a dedicated view page with a delete button.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <CalendarRange className="size-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-950">Edit and add forms</p>
              <p className="text-sm text-neutral-500">Both flows are interactive UI previews with local form state only.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
