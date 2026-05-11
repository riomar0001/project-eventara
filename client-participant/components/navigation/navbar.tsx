"use client"

import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Events", href: "#events", active: true },
  { label: "About", href: "#about", active: false },
  { label: "Community", href: "#community", active: false },
] as const

interface NavbarProps {
  onLogin?: () => void
}

export function Navbar({ onLogin }: NavbarProps) {
  return (
    <nav
      className="sticky top-0 z-40 border-b border-[var(--line-soft)] backdrop-blur-[18px] backdrop-saturate-[140%]"
      style={{ background: "oklch(0.17 0.008 150 / 0.75)" }}
    >
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-8 max-[900px]:px-5">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-lg font-bold tracking-[-0.02em]"
          aria-label="Eventara home"
        >
          <div
            className="grid h-[26px] w-[26px] place-items-center rounded-lg text-[#0a1005]"
            style={{
              background: "linear-gradient(145deg, var(--lime), var(--lime-dim))",
              boxShadow: "0 0 18px -4px var(--lime-glow)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 10 L10 2 L18 10 L10 18 Z"
                stroke="#0a1005"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="10" cy="10" r="2.5" fill="#0a1005" />
            </svg>
          </div>
          <span>Eventara</span>
        </a>

        {/* Nav Links */}
        <div className="flex items-center gap-1.5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-[10px] px-3.5 py-2 text-[14.5px] text-[var(--text-dim)] transition-colors duration-150 hover:text-[var(--text)] max-[900px]:hidden",
                link.active && "text-[var(--text)]",
              )}
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={onLogin}
            className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-[var(--lime)] px-[18px] py-2.5 text-[13.5px] font-semibold tracking-[-0.01em] text-[#0a1005] shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-[180ms] ease hover:-translate-y-px hover:shadow-[0_14px_40px_-10px_var(--lime-glow)]"
          >
            Login / Register
          </button>
        </div>
      </div>
    </nav>
  )
}
