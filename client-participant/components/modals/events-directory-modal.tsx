'use client';

import { Icon } from '@/components/events/directory/icon';
import type { DirectoryEvent } from '@/types/event-directory';

interface EventsDirectoryModalProps {
  ev: DirectoryEvent | null;
  onClose: () => void;
}

export function EventsDirectoryModal({ ev, onClose }: EventsDirectoryModalProps) {
  if (!ev) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-6 backdrop-blur-md" onClick={onClose}>
      <div
        className="border-border bg-card relative w-full max-w-[580px] animate-[modal-pop_260ms_cubic-bezier(0.22,1,0.36,1)] overflow-hidden rounded-[22px] border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="text-muted-foreground hover:text-foreground absolute top-[14px] right-[14px] z-[3] grid h-8 w-8 place-items-center rounded-[10px] bg-black/35 backdrop-blur-md transition-all hover:bg-black/60"
          onClick={onClose}
        >
          <Icon name="x" size={16} />
        </button>

        <div className="relative aspect-[16/7] bg-linear-[135deg] from-[oklch(0.22_0.012_150)] to-[oklch(0.15_0.008_150)]">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `repeating-linear-gradient(${ev.angle}, transparent 0 22px, oklch(1 0 0 / 0.04) 22px 24px)` }}
          />
          <div
            className={`absolute top-[20%] left-[18%] h-[220px] w-[220px] rounded-full opacity-50 blur-[38px] ${ev.orb === 'lime' ? 'bg-primary' : 'bg-orange-400'}`}
          />
          <div
            className={`absolute right-[15%] bottom-[10%] h-[160px] w-[160px] rounded-full opacity-40 blur-[32px] ${ev.orb === 'lime' ? 'bg-orange-400' : 'bg-primary'}`}
          />
          <div className="border-border absolute top-4 left-5 z-[2] min-w-[54px] rounded-[10px] border bg-black/55 px-[10px] py-2 text-center backdrop-blur-md">
            <div className="text-primary font-mono text-[10px] font-medium tracking-[0.14em]">{ev.mo}</div>
            <div className="text-foreground mt-px text-[20px] leading-none font-bold tracking-[-0.03em]">{ev.day}</div>
          </div>
        </div>

        <div className="px-7 pt-6 pb-7">
          <div className="mb-[10px] flex flex-wrap gap-[6px]">
            {ev.tags.map((t) => (
              <span key={t} className="border-border bg-muted/40 text-muted-foreground rounded-full border px-[9px] py-[3px] text-[11px] font-medium">
                {t}
              </span>
            ))}
          </div>

          <h3 className="text-foreground m-0 mb-2 text-[22px] font-semibold tracking-[-0.025em]">{ev.title}</h3>
          <p className="text-muted-foreground m-0 mb-[18px] text-[14.5px] leading-[1.6]">{ev.desc}</p>

          <div className="mb-[18px] grid grid-cols-2 gap-3">
            {[
              ['Date', ev.date],
              ['Time', ev.time],
              ['Venue', ev.venue],
              ['Seats', ev.seats === 0 ? 'Full — waitlist' : `${ev.seats} of ${ev.total} left`, ev.seats === 0 ? 'text-orange-400' : 'text-primary']
            ].map(([label, value, cls]) => (
              <div key={label} className="border-border bg-background rounded-[10px] border px-[14px] py-3">
                <div className="text-muted-foreground font-mono text-[10.5px] tracking-[0.14em] uppercase">{label}</div>
                <div className={`mt-[3px] text-[14px] font-medium ${cls || 'text-foreground'}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-[10px]">
            <button className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-[10px] rounded-full px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-px">
              {ev.seats === 0 ? 'Join Waitlist' : 'Reserve Seat'} <Icon name="arrow-right" size={14} />
            </button>
            <button className="border-border bg-muted/20 text-muted-foreground hover:border-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-[10px] rounded-full border px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all">
              <Icon name="calendar" size={14} /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
