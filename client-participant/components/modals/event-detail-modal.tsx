'use client';

import type { UpcomingEvent } from '@/hooks/use-modal-state';

interface EventDetailModalProps {
  event: UpcomingEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  if (!isOpen || !event) return null;

  const isFull = event.seats.startsWith('Full');

  return (
    <div className="animate-fadein fixed inset-0 z-[100] grid place-items-center bg-black/50 p-6 backdrop-blur-md" onClick={onClose}>
      <div
        className="border-border bg-card animate-modal-pop relative w-full max-w-[580px] overflow-hidden rounded-[22px] border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-[14px] right-[14px] z-[3] grid h-8 w-8 place-items-center rounded-[10px] bg-black/35 text-white backdrop-blur-md transition-all hover:bg-black/60"
          onClick={onClose}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="relative aspect-[16/7] bg-linear-[135deg] from-[oklch(0.22_0.012_150)] to-[oklch(0.17_0.01_150)]">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `repeating-linear-gradient(${event.angle}, transparent 0 22px, oklch(1 0 0 / 0.04) 22px 24px)` }}
          />
          <div
            className={`absolute top-[10%] left-[20%] h-[220px] w-[220px] rounded-full opacity-50 blur-[40px] ${event.orbColor === 'lime' ? 'bg-primary' : 'bg-orange-400'}`}
          />
          <div
            className={`absolute right-[15%] bottom-[10%] h-[160px] w-[160px] rounded-full opacity-35 blur-[34px] ${event.orbColor === 'lime' ? 'bg-orange-400' : 'bg-primary'}`}
          />
          <div className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[0.15em] text-white/35 uppercase">[ event cover ]</div>
          <span className="text-muted-foreground absolute top-4 left-5 rounded-md border border-white/12 bg-black/40 px-[10px] py-[5px] font-mono text-[10.5px] tracking-[0.12em] uppercase backdrop-blur-md">
            {event.chip}
          </span>
        </div>

        <div className="px-7 pt-6 pb-7">
          <div className="text-primary mb-2 flex items-center gap-2.5 font-mono text-[11.5px] tracking-[0.1em]">
            <span className="bg-primary/40 h-px w-[14px]" />
            {event.date}
          </div>

          <h3 className="text-foreground m-0 mb-[6px] text-[24px] font-semibold tracking-[-0.025em]">{event.title}</h3>
          <p className="text-muted-foreground m-0 mb-[18px] text-[14.5px] leading-[1.6]">{event.desc}</p>

          <div className="mb-[18px] grid grid-cols-2 gap-[14px]">
            {[
              ['Venue', event.venue, 'text-foreground'],
              ['Availability', event.seats, isFull ? 'text-orange-400' : 'text-primary'],
              ['Format', event.chip, 'text-foreground'],
              ['Cost', 'Free · Members only', 'text-foreground']
            ].map(([label, value, cls]) => (
              <div key={label} className="border-border bg-background rounded-[10px] border px-[14px] py-3">
                <div className="text-muted-foreground font-mono text-[10.5px] tracking-[0.14em] uppercase">{label}</div>
                <div className={`mt-[3px] text-[14px] font-medium ${cls}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-[10px]">
            <button className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-[10px] rounded-full px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-px">
              {isFull ? 'Join Waitlist' : 'Reserve Seat'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button className="border-border bg-muted/20 text-muted-foreground hover:border-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-[10px] rounded-full border px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
