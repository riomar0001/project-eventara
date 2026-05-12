/**
 * Hook for managing venue filters
 */

"use client"

import { useState, useMemo } from "react"
import type { Venue } from "@/types/venue"
import { applyFilters, paginate } from "@/lib/filters"

interface UseVenueFiltersReturn {
  query: string
  setQuery: (q: string) => void
  capacityKey: string
  setCapacityKey: (key: string) => void
  sortKey: string
  setSortKey: (key: string) => void
  page: number
  setPage: (p: number) => void
  filteredVenues: Venue[]
  paginatedVenues: Venue[]
  totalPages: number
  totalFiltered: number
}

export function useVenueFilters(venues: Venue[]): UseVenueFiltersReturn {
  const [query, setQuery] = useState("")
  const [capacityKey, setCapacityKey] = useState("any")
  const [sortKey, setSortKey] = useState("rating")
  const [page, setPage] = useState(1)

  const filteredVenues = useMemo(() => {
    return applyFilters(venues, query, capacityKey, sortKey)
  }, [venues, query, capacityKey, sortKey])

  const { items: paginatedVenues, totalPages } = useMemo(() => {
    return paginate(filteredVenues, page)
  }, [filteredVenues, page])

  return {
    query,
    setQuery,
    capacityKey,
    setCapacityKey,
    sortKey,
    setSortKey,
    page,
    setPage,
    filteredVenues,
    paginatedVenues,
    totalPages,
    totalFiltered: filteredVenues.length,
  }
}
