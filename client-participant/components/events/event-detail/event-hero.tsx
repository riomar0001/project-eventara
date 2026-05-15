import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import type { DirectoryEvent } from '@/types/event-directory';

type Props = { event: DirectoryEvent; seatsFilled: number; capacityPct: number; isFull: boolean };

export function EventHero({ event, seatsFilled, capacityPct, isFull }: Props) {
  return (
    <div className="bg-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className={`absolute top-[-120px] right-[-120px] h-[500px] w-[500px] rounded-full blur-[90px] ${event.orb === 'lime' ? 'bg-[radial-gradient(circle,oklch(0.7_0.2_130_/_0.22),transparent_65%)]' : 'bg-[radial-gradient(circle,oklch(0.62_0.16_60_/_0.18),transparent_65%)]'}`}
        />
      </div>

      <div className="relative z-10 container py-10">
        <Link
          href="/events"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        >
          <ArrowLeft size={14} /> Back to events
        </Link>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="border-border text-muted-foreground rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.12em] uppercase">
            {event.cat}
          </span>
          {event.tags.map((tag) => (
            <span key={tag} className="bg-primary/10 text-primary rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.12em] uppercase">
              {tag}
            </span>
          ))}
          {event.status && (
            <span className="rounded-full bg-orange-400/10 px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-orange-400 uppercase">{event.status}</span>
          )}
        </div>

        <h1 className="text-foreground max-w-[24ch] text-[clamp(26px,4vw,46px)] leading-tight font-bold tracking-[-0.03em]">{event.title}</h1>
        <p className="text-muted-foreground mt-3 max-w-[60ch] text-[15px] leading-relaxed">{event.desc}</p>

        <div className="mt-6 flex flex-wrap items-center gap-5">
          {[
            { icon: Calendar, label: event.date },
            { icon: Clock, label: event.time },
            { icon: MapPin, label: event.venue },
            { icon: Users, label: `${seatsFilled}/${event.total} registered` }
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="text-muted-foreground flex items-center gap-2 text-[13.5px]">
              <Icon size={14} className="text-primary" />
              {label}
            </div>
          ))}
        </div>

        <div className="mt-4 max-w-[260px]">
          <div className="bg-border h-1.5 w-full overflow-hidden rounded-full">
            <div className={`h-full rounded-full transition-all ${isFull ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${capacityPct}%` }} />
          </div>
          <p className={`mt-1.5 font-mono text-[11px] ${isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
            {isFull ? 'Fully booked' : `${event.seats} seats remaining`}
          </p>
        </div>
      </div>
    </div>
  );
}
