/**
 * Common types shared across the landing page
 */

export interface NavLink {
  label: string
  href: string
  icon?: string
}

export interface Stat {
  label: string
  value: string
  color?: "lime" | "amber"
}

export interface SocialLink {
  label: string
  href: string
  icon: string
}
