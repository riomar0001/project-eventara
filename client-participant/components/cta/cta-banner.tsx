"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-[var(--bg)] py-24">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute rounded-full opacity-40 blur-[100px]"
          style={{
            width: "800px",
            height: "800px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, oklch(0.9 0.22 128 / 0.4), transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-3xl px-8 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-[var(--text)] lg:text-5xl">
          Ready to join our community?
        </h2>
        <p className="mt-4 text-lg text-[var(--text-dim)]">
          Connect with innovators, attend exclusive events, and be part of the
          DeFi revolution in Davao.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Link href="#join">
            <Button className="btn-primary">Get Started</Button>
          </Link>
          <Link href="#contact">
            <Button className="btn-amber-outline">Contact Us</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
