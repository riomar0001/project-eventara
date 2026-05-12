/**
 * Event-specific types for the landing page
 * Shaped to match expected API response schemas
 */

export interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  venue: string
  capacity: number
  registered: number
  category: string
  description: string
  image?: string
}

export interface EventCategory {
  id: string
  name: string
  slug: string
}

export interface LiveEvent {
  id: string
  title: string
  status: "live" | "upcoming"
  venue: string
  session: string
  attendees: string
  speaker: {
    name: string
    role: string
    avatar?: string
  }
  topic: string
  startTime: string
  endTime: string
  description: string
}
