'use client';

export function CTABanner() {
  return (
    <section className="relative py-[10px_0_120px]">
      <div className="container mx-auto max-w-[1240px] px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-linear-[180deg] from-[oklch(0.985_0.004_150)] to-[oklch(0.95_0.008_150)] px-14 py-[72px] text-center">
          {/* Border gradient */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px] [mask-composite:exclude] [-webkit-mask-composite:xor] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] bg-[linear-gradient(135deg,var(--lime)_0%,transparent_40%,transparent_60%,var(--amber)_100%)] p-[1.5px]"
          />

          {/* Glow effects */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_15%_20%,oklch(0.7_0.2_130_/_0.12),transparent_45%),radial-gradient(circle_at_85%_80%,oklch(0.62_0.16_60_/_0.1),transparent_45%)]" />

          {/* Content */}
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-text-mute uppercase">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_12px_var(--lime-glow)]" />
              JOIN THE COMMUNITY
            </div>

            <h2 className="mx-auto mb-4 max-w-none text-[clamp(32px,4vw,52px)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-text">
              Ready to dive into the future of finance?
            </h2>

            <p className="mx-auto mb-9 max-w-[54ch] text-[16.5px] leading-[1.65] text-text-dim text-pretty">
              Create your participant account today to seamlessly track your events, venues, and connect with the Davao DeFi community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-3.5">
              <button className="inline-flex items-center justify-center gap-2.5 rounded-full bg-lime px-7 py-4 text-[15px] font-semibold text-white shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5">
                Create Account
              </button>
              <button className="inline-flex items-center justify-center gap-2.5 rounded-full border border-line px-7 py-4 text-[15px] font-semibold text-text transition-all duration-180 hover:bg--line-soft">
                Login to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
