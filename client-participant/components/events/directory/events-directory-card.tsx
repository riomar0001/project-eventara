"use client"

import type { DirectoryEvent } from "@/types/event-directory"
import { Icon } from "./icon"

interface EventsDirectoryCardProps {
  ev: DirectoryEvent
  onOpen: (ev: DirectoryEvent) => void
}

export function EventsDirectoryCard({ ev, onOpen }: EventsDirectoryCardProps) {
  const isLow = ev.seats > 0 && ev.seats <= ev.total * 0.2
  const isFull = ev.seats === 0
  const pct = Math.max(3, Math.round(((ev.total - ev.seats) / ev.total) * 100))
  const urgent = ev.status === "closing" || ev.status === "live"

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[20px] border transition-all"
      style={{
        background: "var(--surface)",
        borderColor: "var(--line-soft)",
        transition: "transform 280ms ease, border-color 280ms ease, box-shadow 280ms ease",
      }}
      onClick={() => onOpen(ev)}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.transform = "translateY(-6px)"
        if (urgent) {
          el.style.borderColor = "oklch(0.82 0.17 75 / 0.55)"
          el.style.boxShadow = "0 20px 60px -20px oklch(0.82 0.17 75 / 0.28)"
        } else {
          el.style.borderColor = "oklch(0.9 0.22 128 / 0.45)"
          el.style.boxShadow = "0 20px 60px -20px oklch(0.9 0.22 128 / 0.22)"
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = ""
        el.style.borderColor = ""
        el.style.boxShadow = ""
      }}
    >
      {/* Event visual */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "16/9",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        {/* Stripes */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(${ev.angle}, transparent 0 20px, oklch(1 0 0 / 0.035) 20px 22px)`,
          }}
        />
        {/* Orbs */}
        <div
          className="absolute rounded-full opacity-50 blur-[32px]"
          style={{
            left: "20%",
            top: "25%",
            width: 150,
            height: 150,
            background: ev.orb === "lime" ? "var(--lime)" : "var(--amber)",
          }}
        />
        <div
          className="absolute rounded-full blur-[32px]"
          style={{
            right: "15%",
            bottom: "12%",
            width: 110,
            height: 110,
            background: ev.orb === "lime" ? "var(--amber)" : "var(--lime)",
            opacity: 0.32,
          }}
        />

        {/* Date badge */}
        <div
          className="absolute left-[14px] top-[14px] z-[2] min-w-[54px] rounded-[10px] border px-[10px] py-2 text-center"
          style={{
            background: "oklch(0 0 0 / 0.55)",
            backdropFilter: "blur(10px)",
            borderColor: "var(--line-soft)",
          }}
        >
          <div
            className="font-mono text-[10px] font-medium tracking-[0.14em]"
            style={{ color: "var(--lime)" }}
          >
            {ev.mo}
          </div>
          <div
            className="mt-px text-[20px] font-bold leading-none tracking-[-0.03em]"
            style={{ color: "var(--text)" }}
          >
            {ev.day}
          </div>
        </div>

        {/* Status pill */}
        {ev.status === "closing" && (
          <div
            className="absolute right-[14px] top-[14px] z-[2] inline-flex items-center gap-[6px] rounded-full px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{
              background: "oklch(0.82 0.17 75 / 0.15)",
              border: "1px solid oklch(0.82 0.17 75 / 0.4)",
              color: "var(--amber)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="relative flex h-[6px] w-[6px]">
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: "currentColor",
                  animation: "pulse-scale 1.6s cubic-bezier(0,0,0.2,1) infinite",
                }}
              />
            </span>
            Closing Soon
          </div>
        )}
        {ev.status === "live" && (
          <div
            className="absolute right-[14px] top-[14px] z-[2] inline-flex items-center gap-[6px] rounded-full px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{
              background: "oklch(0.82 0.17 75 / 0.15)",
              border: "1px solid oklch(0.82 0.17 75 / 0.4)",
              color: "var(--amber)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="relative flex h-[6px] w-[6px]">
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: "currentColor",
                  animation: "pulse-scale 1.6s cubic-bezier(0,0,0.2,1) infinite",
                }}
              />
            </span>
            Live
          </div>
        )}
        {ev.status === "new" && (
          <div
            className="absolute right-[14px] top-[14px] z-[2] inline-flex items-center gap-[6px] rounded-full px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{
              background: "oklch(0.9 0.22 128 / 0.12)",
              border: "1px solid oklch(0.9 0.22 128 / 0.4)",
              color: "var(--lime)",
              backdropFilter: "blur(8px)",
            }}
          >
            New
          </div>
        )}

        {/* Label */}
        <div
          className="absolute bottom-3 left-[14px] font-mono text-[9.5px] uppercase tracking-[0.14em]"
          style={{ color: "oklch(1 0 0 / 0.3)" }}
        >
          [ event cover · 16:9 ]
        </div>
      </div>

      {/* Event body */}
      <div className="flex flex-1 flex-col gap-[10px] px-5 pb-[22px] pt-5">
        <h3
          className="m-0 text-[18px] font-semibold leading-[1.28] tracking-[-0.02em]"
          style={{ color: "var(--text)" }}
        >
          {ev.title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-[6px]">
          {ev.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border px-[9px] py-[3px] text-[11px] font-medium"
              style={{
                background: "oklch(1 0 0 / 0.04)",
                borderColor: "var(--line-soft)",
                color: "var(--text-dim)",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Event details */}
        <div className="flex flex-col gap-[6px] py-[6px] text-[12.5px]" style={{ color: "var(--text-dim)" }}>
          <div className="flex items-center gap-2">
            <Icon name="clock" size={13} />
            {ev.time}
          </div>
          <div className="flex items-center gap-2">
            <Icon name="pin" size={13} />
            {ev.venue}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex flex-col items-stretch gap-[10px]">
          <div className="flex items-center gap-[10px]">
            <div
              className="h-[3px] flex-1 overflow-hidden rounded-[2px]"
              style={{ background: "oklch(1 0 0 / 0.05)" }}
            >
              <div
                className="h-full rounded-[2px] transition-all"
                style={{
                  width: `${pct}%`,
                  background: isLow ? "var(--amber)" : "var(--lime)",
                }}
              />
            </div>
            <span
              className="font-mono text-[10.5px]"
              style={{ color: isLow ? "var(--amber)" : "var(--text-mute)" }}
            >
              {isFull ? (
                <span style={{ color: "var(--amber)" }}>Full</span>
              ) : (
                <>
                  <span style={{ color: isLow ? "var(--amber)" : "var(--text)" }}>{ev.seats}</span> left
                </>
              )}
            </span>
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border px-[11px] py-[11px] text-[13px] font-medium transition-all"
            style={{
              borderColor: "var(--line)",
              color: "var(--text)",
              background: "transparent",
            }}
            onClick={(e) => {
              e.stopPropagation()
              onOpen(ev)
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              if (urgent) {
                el.style.borderColor = "var(--amber)"
                el.style.color = "var(--amber)"
                el.style.background = "oklch(0.82 0.17 75 / 0.05)"
              } else {
                el.style.borderColor = "var(--lime)"
                el.style.color = "var(--lime)"
                el.style.background = "oklch(0.9 0.22 128 / 0.05)"
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.borderColor = ""
              el.style.color = ""
              el.style.background = ""
            }}
          >
            View Details <Icon name="arrow-right" size={13} />
          </button>
        </div>
      </div>
    </article>
  )
}
