interface IconProps {
  name: string
  size?: number
  className?: string
}

export function Icon({ name, size = 16, className }: IconProps) {
  const s = size
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  }

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      )
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      )
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      )
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case "users":
      return (
        <svg {...common}>
          <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 20v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      )
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case "list":
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      )
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case "x":
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      )
    case "twitter":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
          className={className}
        >
          <path d="M18 4h3l-7.5 8.5L22 22h-6.5l-5-6.5L5 22H2l8-9L2 4h6.5l4.5 6L18 4z" />
        </svg>
      )
    case "discord":
      return (
        <svg
          viewBox="0 0 24 24"
          width={s}
          height={s}
          fill="currentColor"
          className={className}
        >
          <path d="M20.3 4.4a16 16 0 0 0-4-1.3l-.2.4a14 14 0 0 0-4.2 0l-.2-.4a16 16 0 0 0-4 1.3 17.7 17.7 0 0 0-3 11.7 16 16 0 0 0 4.9 2.5l1-1.5a11 11 0 0 1-1.7-.8l.4-.3a11.5 11.5 0 0 0 9.6 0l.4.3a11 11 0 0 1-1.7.8l1 1.5a16 16 0 0 0 5-2.5 17.6 17.6 0 0 0-3-11.7zM9 14c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
        </svg>
      )
    case "telegram":
      return (
        <svg
          viewBox="0 0 24 24"
          width={s}
          height={s}
          fill="currentColor"
          className={className}
        >
          <path d="M21.5 4.3 2.8 11.6c-1 .4-1 1 0 1.3l4.4 1.4 1.7 5.3c.2.6.4.8 1 .6l3-2.5 4.4 3.2c.9.5 1.5.2 1.7-.8l3-14c.3-1.2-.5-1.7-1.5-1.3zm-3.3 3.4-8.6 7.7-.3 3.6-1.7-5.3 10.6-6.7c.5-.3.9-.1.5.7z" />
        </svg>
      )
    default:
      return null
  }
}
