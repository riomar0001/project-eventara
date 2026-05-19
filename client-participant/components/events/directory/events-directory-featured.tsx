'use client';

import type { FeaturedEvent } from '@/types/event-directory';
import { Icon } from './icon';

interface EventsDirectoryFeaturedProps {
  featured: FeaturedEvent;
  onOpen: () => void;
}

export function EventsDirectoryFeatured({ featured, onOpen }: EventsDirectoryFeaturedProps) {
  return (
    <div className="border-line relative mt-10 grid min-h-[340px] grid-cols-[1.25fr_1fr] overflow-hidden rounded-[24px] border bg-linear-[180deg] from-[oklch(1_0_0)] to-[oklch(0.97_0.005_150)]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,oklch(0.62_0.16_60_/_0.1),transparent_45%)]" />

      {/* Body */}
      <div className="relative flex flex-col gap-[14px] px-[44px] py-10">
        {/* Tag */}
        <div className="text-amber inline-flex w-fit items-center gap-2 rounded-full border border-[oklch(0.62_0.16_60_/_0.35)] bg-[oklch(0.62_0.16_60_/_0.1)] px-3 py-[6px] font-mono text-[11px] tracking-[0.16em]">
          <span className="bg-amber h-1 w-1 rounded-full shadow-[0_0_10px_var(--amber-glow)]" />
          {featured.tag}
        </div>

        <h2 className="text-text my-1 max-w-[18ch] text-[clamp(28px,3.2vw,40px)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">
          {featured.title}
        </h2>

        <p className="text-muted-foreground m-0 max-w-[48ch] text-[14.5px] leading-[1.55]">{featured.desc}</p>

        {/* Meta */}
        <div className="border-border mt-2 grid grid-cols-3 gap-5 border-y py-[18px]">
          <div>
            <div className="text-muted-foreground font-mono text-[10px] tracking-[0.16em] uppercase">Date</div>
            <div className="text-foreground mt-[3px] text-[14px] font-medium">{featured.date}</div>
          </div>
          <div>
            <div className="text-muted-foreground font-mono text-[10px] tracking-[0.16em] uppercase">Time</div>
            <div className="text-foreground mt-[3px] text-[14px] font-medium">{featured.time}</div>
          </div>
          <div>
            <div className="text-muted-foreground font-mono text-[10px] tracking-[0.16em] uppercase">Venue</div>
            <div className="text-foreground mt-[3px] text-[14px] font-medium">{featured.venue}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-[10px]">
          <button
            className="bg-lime inline-flex items-center justify-center gap-[10px] rounded-full px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] text-white shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-px"
            onClick={onOpen}
          >
            Register Now <Icon name="arrow-right" size={14} />
          </button>
          <button className="border-line text-text-dim hover:text-text inline-flex items-center justify-center gap-[10px] rounded-full border bg-[oklch(1_0_0_/_0.02)] px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all hover:border-[oklch(1_0_0_/_0.2)]">
            View Details
          </button>
        </div>
      </div>

      {/* Visual */}
      <div className="border-line-soft relative overflow-hidden border-l bg-[radial-gradient(circle_at_30%_70%,oklch(0.9_0.22_128_/_0.28),transparent_55%),radial-gradient(circle_at_80%_25%,oklch(0.82_0.17_75_/_0.35),transparent_55%),linear-gradient(135deg,oklch(0.2_0.01_150),oklch(0.14_0.008_150))]">
        {featured.banner_url ? (
          <>
            <img src={featured.banner_url} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </>
        ) : (
          <>
            {/* Stripes */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(105deg,transparent_0_24px,oklch(1_0_0_/_0.028)_24px_26px)]" />
            {/* Orbs */}
            <div className="bg-primary absolute top-[30%] left-[20%] h-[220px] w-[220px] rounded-full opacity-30 blur-[34px]" />
            <div className="absolute right-[12%] bottom-[18%] h-[180px] w-[180px] rounded-full bg-orange-400 opacity-45 blur-[30px]" />
            {/* Year */}
            <div className="absolute top-8 right-10 text-[clamp(80px,12vw,160px)] leading-[0.8] font-bold tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_oklch(1_0_0_/_0.12)]">
              &apos;26
            </div>
          </>
        )}
        {/* Label */}
        <div className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[0.16em] text-white/30 uppercase">[ event cover · 16:9 ]</div>
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
            border-bottom: 1px solid oklch(0.9 0.008 150 / 0.85);
          }
        }
      `}</style>
    </div>
  );
}
