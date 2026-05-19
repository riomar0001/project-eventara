'use client';

import { Calendar, Clock, MapPin, MessageSquare, Users } from 'lucide-react';
import type { HomeEventRecord } from '@/hooks/events/use-home-events';

const DONE_STATUSES = new Set(['ended', 'cancelled']);

type Props = { event: HomeEventRecord; totalSlots: number; isFull: boolean; onFeedbackClick: () => void };

export function EventSidebar({ event, totalSlots, isFull, onFeedbackClick }: Props) {
  const start = new Date(event.start_date);
  const dateStr = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const session = event.sessions[0];
  const timeStr = session
    ? new Date(session.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const venue = session
    ? [session.venue_name, session.venue_location].filter(Boolean).join(', ')
    : '—';

  const isDone = DONE_STATUSES.has(event.status);

  return (
    <div className="space-y-4">
      <div className="border-border bg-card rounded-2xl border p-5">
        {isDone ? (
          <>
            <p className="text-foreground mb-1 text-sm font-semibold">This event has ended</p>
            <p className="text-muted-foreground mb-4 text-[13px]">Share your experience to help improve future events.</p>
            <button
              onClick={onFeedbackClick}
              className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5"
            >
              <MessageSquare size={15} />
              Leave feedback
            </button>
          </>
        ) : (
          <>
            <p className="text-foreground mb-1 text-sm font-semibold">Ready to join?</p>
            <p className="text-muted-foreground mb-4 text-[13px]">
              {isFull
                ? 'This event is fully booked.'
                : totalSlots > 0
                ? `${totalSlots} spot${totalSlots !== 1 ? 's' : ''} — secure yours now.`
                : 'Open attendance — register to confirm your spot.'}
            </p>

            {!isFull ? (
              <button className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center gap-2.5 rounded-full px-5.5 py-3.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5">
                Register for this event
              </button>
            ) : (
              <button className="border-border text-muted-foreground hover:border-muted-foreground w-full rounded-full border py-3 text-sm font-semibold transition-all">
                Join waitlist
              </button>
            )}
          </>
        )}
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <p className="text-muted-foreground mb-3 font-mono text-[11px] tracking-[0.14em] uppercase">Event info</p>
        <div className="space-y-2.5">
          {[
            { icon: Calendar, label: dateStr },
            { icon: Clock, label: timeStr },
            { icon: MapPin, label: venue },
            { icon: Users, label: totalSlots > 0 ? `${totalSlots} capacity` : 'Open attendance' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="text-muted-foreground flex items-center gap-2.5 text-[13px]">
              <Icon size={14} className="text-muted-foreground" />
              {label}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
