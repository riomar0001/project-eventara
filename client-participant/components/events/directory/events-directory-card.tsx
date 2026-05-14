'use client';

import type { DirectoryEvent } from '@/types/event-directory';
import { Icon } from './icon';

interface EventsDirectoryCardProps {
  ev: DirectoryEvent;
  onOpen: (ev: DirectoryEvent) => void;
}

export function EventsDirectoryCard({ ev, onOpen }: EventsDirectoryCardProps) {
  const isLow = ev.seats > 0 && ev.seats <= ev.total * 0.2;
  const isFull = ev.seats === 0;
  const pct = Math.max(3, Math.round(((ev.total - ev.seats) / ev.total) * 100));
  const urgent = ev.status === 'closing' || ev.status === 'live';

  const statusPillBg = ev.status === 'new'
    ? 'bg-[oklch(0.7_0.2_130_/_0.08)] border-[oklch(0.7_0.2_130_/_0.35)] text-lime'
    : 'bg-[oklch(0.62_0.16_60_/_0.1)] border-[oklch(0.62_0.16_60_/_0.35)] text-amber';

  return (
    <article
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-line-soft bg-surface transition-[transform_280ms_ease,border-color_280ms_ease,box-shadow_280ms_ease] hover:-translate-y-[6px] ${urgent ? 'hover:border-[oklch(0.62_0.16_60_/_0.55)] hover:shadow-[0_20px_60px_-20px_oklch(0.62_0.16_60_/_0.28)]' : 'hover:border-[oklch(0.7_0.2_130_/_0.5)] hover:shadow-[0_20px_60px_-20px_oklch(0.7_0.2_130_/_0.3)]'}`}
      onClick={() => onOpen(ev)}
    >
      {/* Event visual */}
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line-soft bg-linear-[135deg] from-[oklch(0.22_0.012_150)] to-[oklch(0.16_0.008_150)]">
        {/* Stripes */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `repeating-linear-gradient(${ev.angle}, transparent 0 20px, oklch(1 0 0 / 0.035) 20px 22px)` }}
        />
        {/* Orbs */}
        <div
          className={`absolute left-[20%] top-[25%] h-[150px] w-[150px] rounded-full opacity-50 blur-[32px] ${ev.orb === 'lime' ? 'bg-primary' : 'bg-orange-400'}`}
        />
        <div
          className={`absolute right-[15%] bottom-[12%] h-[110px] w-[110px] rounded-full opacity-32 blur-[32px] ${ev.orb === 'lime' ? 'bg-orange-400' : 'bg-primary'}`}
        />

        {/* Date badge */}
        <div className="absolute top-[14px] left-[14px] z-[2] min-w-[54px] rounded-[10px] border border-line-soft/20 bg-black/55 px-[10px] py-2 text-center backdrop-blur-[10px]">
          <div className="font-mono text-[10px] font-medium tracking-[0.14em] text-lime">{ev.mo}</div>
          <div className="mt-px text-[20px] leading-none font-bold tracking-[-0.03em] text-white/60">{ev.day}</div>
        </div>

        {/* Status pill */}
        {ev.status && (
          <div className={`absolute top-[14px] right-[14px] z-[2] inline-flex items-center gap-[6px] rounded-full border px-[9px] py-[5px] font-mono text-[10px] tracking-[0.14em] uppercase backdrop-blur-md ${statusPillBg}`}>
            {(ev.status === 'closing' || ev.status === 'live') && (
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inset-0 animate-[pulse-scale_1.6s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-current" />
              </span>
            )}
            {ev.status === 'closing' ? 'Closing Soon' : ev.status === 'live' ? 'Live' : 'New'}
          </div>
        )}

        {/* Label */}
        <div className="absolute bottom-3 left-[14px] font-mono text-[9.5px] tracking-[0.14em] uppercase text-[oklch(1_0_0_/_0.3)]">
          [ event cover · 16:9 ]
        </div>
      </div>

      {/* Event body */}
      <div className="flex flex-1 flex-col gap-[10px] px-5 pt-5 pb-[22px]">
        <h3 className="m-0 text-[18px] leading-[1.28] font-semibold tracking-[-0.02em] text-text">{ev.title}</h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-[6px]">
          {ev.tags.map((t) => (
            <span key={t} className="rounded-full border border-line-soft bg-[oklch(1_0_0_/_0.04)] px-[9px] py-[3px] text-[11px] font-medium text-text-dim">
              {t}
            </span>
          ))}
        </div>

        {/* Event details */}
        <div className="flex flex-col gap-[6px] py-[6px] text-[12.5px] text-text-dim">
          <div className="flex items-center gap-2">
            <Icon name="clock" size={13} />
            {ev.time}
          </div>
          <div className="flex items-center gap-2">
            <Icon name="pin" size={13} />
            {ev.venue}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex flex-col items-stretch gap-[10px]">
          <div className="flex items-center gap-[10px]">
            <div className="h-[3px] flex-1 overflow-hidden rounded-[2px] bg-[oklch(1_0_0_/_0.05)]">
              <div
                className={`h-full rounded-[2px] transition-all ${isLow ? 'bg-orange-400' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`font-mono text-[10.5px] ${isLow ? 'text-amber' : 'text-text-mute'}`}>
              {isFull ? (
                <span className="text-amber">Full</span>
              ) : (
                <>
                  <span className={isLow ? 'text-amber' : 'text-text'}>{ev.seats}</span> left
                </>
              )}
            </span>
          </div>
          <button
            className={`flex w-full items-center justify-center gap-2 rounded-[10px] border border-line bg-transparent px-[11px] py-[11px] text-[13px] font-medium text-text transition-all ${urgent ? 'hover:border-[oklch(0.62_0.16_60)] hover:text-[oklch(0.62_0.16_60)] hover:bg-[oklch(0.62_0.16_60_/_0.05)]' : 'hover:border-[oklch(0.7_0.2_130)] hover:text-[oklch(0.7_0.2_130)] hover:bg-[oklch(0.7_0.2_130_/_0.05)]'}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(ev);
            }}
          >
            View Details <Icon name="arrow-right" size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
