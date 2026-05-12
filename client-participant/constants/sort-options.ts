/**
 * Sort options
 */

import type { SortOption } from "@/types/filters"

export const SORT_OPTIONS: SortOption[] = [
  { key: "rating", label: "Rating (highest)" },
  { key: "newest", label: "Newest" },
  { key: "capacity", label: "Capacity (largest)" },
  { key: "name", label: "Name (A–Z)" },
]
