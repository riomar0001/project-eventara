'use client';

import { StatsGrid } from './stats-grid';

export function HeroSection() {
  return (
    <section className="relative pt-[96px] pb-[120px] text-center">
      {/* Mesh background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Lime orb */}
        <div className="absolute left-[-140px] top-[-180px] h-[720px] w-[720px] rounded-full opacity-55 blur-[80px] bg-[radial-gradient(circle,oklch(0.9_0.22_128_/_0.55),transparent_65%)]" />
        {/* Amber orb */}
        <div className="absolute right-[-160px] top-[40px] h-[620px] w-[620px] rounded-full opacity-55 blur-[80px] bg-[radial-gradient(circle,oklch(0.82_0.17_75_/_0.4),transparent_65%)]" />
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-35 bg-[length:64px_64px] bg-[linear-gradient(var(--line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--line-soft)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,black_30%,transparent_75%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-[1240px] px-8">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-text-mute uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_12px_var(--lime-glow)]" />
          DAVAO · DEFI · PH
        </div>

        {/* Headline */}
        <h1 className="mx-auto my-[22px] mb-[24px] max-w-[14ch] text-[clamp(55px,6.4vw,100px)] leading-[0.98] font-bold tracking-[-0.025em] text-balance">
          Empowering the{' '}
          <span className="inline-block bg-[linear-gradient(100deg,var(--lime)_20%,oklch(0.95_0.2_140)_70%)] bg-clip-text pr-[0.3em] font-['Plus_Jakarta_Sans',serif] font-medium italic text-transparent">
            Davao DeFi
          </span>{' '}
          Community.
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-[58ch] text-[clamp(16px,1.35vw,19px)] leading-[1.55] text-text-dim text-pretty">
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
