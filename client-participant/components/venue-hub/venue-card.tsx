/**
 * Venue Card component - main venue display card
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import type { Venue } from '@/types/venue';
import { CapacityBadge } from './capacity-badge';
import { RatingBadge } from './rating-badge';
import { formatDate } from '@/lib/formatters';

interface VenueCardProps {
  venue: Venue;
  onView: (v: Venue) => void;
  onEdit: (v: Venue) => void;
  onShare: (v: Venue) => void;
  onReport: (v: Venue) => void;
}

export function VenueCard({ venue, onView }: VenueCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMenuOpen]);

  return (
    <div className="border-line-soft bg-surface flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-280 hover:border-[oklch(0.9_0.22_128_/_0.45)] hover:shadow-lg hover:shadow-[oklch(0.9_0.22_128_/_0.15)]">
      {/* Visual Section */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[oklch(0.2_0.01_150)] to-[oklch(0.15_0.008_150)]">
        {/* Stripe pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(${venue.angle}, transparent 0 22px, oklch(1 0 0 / 0.035) 22px 24px)`
          }}
        />

        {/* Orbs */}
        <div
          className={`absolute top-[22%] left-[18%] h-[220px] w-[220px] rounded-full blur-[34px] ${venue.orb === 'lime' ? 'bg-lime opacity-30' : 'bg-amber opacity-40'}`}
        />
        <div
          className={`absolute right-[14%] bottom-[18%] h-[180px] w-[180px] rounded-full blur-[34px] ${venue.orb === 'lime' ? 'bg-amber' : 'bg-lime'} opacity-25`}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <RatingBadge rating={venue.rating} reviews={venue.reviews} />
        </div>
        <div className="absolute top-3 right-3">
          <CapacityBadge type={venue.type} capacity={venue.capacity} />
        </div>

        {/* Placeholder label */}
        <div className="absolute bottom-4 left-4 font-mono text-xs tracking-widest text-[oklch(1_0_0_/_0.45)] uppercase">[ venue cover · 16:9 ]</div>

        {/* Bottom fade overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,oklch(0_0_0_/_0.45))]" />
      </div>

      {/* Body Section */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {/* Title & Contributor */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-text m-0 text-lg font-semibold tracking-[-0.02em]">{venue.name}</h3>
          <div className="flex-shrink-0 text-xs">
            <div className="from-amber flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br to-[oklch(0.72_0.16_75)] text-xs font-bold text-white">
              {venue.contributor.username.replace('@', '')[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Contributor info */}
        <div className="text-text-dim text-xs">
          <div className="font-semibold">{venue.contributor.username}</div>
          <div className="text-text-mute">{formatDate(venue.contributor.date)}</div>
        </div>

        {/* Specs */}
        <div className="space-y-1.5 py-1.5">
          <div className="text-text flex items-center gap-2 text-sm">
            <Icon name="mapPin" size={16} className="text-text-mute" />
            <span>{venue.location}</span>
          </div>
          <div className="text-text flex items-center gap-2 text-sm">
            <Icon name="users" size={16} className="text-text-mute" />
            <span>{venue.capacity} capacity</span>
          </div>
        </div>

        {/* Tags */}
        {venue.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1.5">
            {venue.tags.map((tag) => (
              <span key={tag} className="text-text-dim rounded-md bg-[oklch(0_0_0_/_0.025)] px-2 py-1 text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer to push action row to bottom */}
        <div className="flex-1" />

        {/* Action row */}
        <div className="border-line-soft border-t border-dashed pt-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(venue)}
              className="border-lime text-lime flex-1 rounded-full border bg-[oklch(0.9_0.22_128_/_0.05)] px-3 py-2 text-sm font-medium transition-all hover:bg-[oklch(0.9_0.22_128_/_0.12)] hover:shadow-[0_0_16px_-4px_oklch(0.7_0.2_130_/_0.5)]"
            >
              View / Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
