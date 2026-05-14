'use client';

import { StatsGrid } from './stats-grid';

export function HeroSection() {
  return (
    <section className="relative pt-[96px] pb-[120px] text-center">
      {/* Mesh background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Lime orb */}
        <div
          className="absolute rounded-full opacity-55 blur-[80px]"
          style={{
            width: '720px',
            height: '720px',
            left: '-140px',
            top: '-180px',
            background: 'radial-gradient(circle, oklch(0.9 0.22 128 / 0.55), transparent 65%)'
          }}
        />
        {/* Amber orb */}
        <div
          className="absolute rounded-full opacity-55 blur-[80px]"
          style={{
            width: '620px',
            height: '620px',
            right: '-160px',
            top: '40px',
            background: 'radial-gradient(circle, oklch(0.82 0.17 75 / 0.4), transparent 65%)'
          }}
        />
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage: `
              linear-gradient(var(--line-soft) 1px, transparent 1px),
              linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 75%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-[1240px] px-8">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-text-mute uppercase">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: 'var(--lime)',
              boxShadow: '0 0 12px var(--lime-glow)'
            }}
          />
          DAVAO · DEFI · PH
        </div>

        {/* Headline */}
        <h1
          className="mx-auto my-[22px] mb-[24px] max-w-[14ch] text-[clamp(55px,6.4vw,100px)] leading-[0.98] font-bold tracking-[-0.025em]"
          style={{
            textWrap: 'balance'
          }}
        >
          Empowering the{' '}
          <span
            className="inline-block pr-[0.3em] font-medium italic"
            style={{
              background: 'linear-gradient(100deg, var(--lime) 20%, oklch(0.95 0.2 140) 70%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontFamily: "'Plus Jakarta Sans', serif"
            }}
          >
            Davao DeFi
          </span>{' '}
          Community.
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-10 max-w-[58ch] text-[clamp(16px,1.35vw,19px)] leading-[1.55] text-text-dim"
          style={{
            textWrap: 'pretty'
          }}
        >
          Your centralized hub to discover, join, and engage with the premier Web3 and DeFi events in the region — built by participants, for participants.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-3.5">
          <button className="inline-flex items-center justify-center gap-2.5 rounded-full bg-lime px-6 py-3.5 text-base font-semibold text-white shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5">Explore Events →</button>
          <button className="inline-flex items-center justify-center gap-2.5 rounded-full border border--amber px-6 py-3.5 text-base font-semibold text-amber transition-all duration-180 hover:bg-[oklch(0.62_0.16_60_/_0.12)] hover:shadow-[0_0_24px_-6px_var(--amber-glow)]">Join the Community</button>
        </div>

        {/* Stats Grid */}
        <div className="mt-[72px]">
          <StatsGrid />
        </div>
      </div>
    </section>
  );
}
