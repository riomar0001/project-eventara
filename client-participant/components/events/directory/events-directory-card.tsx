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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-line-soft bg-surface transition-all"
      style={{ transition: 'transform 280ms ease, border-color 280ms ease, box-shadow 280ms ease' }}
      onClick={() => onOpen(ev)}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-6px)';
        if (urgent) {
          el.style.borderColor = 'oklch(0.62 0.16 60 / 0.55)';
          el.style.boxShadow = '0 20px 60px -20px oklch(0.62 0.16 60 / 0.28)';
        } else {
          el.style.borderColor = 'oklch(0.7 0.2 130 / 0.5)';
          el.style.boxShadow = '0 20px 60px -20px oklch(0.7 0.2 130 / 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = '';
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }}
    >
      {/* Event visual */}
      <div
        className="relative overflow-hidden border-b border-line-soft"
        style={{
          aspectRatio: '16/9',
          background: 'linear-gradient(135deg, oklch(0.22 0.012 150), oklch(0.16 0.008 150))'
        }}
      >
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
        <div
          className="absolute top-[14px] left-[14px] z-[2] min-w-[54px] rounded-[10px] border border-line-soft px-[10px] py-2 text-center"
          style={{ background: 'oklch(0 0 0 / 0.55)', backdropFilter: 'blur(10px)' }}
        >
          <div className="font-mono text-[10px] font-medium tracking-[0.14em] text-lime">{ev.mo}</div>
          <div className="mt-px text-[20px] leading-none font-bold tracking-[-0.03em] text-text">{ev.day}</div>
        </div>

        {/* Status pill */}
        {ev.status && (
          <div
            className={`absolute top-[14px] right-[14px] z-[2] inline-flex items-center gap-[6px] rounded-full border px-[9px] py-[5px] font-mono text-[10px] tracking-[0.14em] uppercase ${statusPillBg}`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {(ev.status === 'closing' || ev.status === 'live') && (
              <span className="relative flex h-[6px] w-[6px]">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'currentColor', animation: 'pulse-scale 1.6s cubic-bezier(0,0,0.2,1) infinite' }}
                />
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
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-line bg-transparent px-[11px] py-[11px] text-[13px] font-medium text-text transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(ev);
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (urgent) {
                el.style.borderColor = 'var(--amber)';
                el.style.color = 'var(--amber)';
                el.style.background = 'oklch(0.62 0.16 60 / 0.05)';
              } else {
                el.style.borderColor = 'var(--lime)';
                el.style.color = 'var(--lime)';
                el.style.background = 'oklch(0.7 0.2 130 / 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = '';
              el.style.color = '';
              el.style.background = '';
            }}
          >
            View Details <Icon name="arrow-right" size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
