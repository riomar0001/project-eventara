import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { CatalogCard, OperationsPageIntro } from './venues-shared';
import { ADMIN_OPERATIONS_PATHS, getEventsByVenueId, venueRecords } from '@/constants/admin/operations';

export function VenuesCatalog() {
  const activeVenueCount = venueRecords.filter((venue) => venue.status === 'Active').length;
  const totalCapacity = venueRecords.reduce((sum, venue) => sum + venue.capacity, 0);

  return (
    <div className="space-y-6">
      <MobileFloatingAction cta="Add venue" href={ADMIN_OPERATIONS_PATHS.venueCreate} theme="amber" />

      <OperationsPageIntro
        eyebrow="Venue Portfolio"
        title="Venue Management"
        description="Shape the event footprint from a single cinematic surface, with venue health, capacity, and booking readiness visible before you ever open a detail page."
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
          <PrimaryPageAction
            cta="Add venue"
            helper="Create a new space entry right from the command surface."
            href={ADMIN_OPERATIONS_PATHS.venueCreate}
            label="Primary Action"
            theme="amber"
          />
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
