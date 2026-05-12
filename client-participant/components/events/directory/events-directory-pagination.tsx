"use client"

import { Icon } from "./icon"

interface EventsDirectoryPaginationProps {
  currentPage: number
  totalPages: number
  filteredLength: number
  perPage: number
  onPageChange: (page: number) => void
}

export function EventsDirectoryPagination({
  currentPage,
  totalPages,
  filteredLength,
  perPage,
  onPageChange,
}: EventsDirectoryPaginationProps) {
  const loadedPct = Math.round(
    ((currentPage * perPage) / filteredLength) * 100
  )
  const start = (currentPage - 1) * perPage + 1
  const end = Math.min(currentPage * perPage, filteredLength)

  return (
    <div className="mb-8 mt-14 flex flex-col items-center gap-7">
      {/* Progress */}
      <div className="flex flex-col items-center gap-[10px]">
        <div
          className="relative h-1 w-[220px] overflow-hidden rounded-[3px]"
          style={{ background: "oklch(1 0 0 / 0.05)" }}
        >
          <div
            className="h-full rounded-[3px] transition-[width] duration-400"
            style={{
              width: `${Math.min(100, loadedPct)}%`,
              background: "linear-gradient(90deg, var(--lime), var(--amber))",
            }}
          />
        </div>
        <div
          className="font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ color: "var(--text-mute)" }}
        >
          Showing {start}–{end} of {filteredLength}
        </div>
      </div>

      {/* Load more / End of list */}
      {currentPage < totalPages ? (
        <button
          className="inline-flex items-center justify-center gap-[10px] rounded-full border px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all"
          style={{
            borderColor: "var(--line)",
            background: "transparent",
            color: "var(--text)",
          }}
          onClick={() => onPageChange(currentPage + 1)}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.borderColor = "var(--lime)"
            el.style.color = "var(--lime)"
            el.style.boxShadow = "0 0 24px -8px var(--lime-glow)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.borderColor = ""
            el.style.color = ""
            el.style.boxShadow = ""
          }}
        >
          Load more events <Icon name="arrow-right" size={14} />
        </button>
      ) : (
        <div
          className="font-mono text-[11px] tracking-[0.14em]"
          style={{ color: "var(--text-mute)" }}
        >
          — END OF LIST —
        </div>
      )}

      {/* Page buttons */}
      <div className="flex items-center gap-[6px]">
        <button
          className="inline-flex h-[38px] min-w-[38px] items-center justify-center gap-[6px] rounded-[10px] border px-3 text-[13.5px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor: "var(--line-soft)",
            color: "var(--text-dim)",
          }}
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              ;(e.currentTarget as HTMLElement).style.color = "var(--text)"
              ;(e.currentTarget as HTMLElement).style.borderColor =
                "var(--text-mute)"
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = ""
            ;(e.currentTarget as HTMLElement).style.borderColor = ""
          }}
        >
          <Icon name="arrow-left" size={13} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className="inline-flex h-[38px] min-w-[38px] items-center justify-center rounded-[10px] border px-3 text-[13.5px] font-medium transition-all"
            style={
              n === currentPage
                ? {
                    background: "var(--lime)",
                    color: "#0a1005",
                    borderColor: "var(--lime)",
                    boxShadow: "0 0 0 3px oklch(0.9 0.22 128 / 0.15)",
                  }
                : {
                    borderColor: "var(--line-soft)",
                    color: "var(--text-dim)",
                  }
            }
            onClick={() => onPageChange(n)}
            onMouseEnter={(e) => {
              if (n !== currentPage) {
                ;(e.currentTarget as HTMLElement).style.color = "var(--text)"
                ;(e.currentTarget as HTMLElement).style.borderColor =
                  "var(--text-mute)"
              }
            }}
            onMouseLeave={(e) => {
              if (n !== currentPage) {
                ;(e.currentTarget as HTMLElement).style.color = ""
                ;(e.currentTarget as HTMLElement).style.borderColor = ""
              }
            }}
          >
            {n}
          </button>
        ))}

        <button
          className="inline-flex h-[38px] min-w-[38px] items-center justify-center gap-[6px] rounded-[10px] border px-3 text-[13.5px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor: "var(--line-soft)",
            color: "var(--text-dim)",
          }}
          disabled={currentPage === totalPages}
          onClick={() =>
            onPageChange(Math.min(totalPages, currentPage + 1))
          }
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              ;(e.currentTarget as HTMLElement).style.color = "var(--text)"
              ;(e.currentTarget as HTMLElement).style.borderColor =
                "var(--text-mute)"
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = ""
            ;(e.currentTarget as HTMLElement).style.borderColor = ""
          }}
        >
          <Icon name="arrow-right" size={13} />
        </button>
      </div>
    </div>
  )
}
