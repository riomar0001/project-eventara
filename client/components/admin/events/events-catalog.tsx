import { Plus } from 'lucide-react';
import Link from 'next/link';
import { CatalogCard, OperationsPageIntro } from './events-shared';
import { Button } from '@/components/ui/button';
import { ADMIN_OPERATIONS_PATHS, eventRecords, getVenueById, getVolunteersByEventId } from '@/constants/admin/operations';

export function EventsCatalog() {
  return (
    <div className="space-y-6">
      <OperationsPageIntro
        title="Events Management"
        description="A photo-forward event index with individual detail pages and static add or edit flows for design review only."
        metrics={[
          {
            label: 'Total events',
            value: eventRecords.length,
            hint: 'Total numbers of events in the system'
          },
          {
            label: 'Upcoming events',
            value: eventRecords.filter((event) => event.status === 'On Sale').length,
            hint: 'Total numbers of upcoming events'
          },
          {
            label: 'Ongoing Events',
            value: eventRecords.reduce((count, event) => count + getVolunteersByEventId(event.id).length, 0),
            hint: 'Total numbers ongoing events'
          }
        ]}
        actions={
          <Button asChild>
            <Link href={ADMIN_OPERATIONS_PATHS.eventCreate}>
              <Plus className="size-4" />
              Add event
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-4">
        {eventRecords.map((event) => {
          const venue = getVenueById(event.venueId);

          return (
            <CatalogCard
              key={event.id}
              title={event.title}
              subtitle={event.dateLabel}
              photo={event.photo}
              description={event.summary}
              href={ADMIN_OPERATIONS_PATHS.eventDetail(event.id)}
              editHref={ADMIN_OPERATIONS_PATHS.eventEdit(event.id)}
              badges={[event.status, event.audience]}
              meta={[
                {
                  label: 'Venue',
                  value: venue?.name ?? 'Venue not set'
                },
                {
                  label: 'Registration',
                  value: event.registrationLabel
                },
                {
                  label: 'Pricing',
                  value: event.priceLabel
                },
                {
                  label: 'Volunteer need',
                  value: event.volunteerNeed
                }
              ]}
            />
          );
        })}
      </div>
    </div>
  );
}

