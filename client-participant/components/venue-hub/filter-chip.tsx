/**
 * Filter chip component
 */

import { Icon } from "@/components/ui/icon"

interface FilterChipProps {
  label: string
  onRemove: () => void
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[oklch(1_0_0_/_0.08)] px-3 py-1.5 text-sm">
      <span className="text-[var(--text)]">{label}</span>
      <button
        onClick={onRemove}
        className="flex items-center justify-center text-[var(--lime)] opacity-70 hover:opacity-100"
        aria-label="Remove filter"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  )
}
