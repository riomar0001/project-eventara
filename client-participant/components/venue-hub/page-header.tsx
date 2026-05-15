/**
 * Venue Hub Page Header
 */

interface PageHeaderProps {
  totalVenues: number;
  avgRating?: number;
  totalReviews?: number;
}

export function PageHeader({ totalVenues, avgRating = 4.7, totalReviews = 187 }: PageHeaderProps) {
  return (
    <div className="relative px-8 py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="text-text-mute mb-3 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase">
              <span className="bg-lime inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)]" />
              COMMUNITY DATABASE · DAVAO
            </div>
            <h1 className="text-text m-0 text-[clamp(42px,5.5vw,72px)] leading-none font-bold tracking-[-0.035em]">Venue Hub</h1>
            <p className="text-text-dim mt-3.5 mb-0 max-w-[62ch] text-[16px] leading-[1.55]">
              Discover, rate, and contribute the best spaces for Web3 and DeFi events in Davao.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-lime font-mono text-[32px] font-semibold tracking-[-0.03em]">{totalVenues}</div>
              <div className="text-text-mute mt-0.5 font-mono text-[10.5px] tracking-[0.18em] uppercase">Listings</div>
            </div>
            <div className="bg-line-soft h-[38px] w-px" />
            <div className="text-right">
              <div className="text-text font-mono text-[32px] font-semibold tracking-[-0.03em]">{avgRating}</div>
              <div className="text-text-mute mt-0.5 font-mono text-[10.5px] tracking-[0.18em] uppercase">Avg rating</div>
            </div>
            <div className="bg-line-soft h-[38px] w-px" />
            <div className="text-right">
              <div className="text-text font-mono text-[32px] font-semibold tracking-[-0.03em]">{totalReviews}</div>
              <div className="text-text-mute mt-0.5 font-mono text-[10.5px] tracking-[0.18em] uppercase">Reviews</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
