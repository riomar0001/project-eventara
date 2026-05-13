'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MOCK_EVENTS } from '@/constants/events';

interface EventDetailModalProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailModal({ eventId, isOpen, onClose }: EventDetailModalProps) {
  // TODO: fetch from GET /api/events/:id when real API is available
  const event = useMemo(() => {
    if (!eventId) return null;
    return MOCK_EVENTS.find((e) => e.id === eventId);
  }, [eventId]);

  if (!event) return null;

  const percentage = Math.round((event.registered / event.capacity) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {/* Cover image area */}
        <div
          className="relative -m-6 -mt-6 h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[var(--lime)]/20 to-[var(--amber)]/20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 15px,
                var(--line-soft) 15px,
                var(--line-soft) 30px
              )
            `
          }}
        >
          {/* Decorative orbs */}
          <div
            className="absolute rounded-full opacity-40 blur-2xl"
            style={{
              width: '200px',
              height: '200px',
              right: '-50px',
              top: '-30px',
              background: 'radial-gradient(circle, var(--lime), transparent)'
            }}
          />
        </div>

        {/* Header */}
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
              <DialogDescription className="mt-2">{event.description}</DialogDescription>
            </div>
            <div className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--lime)] uppercase">{event.category}</div>
          </div>
        </DialogHeader>

        {/* Content grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--bg)] p-3">
            <div className="font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">Date</div>
            <div className="mt-2 font-medium text-[var(--text)]">{event.date}</div>
          </div>

          <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--bg)] p-3">
            <div className="font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">Time</div>
            <div className="mt-2 font-medium text-[var(--text)]">{event.time}</div>
          </div>

          <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--bg)] p-3">
            <div className="font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">Location</div>
            <div className="mt-2 font-medium text-[var(--text)]">{event.location}</div>
          </div>

          <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--bg)] p-3">
            <div className="font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">Venue</div>
            <div className="mt-2 font-medium text-[var(--text)]">{event.venue}</div>
          </div>
        </div>

        {/* Capacity info */}
        <div className="space-y-3 border-t border-[var(--line-soft)] pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">Capacity</div>
              <div className="mt-1 font-medium text-[var(--text)]">
                {event.registered} / {event.capacity} registered
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-[var(--lime)]">{percentage}%</div>
              <div className="font-mono text-xs text-[var(--text-mute)]">Full</div>
            </div>
          </div>

          {/* Capacity bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--line-soft)]">
            <div className="h-full bg-gradient-to-r from-[var(--lime)] to-[var(--amber)] transition-all" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 border-t border-[var(--line-soft)] pt-4">
          <button className="btn-primary w-full">Register Now</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
