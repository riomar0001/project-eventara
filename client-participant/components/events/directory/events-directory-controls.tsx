"use client"

import { useState, useRef, useEffect } from "react"
import type { EventCategory, SortOption } from "@/types/event-directory"
import { Icon } from "./icon"

interface EventsDirectoryControlsProps {
  q: string
  onQChange: (v: string) => void
  cat: string
  onCatChange: (c: string) => void
  sort: SortOption
  onSortChange: (s: SortOption) => void
  categories: EventCategory[]
  counts: Record<string, number>
}

export function EventsDirectoryControls({
  q,
  onQChange,
  cat,
  onCatChange,
  sort,
  onSortChange,
  categories,
  counts,
}: EventsDirectoryControlsProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  const sortLabel =
    sort === "date"
      ? "By date"
      : sort === "popularity"
        ? "Popularity"
        : "Availability"

  return (
    <>
      {/* Search row */}
      <div
        className="events-dir-search-row mt-2 grid items-center gap-[14px]"
        style={{ gridTemplateColumns: "1fr auto" }}
      >
        <div
          className="relative rounded-[14px] border transition-all"
          style={{
            background: "var(--surface)",
            borderColor: "var(--line-soft)",
          }}
          onFocus={(e) => {
            const el = e.currentTarget
            el.style.borderColor = "var(--lime)"
            el.style.boxShadow = "0 0 0 4px oklch(0.9 0.22 128 / 0.1)"
            el.style.background = "var(--surface-2)"
          }}
          onBlur={(e) => {
            const el = e.currentTarget
            el.style.borderColor = ""
            el.style.boxShadow = ""
            el.style.background = ""
          }}
        >
          <span
            className="absolute left-[18px] top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-mute)" }}
          >
            <Icon name="search" size={18} />
          </span>
          <input
            className="w-full border-none bg-transparent py-[18px] pl-[52px] pr-[18px] text-[15.5px] tracking-[-0.01em] outline-none"
            style={{ color: "var(--text)" }}
            placeholder="Search events, venues, tags…"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
          />
          <span
            className="absolute right-[14px] top-1/2 -translate-y-1/2 rounded-[6px] border px-2 py-1 font-mono text-[10.5px]"
            style={{
              background: "var(--bg)",
              borderColor: "var(--line-soft)",
              color: "var(--text-mute)",
            }}
          >
            ⌘ K
          </span>
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            className="flex h-[56px] min-w-[180px] items-center gap-[10px] rounded-[14px] border px-[18px] text-[14px] transition-colors"
            style={{
              background: "var(--surface)",
              borderColor: "var(--line-soft)",
              color: "var(--text)",
            }}
            onClick={() => setSortOpen((o) => !o)}
          >
            <span
              className="font-mono text-[10.5px] uppercase tracking-[0.14em]"
              style={{ color: "var(--text-mute)" }}
            >
              Sort
            </span>
            <span className="font-medium">{sortLabel}</span>
            <Icon name="chevron-down" size={14} />
          </button>

          {sortOpen && (
            <div
              className="absolute right-0 z-50 min-w-[200px] rounded-[12px] border p-[6px] shadow-lg"
              style={{
                top: "calc(100% + 6px)",
                background: "var(--surface)",
                borderColor: "var(--line)",
                boxShadow: "0 20px 60px -20px oklch(0 0 0 / 0.5)",
              }}
            >
              {(
                [
                  ["date", "By date"],
                  ["popularity", "Most popular"],
                  ["availability", "Most available"],
                ] as const
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  className="flex w-full items-center justify-between rounded-[8px] px-3 py-[10px] text-left text-[13px] transition-colors"
                  style={{
                    color: sort === k ? "var(--lime)" : "var(--text-dim)",
                  }}
                  onClick={() => {
                    onSortChange(k)
                    setSortOpen(false)
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background =
                      "oklch(1 0 0 / 0.04)"
                    ;(e.currentTarget as HTMLElement).style.color =
                      "var(--text)"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = ""
                    ;(e.currentTarget as HTMLElement).style.color =
                      sort === k ? "var(--lime)" : ""
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="mt-[22px] flex flex-wrap items-center gap-[10px]">
        {categories.map((c) => (
          <button
            key={c.key}
            className={`inline-flex items-center gap-2 rounded-full border px-[18px] py-[9px] text-[13px] font-medium transition-all ${
              cat === c.key ? "font-semibold" : ""
            }`}
            style={
              cat === c.key
                ? {
                    background: "var(--lime)",
                    color: "#0a1005",
                    borderColor: "var(--lime)",
                    boxShadow: "0 0 0 4px oklch(0.9 0.22 128 / 0.12)",
                  }
                : {
                    background: "transparent",
                    color: "var(--text-dim)",
                    borderColor: "var(--line)",
                  }
            }
            onClick={() => onCatChange(c.key)}
            onMouseEnter={(e) => {
              if (cat !== c.key) {
                ;(e.currentTarget as HTMLElement).style.color = "var(--text)"
                ;(e.currentTarget as HTMLElement).style.borderColor =
                  "var(--text-mute)"
              }
            }}
            onMouseLeave={(e) => {
              if (cat !== c.key) {
                ;(e.currentTarget as HTMLElement).style.color = ""
                ;(e.currentTarget as HTMLElement).style.borderColor = ""
              }
            }}
          >
            {c.label}
            <span
              className="rounded-[4px] px-[6px] py-[2px] font-mono text-[10.5px]"
              style={{
                background:
                  cat === c.key
                    ? "oklch(0 0 0 / 0.15)"
                    : "oklch(1 0 0 / 0.06)",
                color: cat === c.key ? "#0a1005" : "inherit",
              }}
            >
              {counts[c.key] ?? 0}
            </span>
          </button>
        ))}

        <div
          className="mx-1 h-6 w-px"
          style={{ background: "var(--line-soft)" }}
        />

        <button
          className="inline-flex items-center gap-2 rounded-full border px-[18px] py-[9px] text-[13px] font-medium transition-all"
          style={{
            background: "transparent",
            color: "var(--text-dim)",
            borderColor: "var(--line)",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = "var(--text)"
            ;(e.currentTarget as HTMLElement).style.borderColor =
              "var(--text-mute)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = ""
            ;(e.currentTarget as HTMLElement).style.borderColor = ""
          }}
        >
          This month
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border px-[18px] py-[9px] text-[13px] font-medium transition-all"
          style={{
            background: "transparent",
            color: "var(--text-dim)",
            borderColor: "var(--line)",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = "var(--text)"
            ;(e.currentTarget as HTMLElement).style.borderColor =
              "var(--text-mute)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = ""
            ;(e.currentTarget as HTMLElement).style.borderColor = ""
          }}
        >
          Free
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border px-[18px] py-[9px] text-[13px] font-medium transition-all"
          style={{
            background: "transparent",
            color: "var(--text-dim)",
            borderColor: "var(--line)",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = "var(--text)"
            ;(e.currentTarget as HTMLElement).style.borderColor =
              "var(--text-mute)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = ""
            ;(e.currentTarget as HTMLElement).style.borderColor = ""
          }}
        >
          Members only
        </button>
      </div>
    </>
  )
}
