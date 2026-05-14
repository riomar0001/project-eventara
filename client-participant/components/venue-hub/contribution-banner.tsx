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
    <div className="relative rounded-[22px] bg-gradient-to-b from-[oklch(1_0_0)] to-[oklch(0.97_0.005_150)]" style={{ padding: '40px 44px' }}>
      {/* Gradient border - using ::before style via box-shadow and inset div */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[22px]"
        style={{
          background: 'linear-gradient(135deg, var(--lime) 0%, transparent 50%, var(--lime-dim) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1.5px'
        }}
      />

      {/* Glow effects */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, oklch(0.9 0.22 128 / 0.14), transparent 45%), radial-gradient(circle at 85% 70%, oklch(0.82 0.17 75 / 0.12), transparent 45%)'
        }}
      />

      {/* Content - Grid layout */}
      <div className="relative z-10 grid grid-cols-[1fr_auto] items-center gap-7">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-text-mute uppercase">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: 'var(--amber)',
                boxShadow: '0 0 12px var(--amber-glow)'
              }}
            />
            COMMUNITY GROWTH
          </div>

          <h3 className="m-0 mb-1.5 text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.025em] text-text" style={{ lineHeight: 1.2 }}>
            Know a great spot? Help the community grow.
          </h3>

          <p className="m-0 max-w-[56ch] text-[14.5px] text-text-dim" style={{ lineHeight: 1.5 }}>
            Add a new venue to the database — reviewed and verified by other contributors within 24 hours.
          </p>
        </div>

        <button
          onClick={onAddVenue}
          className="relative z-10 flex items-center justify-center gap-2.5 rounded-full border border--lime px-6 py-[15px] text-[14px] font-semibold tracking-[-0.01em] text-lime transition-all hover:bg-[oklch(0.7_0.2_130_/_0.12)] hover:shadow-[0_0_24px_-6px_var(--lime-glow)]"
          style={{ whiteSpace: 'nowrap', background: 'oklch(0.7 0.2 130 / 0.06)' }}
        >
          <Icon name="plus" size={16} />
          Contribute Venue
        </button>
      </div>
    </div>
  );
}
