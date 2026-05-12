/**
 * Contribution Banner - "Add a venue" CTA
 */

interface ContributionBannerProps {
  onAddVenue: () => void
}

export function ContributionBanner({ onAddVenue }: ContributionBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-gradient-to-b from-[oklch(0.2_0.012_150)] to-[oklch(0.14_0.008_150)] p-12 text-center">
      {/* Gradient border */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-br from-[var(--lime)] via-transparent to-[var(--amber)] p-1.5" />

      {/* Glow effects */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, oklch(0.9 0.22 128 / 0.18), transparent 45%), radial-gradient(circle at 85% 80%, oklch(0.82 0.17 75 / 0.16), transparent 45%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-2 inline-flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-mute)]">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--amber)",
              boxShadow: "0 0 12px var(--amber-glow)",
            }}
          />
          CONTRIBUTE
        </div>

        <h3 className="m-0 mb-2 text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.03em] text-[var(--text)]">
          Missing your favorite venue?
        </h3>

        <p className="mb-6 max-w-[54ch] text-base text-[var(--text-dim)]">
          Help grow the Venue Hub by contributing details about your go-to event
          spaces. Venues you add will be reviewed and featured across the
          platform.
        </p>

        <button
          onClick={onAddVenue}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--lime)] px-6 py-3 font-semibold text-[#0a1005] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--lime-glow)]"
          style={{
            boxShadow:
              "0 8px 28px -10px var(--lime-glow), inset 0 -1px 0 oklch(0.7 0.2 128)",
          }}
        >
          Add a venue
        </button>
      </div>
    </div>
  )
}
