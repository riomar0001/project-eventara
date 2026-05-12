/**
 * Filter and sort logic utilities
 */

import type { Venue } from "@/types/venue"

export const filterVenuesByCapacity = (
  venues: Venue[],
  capacityKey: string
): Venue[] => {
  if (capacityKey === "any") return venues

  const minCapacity = parseInt(capacityKey)
  return venues.filter((v) => v.capacity >= minCapacity)
}

export const filterVenuesBySearch = (
  venues: Venue[],
  query: string
): Venue[] => {
  if (!query.trim()) return venues

  const lowerQuery = query.toLowerCase()
  return venues.filter(
    (v) =>
      v.name.toLowerCase().includes(lowerQuery) ||
      v.location.toLowerCase().includes(lowerQuery) ||
      v.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

export const sortVenues = (venues: Venue[], sortKey: string): Venue[] => {
  const sorted = [...venues]

  switch (sortKey) {
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating)
    case "newest":
      return sorted.reverse() // assuming order in array is date-based
    case "capacity":
      return sorted.sort((a, b) => b.capacity - a.capacity)
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted
  }
}

export const applyFilters = (
  venues: Venue[],
  query: string,
  capacityKey: string,
  sortKey: string
): Venue[] => {
  let filtered = venues
  filtered = filterVenuesBySearch(filtered, query)
  filtered = filterVenuesByCapacity(filtered, capacityKey)
  filtered = sortVenues(filtered, sortKey)
  return filtered
}

export const paginate = <T>(
  items: T[],
  page: number,
  perPage: number = 9
): { items: T[]; totalPages: number } => {
  const totalPages = Math.ceil(items.length / perPage)
  const start = (page - 1) * perPage
  const end = start + perPage
  return { items: items.slice(start, end), totalPages }
}
