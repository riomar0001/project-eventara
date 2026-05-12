"use client"

import type { DirectoryEvent } from "@/types/event-directory"
import { Icon } from "@/components/events/directory/icon"

interface EventsDirectoryModalProps {
  ev: DirectoryEvent | null
  onClose: () => void
}

export function EventsDirectoryModal({
  ev,
  onClose,
}: EventsDirectoryModalProps) {
  if (!ev) return null

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-6"
      style={{
        background: "oklch(0.1 0.005 150 / 0.7)",
        backdropFilter: "blur(10px)",
        animation: "fadein 220ms ease",
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[580px] overflow-hidden rounded-[22px] border shadow-lg"
        style={{
          background: "var(--surface)",
          borderColor: "var(--line)",
          boxShadow: "0 30px 80px -20px oklch(0 0 0 / 0.6)",
          animation: "modal-pop 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute right-[14px] top-[14px] z-[3] grid h-8 w-8 place-items-center rounded-[10px] transition-all"
          style={{
            color: "var(--text-mute)",
            background: "oklch(0 0 0 / 0.35)",
            backdropFilter: "blur(10px)",
          }}
          onClick={onClose}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background =
              "oklch(0 0 0 / 0.6)"
            ;(e.currentTarget as HTMLElement).style.color = "var(--text)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = ""
            ;(e.currentTarget as HTMLElement).style.color = ""
          }}
        >
          <Icon name="x" size={16} />
        </button>

        {/* Cover */}
        <div
          className="relative"
          style={{
            aspectRatio: "16/7",
            background:
              "linear-gradient(135deg, oklch(0.22 0.012 150), oklch(0.15 0.008 150))",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(${ev.angle}, transparent 0 22px, oklch(1 0 0 / 0.04) 22px 24px)`,
            }}
          />
          <div
            className="absolute left-[18%] top-[20%] h-[220px] w-[220px] rounded-full opacity-50 blur-[38px]"
            style={{
              background:
                ev.orb === "lime" ? "var(--lime)" : "var(--amber)",
            }}
          />
          <div
            className="absolute bottom-[10%] right-[15%] h-[160px] w-[160px] rounded-full opacity-40 blur-[32px]"
            style={{
              background:
                ev.orb === "lime" ? "var(--amber)" : "var(--lime)",
            }}
          />
          <div
            className="absolute left-5 top-4 z-[2] min-w-[54px] rounded-[10px] border px-[10px] py-2 text-center"
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
        </div>

        {/* Body */}
        <div className="px-7 pb-7 pt-6">
          <div className="mb-[10px] flex flex-wrap gap-[6px]">
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

          <h3
            className="m-0 mb-2 text-[22px] font-semibold tracking-[-0.025em]"
            style={{ color: "var(--text)" }}
          >
            {ev.title}
          </h3>

          <p
            className="m-0 mb-[18px] text-[14.5px] leading-[1.6]"
            style={{ color: "var(--text-dim)" }}
          >
            {ev.desc}
          </p>

          {/* Detail grid */}
          <div className="mb-[18px] grid grid-cols-2 gap-3">
            <div
              className="rounded-[10px] border px-[14px] py-3"
              style={{
                background: "var(--bg)",
                borderColor: "var(--line-soft)",
              }}
            >
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.14em]"
                style={{ color: "var(--text-mute)" }}
              >
                Date
              </div>
              <div
                className="mt-[3px] text-[14px] font-medium"
                style={{ color: "var(--text)" }}
              >
                {ev.date}
              </div>
            </div>
            <div
              className="rounded-[10px] border px-[14px] py-3"
              style={{
                background: "var(--bg)",
                borderColor: "var(--line-soft)",
              }}
            >
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.14em]"
                style={{ color: "var(--text-mute)" }}
              >
                Time
              </div>
              <div
                className="mt-[3px] text-[14px] font-medium"
                style={{ color: "var(--text)" }}
              >
                {ev.time}
              </div>
            </div>
            <div
              className="rounded-[10px] border px-[14px] py-3"
              style={{
                background: "var(--bg)",
                borderColor: "var(--line-soft)",
              }}
            >
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.14em]"
                style={{ color: "var(--text-mute)" }}
              >
                Venue
              </div>
              <div
                className="mt-[3px] text-[14px] font-medium"
                style={{ color: "var(--text)" }}
              >
                {ev.venue}
              </div>
            </div>
            <div
              className="rounded-[10px] border px-[14px] py-3"
              style={{
                background: "var(--bg)",
                borderColor: "var(--line-soft)",
              }}
            >
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.14em]"
                style={{ color: "var(--text-mute)" }}
              >
                Seats
              </div>
              <div
                className="mt-[3px] text-[14px] font-medium"
                style={{
                  color:
                    ev.seats === 0 ? "var(--amber)" : "var(--lime)",
                }}
              >
                {ev.seats === 0
                  ? "Full — waitlist"
                  : `${ev.seats} of ${ev.total} left`}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-[10px]">
            <button
              className="flex flex-1 items-center justify-center gap-[10px] rounded-full px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all hover:-translate-y-px"
              style={{
                background: "var(--lime)",
                color: "#0a1005",
                boxShadow: "0 8px 28px -10px var(--lime-glow)",
              }}
            >
              {ev.seats === 0 ? "Join Waitlist" : "Reserve Seat"}{" "}
              <Icon name="arrow-right" size={14} />
            </button>
            <button
              className="inline-flex items-center justify-center gap-[10px] rounded-full border px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all"
              style={{
                color: "var(--text-dim)",
                borderColor: "var(--line)",
                background: "oklch(1 0 0 / 0.02)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.color = "var(--text)"
                el.style.borderColor = "oklch(1 0 0 / 0.2)"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.color = ""
                el.style.borderColor = ""
              }}
            >
              <Icon name="calendar" size={14} /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
