"use client"

import { useState, useMemo } from "react"
import { MOCK_EVENTS } from "@/constants/events"
import { EventTabs } from "./event-tabs"
import { EventCard } from "./event-card"

interface EventsSectionProps {
  onEventClick?: (eventId: string) => void
}

export function EventsSection({ onEventClick }: EventsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")

  // TODO: fetch from GET /api/events with filtering
  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") {
      return MOCK_EVENTS
    }
    return MOCK_EVENTS.filter((event) => event.category === selectedCategory)
  }, [selectedCategory])

  return (
    <section id="events" className="relative bg-[var(--bg)] py-20">
      <div className="container mx-auto px-8">
        {/* Section header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="eyebrow mb-3">
              <span className="eyebrow-dot" />
              Upcoming Events
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-[var(--text)] lg:text-5xl">
              Join Our Community Events
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--text-dim)]">
              Discover workshops, conferences, and meetups designed to help you
              grow in the DeFi space.
            </p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-8 flex justify-center lg:justify-start">
          <EventTabs
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Events grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => onEventClick?.(event.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)]">
            <p className="text-[var(--text-dim)]">
              No events in this category yet.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
