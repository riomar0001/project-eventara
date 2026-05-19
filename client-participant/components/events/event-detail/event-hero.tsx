import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { HomeEventRecord } from '@/hooks/events/use-home-events';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

type Props = { event: HomeEventRecord };

export function EventHero({ event }: Props) {
  const start = new Date(event.start_date);
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const session = event.sessions[0];
  const timeStr = session
    ? new Date(session.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const venue = session
    ? [session.venue_name, session.venue_location].filter(Boolean).join(', ')
    : '—';

  const orbIsLime = event.id.charCodeAt(0) % 2 === 0;

  return (
    <>
      <Link
        href="/events"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
      >
        <ArrowLeft size={14} /> Back to events
      </Link>

    <div className="bg-card relative overflow-hidden rounded-2xl border border-border">
      {event.banner_url && (
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <img src={event.banner_url} alt={event.title} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className={`absolute top-[-120px] right-[-120px] h-[500px] w-[500px] rounded-full blur-[90px] ${orbIsLime ? 'bg-[radial-gradient(circle,oklch(0.7_0.2_130_/_0.22),transparent_65%)]' : 'bg-[radial-gradient(circle,oklch(0.62_0.16_60_/_0.18),transparent_65%)]'}`}
        />
      </div>

      <div className="relative z-10 px-8 py-8">

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.12em] uppercase ${
              event.status === 'started'
                ? 'border-orange-400/40 bg-orange-400/10 text-orange-400'
                : 'border-border text-muted-foreground'
            }`}
          >
            {event.status === 'started' && (
              <span className="relative inline-block h-1.5 w-1.5 animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-orange-400" />
            )}
            {event.status}
          </span>
        </div>

        <h1 className="text-foreground max-w-[24ch] text-[clamp(26px,4vw,46px)] leading-tight font-bold tracking-[-0.03em]">{event.title}</h1>
        <p className="text-muted-foreground mt-3 max-w-[60ch] text-[15px] leading-relaxed">{stripHtml(event.description)}</p>

        <div className="mt-6 flex flex-wrap items-center gap-5">
          {[
            { icon: Calendar, label: dateStr },
            { icon: Clock, label: timeStr },
            { icon: MapPin, label: venue },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="text-muted-foreground flex items-center gap-2 text-[13.5px]">
              <Icon size={14} className="text-primary" />
              {label}
            </div>
          ))}
        </div>

      </div>
    </div>
    </>
  );
}
