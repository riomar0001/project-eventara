/**
 * Capacity filter options
 */

import type { CapacityFilter } from "@/types/filters"

export const CAPACITY_FILTERS: CapacityFilter[] = [
  { key: "any", label: "Any capacity", min: 0 },
  { key: "50", label: "Up to 50", min: 0 },
  { key: "100", label: "50–100", min: 50 },
  { key: "500", label: "100+", min: 100 },
]
