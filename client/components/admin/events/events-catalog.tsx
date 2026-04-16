import { CalendarDays, Plus, Ticket, Users2 } from 'lucide-react';
import Link from 'next/link';
import { CatalogCard, OperationsPageIntro } from '@/components/admin/event-management/shared';
import { Button } from '@/components/ui/button';
import { EVENT_MANAGEMENT_PATHS, eventRecords, getVenueById, getVolunteersByEventId } from '@/constants/event-management';

export function EventsCatalog() {
  return (
    <div className="space-y-6">
      <OperationsPageIntro
        tone="event"
        badge="Event Pages"
        title="Events Management"
        description="A photo-forward event index with individual detail pages and static add or edit flows for design review only."
        metrics={[
          {
            label: 'Event concepts',
            value: eventRecords.length,
            hint: 'Mock events currently represented in the admin surface.'
          },
          {
            label: 'On sale',
            value: eventRecords.filter((event) => event.status === 'On Sale').length,
            hint: 'Programs shown as actively available to audiences.'
          },
          {
            label: 'Volunteer links',
            value: eventRecords.reduce((count, event) => count + getVolunteersByEventId(event.id).length, 0),
            hint: 'Volunteer assignments already reflected across the event set.'
          }
        ]}
        actions={
          <Button asChild>
            <Link href={EVENT_MANAGEMENT_PATHS.eventCreate}>
              <Plus className="size-4" />
              Add event
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {eventRecords.map((event) => {
          const venue = getVenueById(event.venueId);

          return (
            <CatalogCard
              key={event.id}
              tone="event"
              title={event.title}
              subtitle={event.dateLabel}
              photo={event.photo}
              description={event.summary}
              href={EVENT_MANAGEMENT_PATHS.eventDetail(event.id)}
              editHref={EVENT_MANAGEMENT_PATHS.eventEdit(event.id)}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-950">Detail route included</p>
              <p className="text-sm text-neutral-500">Each event page includes a visible delete button for review.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Ticket className="size-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-950">Add and edit forms</p>
              <p className="text-sm text-neutral-500">The layouts are interactive locally and intentionally detached from APIs.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Users2 className="size-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-950">Volunteer-aware</p>
              <p className="text-sm text-neutral-500">Event detail pages connect to the same volunteer mock dataset.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
