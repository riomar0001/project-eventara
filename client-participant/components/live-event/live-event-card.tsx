"use client"

import Image from "next/image"
import { LIVE_EVENT } from "@/constants/events"
import { LiveEvent } from "@/types/event"
import { Card } from "@/components/ui/card"

interface LiveEventCardProps {
  event?: LiveEvent
}

export function LiveEventCard({ event = LIVE_EVENT }: LiveEventCardProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--bg)] py-16">
      <div className="container mx-auto px-8">
        <Card className="relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-[var(--lime)]/10 before:via-transparent before:to-[var(--amber)]/10">
          {/* Visual header with stripes */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--lime)]/20 to-[var(--amber)]/20 md:h-64">
            {/* Decorative stripes */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 15px,
                    var(--line-soft) 15px,
                    var(--line-soft) 30px
                  )
                `,
                opacity: 0.5,
              }}
            />

            {/* Live label */}
            <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--lime)] uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--lime)]" />
              Live Now
            </div>

            {/* Decorative orbs */}
            <div
              className="absolute rounded-full opacity-40 blur-3xl"
              style={{
                width: "280px",
                height: "280px",
                right: "-80px",
                top: "-40px",
                background: "radial-gradient(circle, var(--lime), transparent)",
              }}
            />
            <div
              className="absolute rounded-full opacity-30 blur-3xl"
              style={{
                width: "220px",
                height: "220px",
                left: "-60px",
                bottom: "-20px",
                background:
                  "radial-gradient(circle, var(--amber), transparent)",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative space-y-6 p-8 md:p-10">
            {/* Title */}
            <h3 className="text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">
              {event.title}
            </h3>

            {/* Meta info grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">
                  Topic
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--text)]">
                  {event.topic}
                </div>
              </div>
              <div>
                <div className="font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">
                  Time
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--text)]">
                  {event.startTime} - {event.endTime}
                </div>
              </div>
            </div>

            {/* Speaker info */}
            <div className="border-t border-[var(--line-soft)] pt-6">
              <div className="mb-3 font-mono text-xs tracking-widest text-[var(--text-mute)] uppercase">
                Featured Speaker
              </div>
              <div className="flex items-center gap-4">
                {event.speaker.avatar && (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[var(--line-soft)]">
                    <Image
                      src={event.speaker.avatar}
                      alt={event.speaker.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-[var(--text)]">
                    {event.speaker.name}
                  </div>
                  <div className="text-sm text-[var(--text-dim)]">
                    {event.speaker.role}
                  </div>
                </div>
                {/* Wave animation indicator */}
                <div className="ml-auto flex items-end gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 w-1 rounded-sm bg-[var(--lime)]"
                      style={{
                        animation: `wave 0.6s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-[var(--text-dim)]">
              {event.description}
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
