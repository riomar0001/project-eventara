'use client';

import Link from 'next/link';
import type { HomeEventRecord } from '@/hooks/events/use-home-events';
import { EventCard } from './event-card';

interface EventsSectionProps {
  events: HomeEventRecord[];
  eventsType: 'upcoming' | 'past';
  loading?: boolean;
}

export function EventsSection({ events, eventsType, loading }: EventsSectionProps) {
  const isPast = eventsType === 'past';

  if (loading) {
    return (
      <section className="relative py-10">
        <div className="container mx-auto max-w-[1240px] px-4 md:px-8">
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-line-soft bg-surface h-[360px] animate-pulse rounded-[20px] border" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-10">
      <div className="container mx-auto max-w-[1240px] px-4 md:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-text-mute mb-2 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)] ${isPast ? 'bg-orange-400' : 'bg-lime'}`}
              />
              {isPast ? 'ARCHIVE · PAST EVENTS' : 'CALENDAR · UPCOMING'}
            </div>
            <h2 className="text-text my-2.5 text-[clamp(30px,3.4vw,44px)] font-semibold tracking-[-0.03em] text-balance">
              {isPast ? 'Past Events' : 'Upcoming Events'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>

        {events.length === 0 && (
          <div className="border-line-soft text-text-mute rounded-[18px] border border-dashed px-6 py-[60px] text-center md:px-10">
            No events scheduled. Check back soon.
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/events"
            className="border-line text-text hover:border-text hover:text-text inline-flex items-center justify-center gap-2.5 rounded-full border bg-[oklch(1_0_0_/_0.02)] px-5.5 py-3.5 text-sm font-semibold transition-all duration-180"
          >
            View Full Calendar
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 12l4-4-4-4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
