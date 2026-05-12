'use client';

import { AlertCircle, CalendarCheck, CalendarPlus, ChevronLeft, ChevronRight, ImageIcon, MapPin, Plus, Send } from 'lucide-react';
import Link from 'next/link';
import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/context/permissions-context';
import { useEvents } from '@/hooks/admin/events/use-events';
import { CatalogCard, OperationsPageIntro } from './events-shared';
import type { EventStatus } from '@/api/types.gen';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

const STATUS_FILTERS: { label: string; value: EventStatus | null }[] = [
  { label: 'All', value: null },
  { label: 'Draft', value: 'draft' },
  { label: 'Posted', value: 'posted' },
  { label: 'Started', value: 'started' },
  { label: 'Postponed', value: 'postponed' },
  { label: 'Ended', value: 'ended' },
  { label: 'Cancelled', value: 'cancelled' }
];

const EVENT_EMPTY_CHECKLIST = [
  { label: 'Details', value: 'Title and date window', icon: CalendarCheck },
  { label: 'Venue', value: 'At least one session', icon: MapPin },
  { label: 'Media', value: 'Event banner image', icon: ImageIcon }
] as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function stripAndTruncate(html: string, max = 150) {
  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? plain.slice(0, max).trimEnd() + '…' : plain;
}

function EventsEmptyState({ canCreateEvent }: { canCreateEvent: boolean }) {
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

          <h3 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-neutral-950">
            Create the first event draft and start shaping the calendar.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
            Add the event details, attach a banner, and schedule at least one venue session so the pipeline can move from planning to published.
          </p>

          {canCreateEvent ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild className="rounded-xl bg-sky-600 text-white hover:bg-sky-500">
                <Link href={ADMIN_OPERATIONS_PATHS.eventCreate}>
                  <Plus className="size-4" />
                  Add event
                </Link>
              </Button>
            </div>
          ) : null}

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

function EventCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[20px] bg-white ring-1 ring-neutral-200">
      <div className="h-64 rounded-t-xl rounded-b-[28px] bg-neutral-200" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-2/3 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-4/5 rounded bg-neutral-100" />
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-16 rounded-lg bg-neutral-200" />
          <div className="h-8 w-16 rounded-lg bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

export function EventsCatalog() {
  const { events, total, page, totalPages, statusFilter, isLoading, error, setPage, setStatusFilter } = useEvents(12);
  const { can } = usePermissions();

  const upcomingCount = events.filter((e) => e.status === 'posted' || e.status === 'started').length;
  const canCreateEvent = can('events', 'create');
  const canUpdateEvent = can('events', 'update');

  return (
    <div className="space-y-6">
      {canCreateEvent ? <MobileFloatingAction cta="Add event" href={ADMIN_OPERATIONS_PATHS.eventCreate} theme="sky" /> : null}

      <OperationsPageIntro
        eyebrow="Event Pipeline"
        title="Events Management"
        description="Steer the public calendar with a hero built for pace: launch status, venue readiness, and staffing demand surface at a glance before you scan the catalog."
        metrics={[
          {
            label: 'Total events',
            value: isLoading ? '—' : total,
            hint: statusFilter ? `Events with status: ${statusFilter}` : 'All events across all statuses.'
          },
          {
            label: 'Active this page',
            value: isLoading ? '—' : upcomingCount,
            hint: 'Posted and started events visible on this page.'
          },
          {
            label: 'Volunteer seats',
            value: 0,
            hint: 'Rostered volunteer placements tied to events.'
          }
        ]}
        actions={
          canCreateEvent ? (
            <PrimaryPageAction
              cta="Add event"
              helper="Start a new event draft without hunting through the page."
              href={ADMIN_OPERATIONS_PATHS.eventCreate}
              label="Primary Action"
              theme="sky"
            />
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={String(f.value)}
            onClick={() => setStatusFilter(f.value)}
            className={[
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              statusFilter === f.value ? 'bg-sky-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !error && events.length === 0 && <EventsEmptyState canCreateEvent={canCreateEvent} />}

      {!isLoading && !error && events.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <CatalogCard
                key={event.id}
                badges={[event.status.charAt(0).toUpperCase() + event.status.slice(1)]}
                description={stripAndTruncate(event.description)}
                editHref={canUpdateEvent ? ADMIN_OPERATIONS_PATHS.eventEdit(event.id) : undefined}
                href={ADMIN_OPERATIONS_PATHS.eventDetail(event.id)}
                meta={[
                  { label: 'Start', value: fmtDate(event.start_date) },
                  { label: 'End', value: fmtDate(event.end_date) }
                ]}
                photo={event.banner_url ?? ''}
                subtitle={fmtDate(event.start_date)}
                title={event.title}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
              <p className="text-sm text-neutral-500">
                Page {page} of {totalPages} &mdash; {total} total
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
