"use client"

export function CTABanner() {
  return (
    <section className="relative pt-10" style={{ padding: "10px 0 120px" }}>
      <div className="container mx-auto max-w-[1240px] px-8">
        <div
          className="relative overflow-hidden rounded-[28px] px-14 py-[72px] text-center"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.985 0.004 150), oklch(0.95 0.008 150))",
          }}
        >
          {/* Border gradient */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{
              padding: "1.5px",
              background:
                "linear-gradient(135deg, var(--lime) 0%, transparent 40%, transparent 60%, var(--amber) 100%)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />

          {/* Glow effects */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{
              background:
                "radial-gradient(circle at 15% 20%, oklch(0.7 0.2 130 / 0.12), transparent 45%), radial-gradient(circle at 85% 80%, oklch(0.62 0.16 60 / 0.1), transparent 45%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: "var(--lime)",
                  boxShadow: "0 0 12px var(--lime-glow)",
                }}
              />
              JOIN THE COMMUNITY
            </div>

            <h2
              className="mx-auto mb-4 max-w-none text-balance font-semibold text-[var(--text)]"
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                letterSpacing: "-0.035em",
                lineHeight: "1.05",
              }}
            >
              Ready to dive into the future of finance?
            </h2>

            <p
              className="mx-auto mb-9 max-w-[54ch] text-[16.5px] leading-[1.65] text-[var(--text-dim)]"
              style={{ textWrap: "pretty" }}
            >
              Create your participant account today to seamlessly track your
              events, venues, and connect with the Davao DeFi community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-3.5">
              <button
                className="duration-180 inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--lime)] px-7 py-4 text-[15px] font-semibold text-[#0a1005] text-white transition-all hover:-translate-y-0.5"
                style={{
                  boxShadow:
                    "0 8px 28px -10px var(--lime-glow), inset 0 -1px 0 oklch(0.7 0.2 128)",
                }}
              >
                Create Account
              </button>
              <button className="duration-180 inline-flex items-center justify-center gap-2.5 rounded-full border border-[var(--line)] px-7 py-4 text-[15px] font-semibold text-[var(--text)] transition-all hover:bg-[var(--line-soft)]">
                Login to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
