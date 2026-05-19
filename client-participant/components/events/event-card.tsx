'use client';

import Link from 'next/link';
import type { HomeEventRecord } from '@/hooks/events/use-home-events';

interface EventCardProps {
  event: HomeEventRecord;
  index: number;
}

const ORB_COLORS = ['lime', 'amber'] as const;
const ANGLES = ['115deg', '95deg', '135deg'];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${month} ${day} · ${time}`;
}

export function EventCard({ event, index }: EventCardProps) {
  const orbColor = ORB_COLORS[index % 2];
  const angle = ANGLES[index % 3];
  const firstSession = event.sessions[0];
  const venueName = firstSession?.venue_name ?? 'TBD';
  const venueDisplay = firstSession?.venue_location
    ? `${venueName} · ${firstSession.venue_location}`
    : venueName;
  const slots = firstSession?.max_slots;
  const slotsDisplay = slots ? `${slots} seats` : 'Open';
  const desc = stripHtml(event.description);
  const shortDesc = desc.length > 120 ? desc.slice(0, 120) + '…' : desc;

  return (
    <Link
      href={`/events/${event.id}`}
      className="ease border-line-soft bg-surface flex cursor-pointer flex-col overflow-hidden rounded-[20px] border transition-[transform_280ms_ease,border-color_280ms_ease,box-shadow_280ms_ease] hover:-translate-y-[6px] hover:border-[oklch(0.7_0.2_130_/_0.5)] hover:shadow-[0_20px_60px_-20px_oklch(0.7_0.2_130_/_0.3),0_0_0_1px_oklch(0.7_0.2_130_/_0.1)]"
    >
      <div
        className="border-line-soft relative aspect-[16/9] overflow-hidden border-b"
        style={
          event.banner_url
            ? { backgroundImage: `url(${event.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {
                backgroundImage: `repeating-linear-gradient(${angle}, transparent 0 18px, oklch(1 0 0 / 0.035) 18px 20px), linear-gradient(135deg, oklch(0.22 0.012 150), oklch(0.16 0.008 150))`
              }
        }
      >
        {!event.banner_url && (
          <>
            <div
              className={`absolute top-[30%] left-[20%] h-[160px] w-[160px] rounded-full opacity-55 blur-[34px] ${orbColor === 'lime' ? 'bg-lime' : 'bg-amber'}`}
            />
            <div
              className={`absolute right-[15%] bottom-[15%] h-[120px] w-[120px] rounded-full blur-[34px] ${orbColor === 'lime' ? 'bg-amber' : 'bg-lime'} opacity-35`}
            />
          </>
        )}

        <div className="absolute top-3 left-3 rounded-md border border-[oklch(1_0_0/0.1)] bg-black/40 px-[9px] py-[5px] font-mono text-[10.5px] tracking-[0.12em] text-white uppercase backdrop-blur-md">
          {event.status}
        </div>

        <div className="absolute bottom-3 left-3 font-mono text-[9.5px] tracking-[0.15em] text-white/30 uppercase">
          [ event cover · 16:9 ]
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-[22px] py-[24px]">
        <div className="flex items-center gap-2.5 font-mono text-[11.5px] tracking-[0.1em] text-white">
          <span className="h-px w-3.5 bg-[oklch(0.6_0.18_130_/_0.5)]" />
          {formatDate(event.start_date)}
        </div>

        <h3 className="text-text my-0.5 text-[19px] leading-[1.25] font-semibold tracking-[-0.02em]">{event.title}</h3>

        <p className="text-text-dim text-[13.5px] leading-[1.55]">{shortDesc}</p>

        <div className="border-line-soft text-text-mute mt-auto flex items-center justify-between border-t border-dashed pt-3.5 text-[12.5px]">
          <div className="text-text-dim flex items-center gap-1.5">
            <span>📍</span> {venueDisplay}
          </div>
          <div className="text-text-dim font-mono text-[11px]">
            <b className="text-primary">{slotsDisplay}</b>
          </div>
        </div>
      </div>
    </Link>
  );
}
