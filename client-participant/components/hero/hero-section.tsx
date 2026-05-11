"use client"

import Link from "next/link"
import {
  HERO_HEADLINE,
  HERO_SUBHEADLINE,
  HERO_CTA_PRIMARY,
  HERO_CTA_PRIMARY_HREF,
  HERO_CTA_SECONDARY,
  HERO_CTA_SECONDARY_HREF,
} from "@/constants/stats"
import { Button } from "@/components/ui/button"
import { StatsGrid } from "./stats-grid"

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--bg)] pt-20">
      {/* Background mesh orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full opacity-55 blur-[80px]"
          style={{
            width: "720px",
            height: "720px",
            left: "-140px",
            top: "-180px",
            background:
              "radial-gradient(circle, oklch(0.9 0.22 128 / 0.55), transparent 65%)",
          }}
        />
        <div
          className="absolute rounded-full opacity-55 blur-[80px]"
          style={{
            width: "620px",
            height: "620px",
            right: "-160px",
            top: "40px",
            background:
              "radial-gradient(circle, oklch(0.82 0.17 75 / 0.4), transparent 65%)",
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--line-soft) 1px, transparent 1px),
            linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 75%)",
          opacity: 0.35,
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto flex flex-col items-center gap-8 px-8 py-16">
        {/* Eyebrow */}
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          Welcome to Eventara
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl font-semibold tracking-tight text-[var(--text)] lg:text-6xl">
          {HERO_HEADLINE}
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl text-center text-lg text-[var(--text-dim)]">
          {HERO_SUBHEADLINE}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-3.5">
          <Link href={HERO_CTA_PRIMARY_HREF}>
            <Button className="btn-primary">{HERO_CTA_PRIMARY}</Button>
          </Link>
          <Link href={HERO_CTA_SECONDARY_HREF}>
            <Button className="btn-white-outline">{HERO_CTA_SECONDARY}</Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="w-full max-w-2xl">
          <StatsGrid />
        </div>
      </div>
    </section>
  )
}
