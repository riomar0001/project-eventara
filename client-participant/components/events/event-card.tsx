"use client"

import { Event } from "@/types/event"
import { Card } from "@/components/ui/card"

interface EventCardProps {
  event: Event
  onClick?: () => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  const percentage = Math.round((event.registered / event.capacity) * 100)

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden transition-all duration-200 hover:border-[var(--lime)] hover:shadow-[0_8px_32px_-8px_var(--lime-glow)]"
    >
      {/* Visual header with decorative stripes */}
      <div
        className="relative h-40 overflow-hidden bg-gradient-to-br from-[var(--lime)]/10 to-[var(--amber)]/10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              var(--line-soft) 10px,
              var(--line-soft) 20px
            )
          `,
        }}
      >
        {/* Category chip */}
        <div className="absolute top-4 right-4 rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--lime)] uppercase">
          {event.category}
        </div>

        {/* Decorative orbs */}
        <div
          className="absolute rounded-full opacity-30 blur-2xl"
          style={{
            width: "100px",
            height: "100px",
            bottom: "-20px",
            right: "-10px",
            background: "radial-gradient(circle, var(--lime), transparent)",
          }}
        />
      </div>

      {/* Content */}
      <div className="space-y-3 p-5.5">
        {/* Date and time */}
        <div className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
          <span>{event.date}</span>
          <span className="h-px w-3.5 bg-[oklch(0.9_0.22_128_/_0.4)]" />
          <span>{event.time}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold tracking-tight text-[var(--text)] transition-colors group-hover:text-[var(--lime)]">
          {event.title}
        </h3>

        {/* Description (truncated) */}
        <p className="line-clamp-2 text-sm text-[var(--text-dim)]">
          {event.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--line-soft)] pt-3">
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-mute)]">
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--line-soft)]">
              <div
                className="h-full bg-[var(--lime)] transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--lime)]">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
