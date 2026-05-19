'use client';

import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative pt-16 pb-20 text-center md:pt-[96px] md:pb-[120px]">
      {/* Mesh background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Lime orb */}
        <div className="absolute top-[-180px] left-[-140px] h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,oklch(0.9_0.22_128_/_0.55),transparent_65%)] opacity-55 blur-[80px]" />
        {/* Amber orb */}
        <div className="absolute top-[40px] right-[-160px] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,oklch(0.82_0.17_75_/_0.4),transparent_65%)] opacity-55 blur-[80px]" />
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--line-soft)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,black_30%,transparent_75%)] bg-[length:64px_64px] opacity-35" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-[1240px] px-4 md:px-8">
        {/* Eyebrow */}
        <div className="text-text-mute inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase">
          <span className="bg-lime inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)]" />
          DAVAO · DEFI · PH
        </div>

        {/* Headline */}
        <h1 className="mx-auto my-[22px] mb-[24px] max-w-[14ch] text-[clamp(55px,6.4vw,100px)] leading-[0.98] font-bold tracking-[-0.025em] text-balance">
          Empowering the{' '}
          <span className="inline-block bg-[linear-gradient(100deg,var(--lime)_20%,oklch(0.95_0.2_140)_70%)] bg-clip-text pr-[0.3em] font-['Plus_Jakarta_Sans',serif] font-medium text-transparent italic">
            Davao DeFi
          </span>{' '}
          Community.
        </h1>

        {/* Subheadline */}
        <p className="text-text-dim mx-auto mb-10 max-w-[58ch] text-[clamp(16px,1.35vw,19px)] leading-[1.55] text-pretty">
          Your centralized hub to discover, join, and engage with the premier Web3 and DeFi events in the region — built by participants, for participants.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-3.5">
          <Link href="/events" className="bg-lime inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-base font-semibold text-white shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5">
            Explore Events →
          </Link>
          <Link href="/register" className="border--amber text-amber inline-flex items-center justify-center gap-2.5 rounded-full border px-6 py-3.5 text-base font-semibold transition-all duration-180 hover:bg-[oklch(0.62_0.16_60_/_0.12)] hover:shadow-[0_0_24px_-6px_var(--amber-glow)]">
            Join the Community
          </Link>
        </div>

      </div>
    </section>
  );
}
