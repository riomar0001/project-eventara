'use client';

import { CalendarCheck, CalendarPlus, ImageIcon, MapPin, Plus, Send } from 'lucide-react';
import Link from 'next/link';
import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { Button } from '@/components/ui/button';
import { OperationsPageIntro } from './events-shared';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

const EVENT_EMPTY_CHECKLIST = [
  { label: 'Details', value: 'Title and date window', icon: CalendarCheck },
  { label: 'Venue', value: 'At least one session', icon: MapPin },
  { label: 'Media', value: 'Event banner image', icon: ImageIcon }
] as const;

function EventsEmptyState() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.45)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <CalendarPlus className="size-4" />
            </span>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-sky-700 uppercase">Empty pipeline</p>
          </div>

          <h3 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-neutral-950">Create the first event draft and start shaping the calendar.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
            Add the event details, attach a banner, and schedule at least one venue session so the pipeline can move from planning to published.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="rounded-xl bg-sky-600 text-white hover:bg-sky-500">
              <Link href={ADMIN_OPERATIONS_PATHS.eventCreate}>
                <Plus className="size-4" />
                Add event
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {EVENT_EMPTY_CHECKLIST.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <Icon className="mb-3 size-4 text-sky-600" />
                <p className="text-[11px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">{label}</p>
                <p className="mt-1 text-sm font-medium text-neutral-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-200 bg-neutral-950 p-6 text-white lg:border-t-0 lg:border-l">
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-sky-300 uppercase">Launch path</p>
              <p className="text-sm leading-6 text-white/70">
                Save as draft while the structure is incomplete, then post once the schedule and banner are ready for review.
              </p>
            </div>
            <div className="space-y-3">
              {['Draft the event', 'Attach sessions', 'Post when ready'].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-300 text-xs font-semibold text-neutral-950">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-white/90">{step}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-sky-100">
                <Send className="size-4" />
                Ready for the first listing
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            value: 0,
            hint: 'Events will appear here once the events read endpoint is available.'
          },
          {
            label: 'Upcoming events',
            value: 0,
            hint: 'Published upcoming events from the API.'
          },
          {
            label: 'Volunteer seats',
            value: 0,
            hint: 'Rostered volunteer placements tied to events.'
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

      <EventsEmptyState />
    </div>
  );
}
