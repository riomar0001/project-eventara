'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, MessageSquare, QrCode } from 'lucide-react';
import type { HomeEventRecord, ApiEventSession } from '@/hooks/events/use-home-events';
import { useEventRegistrations } from '@/hooks/events/use-event-registrations';
import { SessionQrModal } from './session-qr-modal';

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

  const { registeredSessions, initializing } = useEventRegistrations(event.id, event.sessions);
  const [qrSession, setQrSession] = useState<ApiEventSession | null>(null);

  return (
    <>
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
          ) : initializing ? (
            <div className="space-y-2.5">
              <div className="bg-muted h-3 w-2/3 animate-pulse rounded-full" />
              <div className="bg-muted h-3 w-1/2 animate-pulse rounded-full" />
              <div className="bg-muted mt-4 h-12 animate-pulse rounded-full" />
            </div>
          ) : registeredSessions.length > 0 ? (
            <>
              <div className="mb-3 flex items-center gap-1.5">
                <span className="bg-primary inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_8px_var(--lime-glow)]" />
                <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">You&apos;re registered</p>
              </div>
              <div className="space-y-2">
                {registeredSessions.map((s) => (
                  <div key={s.id} className="bg-background rounded-xl p-3">
                    <p className="text-foreground text-[13px] font-semibold leading-snug">{s.title}</p>
                    <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                      {new Date(s.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(s.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <button
                      onClick={() => setQrSession(s)}
                      className="bg-primary text-primary-foreground mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-semibold shadow-[0_4px_14px_-4px_var(--lime-glow)] transition-all hover:opacity-90"
                    >
                      <QrCode size={13} />
                      Show QR Code
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-foreground mb-1 text-sm font-semibold">Register for this Event</p>
              <p className="text-muted-foreground mb-4 text-[13px]">
                {isFull
                  ? 'This event is fully booked.'
                  : totalSlots > 0
                  ? `${totalSlots} spot${totalSlots !== 1 ? 's' : ''} available.`
                  : 'Open attendance — secure your spot.'}
              </p>
              {!isFull ? (
                <a
                  href="#programme"
                  className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5"
                >
                  Register for this Event
                </a>
              ) : (
                <button className="border-border text-muted-foreground hover:border-muted-foreground w-full rounded-full border py-3 text-sm font-semibold transition-all">
                  Fully booked
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
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="text-muted-foreground flex items-center gap-2.5 text-[13px]">
                <Icon size={14} className="text-muted-foreground" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {qrSession && (
        <SessionQrModal
          eventId={event.id}
          sessionId={qrSession.id}
          sessionTitle={qrSession.title}
          onClose={() => setQrSession(null)}
        />
      )}
    </>
  );
}
