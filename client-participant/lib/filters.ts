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
  page: number
): { items: T[]; totalPages: number } => {
  // Page 1 shows 6 items (3 partnered + 3 community), page 2+ shows 3 per page
  if (page === 1) {
    const firstPageItems = 6
    const remainingPerPage = 3
    const totalPages =
      Math.ceil((items.length - firstPageItems) / remainingPerPage) + 1
    return { items: items.slice(0, firstPageItems), totalPages }
  } else {
    const firstPageItems = 6
    const itemsPerPage = 3
    const start = firstPageItems + (page - 2) * itemsPerPage
    const end = start + itemsPerPage
    const totalPages =
      Math.ceil((items.length - firstPageItems) / itemsPerPage) + 1
    return { items: items.slice(start, end), totalPages }
  }
}
