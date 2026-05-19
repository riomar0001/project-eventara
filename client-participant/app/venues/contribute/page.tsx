'use client';

import { Footer } from '@/components/footer/footer';
import { Navbar } from '@/components/navigation/navbar';
import { ContributeVenueForm } from '@/components/venue-hub/contribute-venue-form';

export default function ContributeVenuePage() {
  return (
    <div className="bg-page relative min-h-screen">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 top-0 z-0 h-[480px] overflow-hidden">
        <div className="absolute top-[-200px] left-[-160px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,oklch(0.9_0.22_128_/_0.3),transparent_65%)] blur-[90px]" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--line-soft)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_30%,transparent_75%)] bg-[length:64px_64px] opacity-25" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <ContributeVenueForm />
        <Footer />
      </div>
    </div>
  );
}
