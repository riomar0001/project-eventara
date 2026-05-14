'use client';

import { useState, useMemo } from 'react';
import { EventCard } from './event-card';
import { UPCOMING_EVENTS } from '@/constants/events';

interface UpcomingEvent {
  id: number;
  date: string;
  title: string;
  desc: string;
  venue: string;
  chip: string;
  seats: string;
  orbColor: 'lime' | 'amber';
  angle: string;
}

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'workshops', label: 'Workshops' },
  { id: 'panels', label: 'Panels' },
  { id: 'hackathons', label: 'Hackathons' }
];

interface EventsSectionProps {
  onEventClick?: (event: UpcomingEvent) => void;
}

export function EventsSection({ onEventClick }: EventsSectionProps) {
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredEvents = useMemo(() => {
    if (selectedTab === 'all') return UPCOMING_EVENTS;
    const chipMap: Record<string, string> = {
      workshops: 'Workshop',
      panels: 'Panel',
      hackathons: 'Hackathon'
    };
    return UPCOMING_EVENTS.filter((e) => e.chip === chipMap[selectedTab]);
  }, [selectedTab]);

  return (
    <section className="relative py-10">
      <div className="container mx-auto max-w-[1240px] px-8">
        {/* Section head */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-text-mute uppercase">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_12px_var(--lime-glow)]" />
              CALENDAR · Q2 2026
            </div>
            <h2 className="my-2.5 text-[clamp(30px,3.4vw,44px)] font-semibold tracking-[-0.03em] text-balance text-text">Upcoming Events</h2>
          </div>

          {/* Tabs */}
          <div className="inline-flex gap-1 rounded-full border border-line-soft bg-surface p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-160 ${
                  selectedTab === tab.id ? 'bg-lime font-semibold text-white' : 'text-text-dim hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-3 gap-[22px]">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onClick={() => onEventClick?.(event)} />
          ))}
        </div>

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="rounded-[18px] border border-dashed border-line-soft px-10 py-[60px] text-center text-text-mute">
            No {selectedTab} scheduled this quarter. Check back soon.
          </div>
        )}

        {/* View Full Calendar button */}
        <div className="mt-8 text-center">
          <button className="inline-flex items-center justify-center gap-2.5 rounded-full border border-line bg-[oklch(1_0_0_/_0.02)] px-5.5 py-3.5 text-sm font-semibold text-text transition-all duration-180 hover:border--text hover:bg--line-soft hover:text-text">
            View Full Calendar
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 12l4-4-4-4" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
