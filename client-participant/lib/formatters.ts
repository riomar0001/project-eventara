/**
 * Formatter utilities for Venue Hub
 */

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateString
  }
}

export const formatCapacity = (capacity: number): string => {
  if (capacity >= 1000) {
    return `${(capacity / 1000).toFixed(1)}k`
  }
  return capacity.toString()
}

export const formatRating = (rating: number): string => {
  return rating.toFixed(1)
}

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}
