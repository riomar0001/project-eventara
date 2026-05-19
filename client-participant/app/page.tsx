'use client';

import { CTABanner } from '@/components/cta/cta-banner';
import { EventsSection } from '@/components/events/events-section';
import { Footer } from '@/components/footer/footer';
import { HeroSection } from '@/components/hero/hero-section';
import { LiveEventCard } from '@/components/live-event/live-event-card';
import { Navbar } from '@/components/navigation/navbar';
import { TweaksPanel } from '@/components/theme/tweaks-panel';
import { useHomeEvents } from '@/hooks/events/use-home-events';

export default function Page() {
  const { data, loading } = useHomeEvents();

  return (
    <main className="bg-page min-h-screen">
      <Navbar />
      <HeroSection />
      <LiveEventCard liveEvent={data?.live_event ?? null} loading={loading} />
      <EventsSection
        events={data?.events ?? []}
        eventsType={data?.events_type ?? 'upcoming'}
        loading={loading}
      />
      <CTABanner />
      <Footer />
      <TweaksPanel />
    </main>
  );
}
