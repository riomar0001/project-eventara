import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { CatalogCard, OperationsPageIntro } from './events-shared';
import { ADMIN_OPERATIONS_PATHS, eventRecords, getVenueById, getVolunteersByEventId } from '@/constants/admin/operations';

export function EventsCatalog() {
  return (
    <div className="space-y-6">
      <MobileFloatingAction cta="Add event" href={ADMIN_OPERATIONS_PATHS.eventCreate} theme="sky" />

      <OperationsPageIntro
        eyebrow="Event Pipeline"
        title="Events Management"
        description="Steer the public calendar with a hero built for pace: launch status, venue readiness, and staffing demand surface at a glance before you scan the catalog."
        metrics={[
          {
            label: 'Total events',
            value: eventRecords.length,
            hint: 'Scheduled campaigns currently represented in this preview catalog.'
          },
          {
            label: 'Upcoming events',
            value: eventRecords.filter((event) => event.status === 'On Sale').length,
            hint: 'Events already positioned for promotion and attendee acquisition.'
          },
          {
            label: 'Volunteer seats',
            value: eventRecords.reduce((count, event) => count + getVolunteersByEventId(event.id).length, 0),
            hint: 'Rostered volunteer placements currently tied to active event plans.'
          }
        ]}
        actions={
          <PrimaryPageAction
            cta="Add event"
            helper="Start a new event draft without hunting through the page."
            href={ADMIN_OPERATIONS_PATHS.eventCreate}
            label="Primary Action"
            theme="sky"
          />
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
