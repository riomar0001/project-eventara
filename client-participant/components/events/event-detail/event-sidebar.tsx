import Link from 'next/link';
import { Calendar, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import type { DirectoryEvent } from '@/types/event-directory';

type Props = { event: DirectoryEvent; isFull: boolean };

export function EventSidebar({ event, isFull }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold text-foreground">Ready to join?</p>
        <p className="mb-4 text-[13px] text-muted-foreground">
          {isFull ? 'This event is fully booked.' : `${event.seats} spot${event.seats !== 1 ? 's' : ''} left — secure yours now.`}
        </p>

        {!isFull ? (
          <button className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-primary px-5.5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5">
            Register for this event
          </button>
        ) : (
          <button className="w-full rounded-full border border-border py-3 text-sm font-semibold text-muted-foreground transition-all hover:border-muted-foreground">
            Join waitlist
          </button>
        )}

        <Link href={`/events/${event.id}/feedback`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:border-muted-foreground">
          Leave feedback <ChevronRight size={13} />
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">Event info</p>
        <div className="space-y-2.5">
          {[
            { icon: Calendar, label: event.date },
            { icon: Clock, label: event.time },
            { icon: MapPin, label: event.venue },
            { icon: Users, label: `${event.total} capacity` }
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
              <Icon size={14} className="text-muted-foreground" />{label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
