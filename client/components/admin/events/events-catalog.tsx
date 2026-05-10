'use client';

import { CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { Button } from '@/components/ui/button';
import { CatalogCard, OperationsPageIntro } from './events-shared';
import { ADMIN_OPERATIONS_PATHS, eventRecords, getVenueById, getVolunteersByEventId } from '@/constants/admin/operations';

function EventsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-neutral-200 bg-neutral-50/60 px-8 py-20 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
        <CalendarPlus className="size-6 text-sky-500" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-neutral-950">No events yet</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
        Your event pipeline is empty. Create your first event to start building the public calendar and scheduling volunteer staffing.
      </p>
      <Button asChild size="default" className="mt-6 rounded-xl bg-sky-600 text-white hover:bg-sky-500">
        <Link href={ADMIN_OPERATIONS_PATHS.eventCreate}>Create your first event</Link>
      </Button>
    </div>
  );
}

export function EventsCatalog() {
  const events = eventRecords;

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
            value: events.length,
            hint: 'Scheduled campaigns currently represented in this preview catalog.'
          },
          {
            label: 'Upcoming events',
            value: events.filter((event) => event.status === 'On Sale').length,
            hint: 'Events already positioned for promotion and attendee acquisition.'
          },
          {
            label: 'Volunteer seats',
            value: events.reduce((count, event) => count + getVolunteersByEventId(event.id).length, 0),
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

      {events.length === 0 ? (
        <EventsEmptyState />
      ) : (
        <div className="grid gap-6 xl:grid-cols-4">
          {events.map((event) => {
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
      )}
    </div>
  );
}
