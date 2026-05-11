"use client"

import Link from "next/link"
import { Mail, Share2, MessageCircle, Code2 } from "lucide-react"
import {
  FOOTER_LINKS_SECTION_1,
  FOOTER_LINKS_SECTION_2,
  SOCIAL_LINKS,
  FOOTER_COPYRIGHT,
  LOGO_TEXT,
} from "@/constants/footer"

const iconMap: Record<string, typeof Mail> = {
  twitter: Share2,
  discord: MessageCircle,
  github: Code2,
  linkedin: Share2,
  mail: Mail,
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--line-soft)] bg-[var(--bg)] py-12">
      <div className="container mx-auto px-8">
        {/* Top section */}
        <div className="mb-8 flex flex-col justify-between gap-8 md:flex-row">
          {/* Logo and description */}
          <div className="max-w-xs">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--lime)] to-[var(--amber)]">
                <span className="font-mono text-xs font-bold text-[#0a1005]">
                  E
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight">
                {LOGO_TEXT}
              </span>
            </div>
            <p className="text-sm text-[var(--text-dim)]">
              Davao&apos;s premier DeFi community connecting innovators and
              builders.
            </p>
          </div>

          {/* Link sections */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              {FOOTER_LINKS_SECTION_1.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="space-y-3">
              {FOOTER_LINKS_SECTION_2.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-[var(--line-soft)]" />

        {/* Bottom section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <p className="font-mono text-xs text-[var(--text-mute)]">
            {FOOTER_COPYRIGHT}
          </p>

          {/* Social links */}
          <div className="flex gap-2.5">
            {SOCIAL_LINKS.map((social) => {
              const Icon = iconMap[social.icon as keyof typeof iconMap]
              if (!Icon) return null
              return (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--line-soft)] p-2.5 text-[var(--text-dim)] transition-all hover:border-[var(--amber)] hover:bg-[oklch(0.82_0.17_75_/_0.06)] hover:text-[var(--amber)]"
                  aria-label={social.label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
