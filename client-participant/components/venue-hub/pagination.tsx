/**
 * Pagination Component
 */

"use client"

import { Icon } from "@/components/ui/icon"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg border border-[var(--line)] p-2 text-[var(--text-dim)] transition-all hover:border-[var(--text-mute)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon name="chevronLeft" size={16} />
      </button>

      {/* Page Numbers */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`h-8 min-w-[32px] rounded-lg font-semibold transition-all ${
            currentPage === page
              ? "bg-[var(--lime)] text-[#0a1005]"
              : "border border-[var(--line)] text-[var(--text-dim)] hover:border-[var(--text-mute)] hover:text-[var(--text)]"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg border border-[var(--line)] p-2 text-[var(--text-dim)] transition-all hover:border-[var(--text-mute)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  )
}
