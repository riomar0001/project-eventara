"use client"

import Link from "next/link"
import {
  NAV_LINKS,
  NAV_CTA_TEXT,
  NAV_CTA_HREF,
  LOGO_TEXT,
} from "@/constants/navigation"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="relative z-40 border-b border-[var(--line-soft)] bg-[oklch(0.985_0.004_150_/_0.82)] backdrop-blur-md">
      <div className="container flex h-[68px] items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--lime)] to-[var(--amber)]">
            <span className="font-mono text-xs font-bold text-[#0a1005]">
              E
            </span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--text)]">
            {LOGO_TEXT}
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex gap-1.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm text-[var(--text-dim)] transition-colors duration-150 hover:text-[var(--text)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <Link href={NAV_CTA_HREF}>
          <Button className="btn-primary">{NAV_CTA_TEXT}</Button>
        </Link>
      </div>
    </nav>
  )
}
