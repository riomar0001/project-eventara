import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { DirectoryEvent } from '@/types/event-directory';

type Props = { event: DirectoryEvent; seatsFilled: number; capacityPct: number; isFull: boolean };

export function EventHero({ event, seatsFilled, capacityPct, isFull }: Props) {
  const orbColor = event.orb === 'lime' ? 'oklch(0.7 0.2 130 / 0.22)' : 'oklch(0.62 0.16 60 / 0.18)';

  return (
    <div className="relative overflow-hidden bg-card">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-[-120px] right-[-120px] h-[500px] w-[500px] rounded-full blur-[90px]"
          style={{ background: `radial-gradient(circle, ${orbColor}, transparent 65%)` }} />
      </div>

      <div className="container relative z-10 py-10">
        <Link href="/events" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={14} /> Back to events
        </Link>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border px-3 py-1 font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground">{event.cat}</span>
          {event.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] tracking-[0.12em] uppercase text-primary">{tag}</span>
          ))}
          {event.status && (
            <span className="rounded-full bg-orange-400/10 px-3 py-1 font-mono text-[11px] tracking-[0.12em] uppercase text-orange-400">{event.status}</span>
          )}
        </div>

        <h1 className="max-w-[24ch] font-bold leading-tight tracking-[-0.03em] text-foreground" style={{ fontSize: 'clamp(26px, 4vw, 46px)' }}>{event.title}</h1>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{event.desc}</p>

        <div className="mt-6 flex flex-wrap items-center gap-5">
          {[
            { icon: Calendar, label: event.date },
            { icon: Clock, label: event.time },
            { icon: MapPin, label: event.venue },
            { icon: Users, label: `${seatsFilled}/${event.total} registered` }
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
              <Icon size={14} className="text-primary" />{label}
            </div>
          ))}
        </div>

        <div className="mt-4 max-w-[260px]">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
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
