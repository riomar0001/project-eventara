"use client"

import { useState, useCallback } from "react"
import { useModalState } from "@/hooks/use-modal-state"
import { Navbar } from "@/components/navigation/navbar"
import { HeroSection } from "@/components/hero/hero-section"
import { LiveEventCard } from "@/components/live-event/live-event-card"
import { EventsSection } from "@/components/events/events-section"
import { CTABanner } from "@/components/cta/cta-banner"
import { Footer } from "@/components/footer/footer"
import { EventDetailModal } from "@/components/modals/event-detail-modal"
import { TweaksPanel } from "@/components/theme/tweaks-panel"

type AuthMode = "login" | "register"

export default function Page() {
  const { isOpen, selectedEventId, openModal, closeModal } = useModalState()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)

  const openAuth = useCallback((mode: AuthMode) => setAuthMode(mode), [])
  const closeAuth = useCallback(() => setAuthMode(null), [])

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Navigation */}
      <Navbar onLogin={() => openAuth("login")} />

      {/* Hero Section */}
      <HeroSection />

      {/* Live Event Card */}
      <LiveEventCard />

      {/* Events Section */}
      <EventsSection onEventClick={openModal} />

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
