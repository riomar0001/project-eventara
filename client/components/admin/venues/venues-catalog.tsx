import { Plus } from 'lucide-react';
import Link from 'next/link';
import { CatalogCard, OperationsPageIntro } from './venues-shared';
import { Button } from '@/components/ui/button';
import { ADMIN_OPERATIONS_PATHS, getEventsByVenueId, venueRecords } from '@/constants/admin/operations';

export function VenuesCatalog() {
  const activeVenueCount = venueRecords.filter((venue) => venue.status === 'Active').length;
  const totalCapacity = venueRecords.reduce((sum, venue) => sum + venue.capacity, 0);

  return (
    <div className="space-y-6">
      <OperationsPageIntro
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
            <Link href={ADMIN_OPERATIONS_PATHS.venueCreate}>
              <Plus className="size-4" />
              Add venue
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-4">
        {venueRecords.map((venue) => (
          <CatalogCard
            key={venue.id}
            title={venue.name}
            subtitle={venue.neighborhood}
            photo={venue.photo}
            description={venue.summary}
            href={ADMIN_OPERATIONS_PATHS.venueDetail(venue.id)}
            editHref={ADMIN_OPERATIONS_PATHS.venueEdit(venue.id)}
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
    </div>
  );
}

