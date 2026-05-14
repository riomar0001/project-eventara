'use client';

import { CTABanner } from '@/components/cta/cta-banner';
import { EventsSection } from '@/components/events/events-section';
import { Footer } from '@/components/footer/footer';
import { HeroSection } from '@/components/hero/hero-section';
import { LiveEventCard } from '@/components/live-event/live-event-card';
import { EventDetailModal } from '@/components/modals/event-detail-modal';
import { Navbar } from '@/components/navigation/navbar';
import { TweaksPanel } from '@/components/theme/tweaks-panel';
import { useModalState } from '@/hooks/use-modal-state';

export default function Page() {
  const { isOpen, event, openModal, closeModal } = useModalState();

  return (
    <main className="min-h-screen bg-page">
      <Navbar />
      <HeroSection />
      <LiveEventCard />
      <EventsSection onEventClick={openModal} />
      <CTABanner />
      <Footer />
      <EventDetailModal event={event} isOpen={isOpen} onClose={closeModal} />
      <TweaksPanel />
    </main>
  );
}
