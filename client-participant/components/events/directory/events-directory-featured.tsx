'use client';

import type { FeaturedEvent } from '@/types/event-directory';
import { Icon } from './icon';

interface EventsDirectoryFeaturedProps {
  featured: FeaturedEvent;
  onOpen: () => void;
}

export function EventsDirectoryFeatured({ featured, onOpen }: EventsDirectoryFeaturedProps) {
  return (
    <div
      className="relative mt-10 grid min-h-[340px] overflow-hidden rounded-[24px] border"
      style={{
        gridTemplateColumns: '1.25fr 1fr',
        background: 'linear-gradient(180deg, var(--surface), oklch(0.18 0.01 150))',
        borderColor: 'var(--line)'
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 85% 20%, oklch(0.82 0.17 75 / 0.18), transparent 45%)'
        }}
      />

      {/* Body */}
      <div className="relative flex flex-col gap-[14px] px-[44px] py-10">
        {/* Tag */}
        <div
          className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-[6px] font-mono text-[11px] tracking-[0.16em]"
          style={{
            background: 'oklch(0.82 0.17 75 / 0.12)',
            borderColor: 'oklch(0.82 0.17 75 / 0.4)',
            color: 'var(--amber)'
          }}
        >
          <span
            className="h-1 w-1 rounded-full"
            style={{
              background: 'var(--amber)',
              boxShadow: '0 0 10px var(--amber-glow)'
            }}
          />
          FEATURED · END OF YEAR
        </div>

        <h2
          className="my-1 max-w-[18ch] leading-[1.08] font-semibold tracking-[-0.03em] text-balance"
          style={{
            fontSize: 'clamp(28px, 3.2vw, 40px)',
            color: 'var(--text)'
          }}
        >
          {featured.title}
        </h2>

        <p className="m-0 max-w-[48ch] text-[14.5px] leading-[1.55]" style={{ color: 'var(--text-dim)' }}>
          {featured.desc}
        </p>

        {/* Meta */}
        <div className="mt-2 grid grid-cols-3 gap-5 border-y py-[18px]" style={{ borderColor: 'var(--line-soft)' }}>
          <div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: 'var(--text-mute)' }}>
              Date
            </div>
            <div className="mt-[3px] text-[14px] font-medium" style={{ color: 'var(--text)' }}>
              {featured.date}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: 'var(--text-mute)' }}>
              Time
            </div>
            <div className="mt-[3px] text-[14px] font-medium" style={{ color: 'var(--text)' }}>
              {featured.time}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: 'var(--text-mute)' }}>
              Venue
            </div>
            <div className="mt-[3px] text-[14px] font-medium" style={{ color: 'var(--text)' }}>
              {featured.venue}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-[10px]">
          <button
            className="inline-flex items-center justify-center gap-[10px] rounded-full px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all hover:-translate-y-px"
            style={{
              background: 'var(--lime)',
              color: '#0a1005',
              boxShadow: '0 8px 28px -10px var(--lime-glow)'
            }}
            onClick={onOpen}
          >
            Register Now <Icon name="arrow-right" size={14} />
          </button>
          <button
            className="inline-flex items-center justify-center gap-[10px] rounded-full border px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all"
            style={{
              color: 'var(--text-dim)',
              borderColor: 'var(--line)',
              background: 'oklch(1 0 0 / 0.02)'
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.color = 'var(--text)';
              el.style.borderColor = 'oklch(1 0 0 / 0.2)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.color = '';
              el.style.borderColor = '';
            }}
          >
            View Details
          </button>
        </div>
      </div>

      {/* Visual */}
      <div
        className="relative overflow-hidden"
        style={{
          borderLeft: '1px solid var(--line-soft)',
          background: `
            radial-gradient(circle at 30% 70%, oklch(0.9 0.22 128 / 0.28), transparent 55%),
            radial-gradient(circle at 80% 25%, oklch(0.82 0.17 75 / 0.35), transparent 55%),
            linear-gradient(135deg, oklch(0.2 0.01 150), oklch(0.14 0.008 150))
          `
        }}
      >
        {/* Stripes */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(105deg, transparent 0 24px, oklch(1 0 0 / 0.028) 24px 26px)'
          }}
        />
        {/* Orbs */}
        <div className="absolute top-[30%] left-[20%] h-[220px] w-[220px] rounded-full opacity-30 blur-[34px]" style={{ background: 'var(--lime)' }} />
        <div className="absolute right-[12%] bottom-[18%] h-[180px] w-[180px] rounded-full opacity-45 blur-[30px]" style={{ background: 'var(--amber)' }} />
        {/* Year */}
        <div
          className="absolute top-8 right-10 leading-[0.8] font-bold tracking-[-0.05em]"
          style={{
            fontSize: 'clamp(80px, 12vw, 160px)',
            color: 'transparent',
            WebkitTextStroke: '1.5px oklch(1 0 0 / 0.12)'
          }}
        >
          &apos;26
        </div>
        {/* Label */}
        <div className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: 'oklch(1 0 0 / 0.3)' }}>
          [ event cover · 16:9 ]
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style jsx>{`
        @media (max-width: 1024px) {
          div:first-child {
            grid-template-columns: 1fr;
          }
          div:first-child > div:last-child {
            order: -1;
            min-height: 200px;
            border-left: none;
            border-bottom: 1px solid var(--line-soft);
          }
        }
      `}</style>
    </div>
  );
}
