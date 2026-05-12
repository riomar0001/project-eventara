/**
 * Venue Hub Page Header
 */

interface PageHeaderProps {
  totalVenues: number
  avgRating?: number
  totalReviews?: number
}

export function PageHeader({
  totalVenues,
  avgRating = 4.7,
  totalReviews = 187,
}: PageHeaderProps) {
  return (
    <div className="relative px-8 py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--lime)]"
                style={{
                  boxShadow: "0 0 12px var(--lime-glow)",
                }}
              />
              VENUES · HUB
            </div>
            <h1
              className="m-0 text-[clamp(42px,5.5vw,72px)] font-bold tracking-[-0.035em] text-[var(--text)]"
              style={{ lineHeight: 1 }}
            >
              Venue Hub
            </h1>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="font-mono text-[32px] font-semibold tracking-[-0.03em] text-[var(--lime)]">
                {totalVenues}
              </div>
              <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
                Listings
              </div>
            </div>
            <div className="h-[38px] w-px bg-[var(--line-soft)]" />
            <div className="text-right">
              <div className="font-mono text-[32px] font-semibold tracking-[-0.03em] text-[var(--text)]">
                {avgRating}
              </div>
              <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
                Avg rating
              </div>
            </div>
            <div className="h-[38px] w-px bg-[var(--line-soft)]" />
            <div className="text-right">
              <div className="font-mono text-[32px] font-semibold tracking-[-0.03em] text-[var(--text)]">
                {totalReviews}
              </div>
              <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
                Reviews
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
