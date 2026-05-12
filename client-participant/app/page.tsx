"use client"

import { useModalState } from "@/hooks/use-modal-state"
import { Navbar } from "@/components/navigation/navbar"
import { HeroSection } from "@/components/hero/hero-section"
import { LiveEventCard } from "@/components/live-event/live-event-card"
import { EventsSection } from "@/components/events/events-section"
import { CTABanner } from "@/components/cta/cta-banner"
import { Footer } from "@/components/footer/footer"
import { EventDetailModal } from "@/components/modals/event-detail-modal"
import { TweaksPanel } from "@/components/theme/tweaks-panel"

export default function Page() {
  const { isOpen, selectedEventId, openModal, closeModal } = useModalState()

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Live Event Card */}
      <LiveEventCard />

      {/* Events Section */}
      <EventsSection onEventClick={(event) => openModal(String(event.id))} />

      {/* CTA Banner */}
      <CTABanner />

      {/* Footer */}
      <Footer />

      {/* Event Detail Modal */}
      <EventDetailModal
        eventId={selectedEventId}
        isOpen={isOpen}
        onClose={closeModal}
      />

      {/* Theme Tweaks Panel */}
      <TweaksPanel />
    </main>
  )
}
