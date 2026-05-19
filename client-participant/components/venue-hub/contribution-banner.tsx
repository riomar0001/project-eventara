/**
 * Contribution Banner - "Add a venue" CTA
 * Grid layout: text on left, button on right
 */
import { Icon } from '@/components/ui/icon';

interface ContributionBannerProps {
  onAddVenue: () => void;
}

export function ContributionBanner({ onAddVenue }: ContributionBannerProps) {
  return (
    <div className="rounded-[22px] bg-linear-[135deg,var(--lime)_0%,oklch(0.9_0.22_128_/_0.25)_50%,var(--lime-dim)_100%] p-px">
      <div className="relative overflow-hidden rounded-[21px] bg-linear-[180deg] from-[oklch(1_0_0)] to-[oklch(0.97_0.005_150)] px-6 py-8 md:px-[44px] md:py-10">
        {/* Glow effects */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,oklch(0.9_0.22_128_/_0.14),transparent_45%),radial-gradient(circle_at_85%_70%,oklch(0.82_0.17_75_/_0.12),transparent_45%)]" />

        {/* Content */}
        <div className="relative z-10 grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto] md:gap-7">
          <div>
            <div className="text-text-mute mb-1.5 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase">
              <span className="bg-amber inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--amber-glow)]" />
              COMMUNITY GROWTH
            </div>

            <h3 className="text-text m-0 mb-1.5 text-[clamp(22px,2.4vw,28px)] leading-[1.2] font-semibold tracking-[-0.025em]">
              Know a great spot? Help the community grow.
            </h3>

            <p className="text-text-dim m-0 max-w-[56ch] text-[14.5px] leading-[1.5]">
              Add a new venue to the database — reviewed and verified by other contributors within 24 hours.
            </p>
          </div>

          <button
            onClick={onAddVenue}
            className="border-lime text-lime flex items-center justify-center gap-2.5 rounded-full border bg-[oklch(0.7_0.2_130_/_0.06)] px-6 py-[15px] text-[14px] font-semibold tracking-[-0.01em] whitespace-nowrap transition-all hover:bg-[oklch(0.7_0.2_130_/_0.12)] hover:shadow-[0_0_24px_-6px_var(--lime-glow)]"
          >
            <Icon name="plus" size={16} />
            Contribute Venue
          </button>
        </div>
      </div>
    </div>
  );
}
