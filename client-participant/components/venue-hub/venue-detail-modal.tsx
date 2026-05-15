/**
 * Venue Detail Modal - Read-only view
 */

'use client';

import { Icon } from '@/components/ui/icon';
import type { Venue } from '@/types/venue';
import { ModalBackdrop } from './modal-backdrop';
import { RatingBadge } from './rating-badge';
import { formatDate } from '@/lib/formatters';

interface VenueDetailModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VenueDetailModal({ venue, isOpen, onClose }: VenueDetailModalProps) {
  if (!venue) return null;

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="border-line bg-surface w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl shadow-[oklch(0_0_0_/_0.3)]">
        {/* Visual Header */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[oklch(0.2_0.01_150)] to-[oklch(0.15_0.008_150)]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(${venue.angle}, transparent 0 22px, oklch(1 0 0 / 0.035) 22px 24px)`
            }}
          />
          <div
            className={`absolute top-[22%] left-[18%] h-[220px] w-[220px] rounded-full blur-[34px] ${venue.orb === 'lime' ? 'bg-lime opacity-30' : 'bg-amber opacity-40'}`}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 rounded-lg bg-[oklch(0_0_0_/_0.6)] p-2 text-white transition-all hover:bg-[oklch(0_0_0_/_0.8)]"
        >
          <Icon name="x" size={20} />
        </button>

        {/* Content */}
        <div className="p-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-text m-0 mb-2 text-2xl font-semibold tracking-[-0.02em]">{venue.name}</h3>
              <div className="flex items-center gap-4">
                <RatingBadge rating={venue.rating} reviews={venue.reviews} />
                <span className="text-text-mute font-mono text-sm">{venue.type}</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="border-line-soft bg-page rounded-lg border p-3.5">
              <div className="text-text-mute font-mono text-xs tracking-[0.14em] uppercase">Location</div>
              <div className="text-text mt-2 flex items-center gap-2 text-sm font-medium">
                <Icon name="mapPin" size={16} />
                {venue.location}
              </div>
            </div>

            <div className="border-line-soft bg-page rounded-lg border p-3.5">
              <div className="text-text-mute font-mono text-xs tracking-[0.14em] uppercase">Capacity</div>
              <div className="text-text mt-2 flex items-center gap-2 text-sm font-medium">
                <Icon name="users" size={16} />
                {venue.capacity}
              </div>
            </div>

            <div className="border-line-soft bg-page rounded-lg border p-3.5">
              <div className="text-text-mute font-mono text-xs tracking-[0.14em] uppercase">Contributed by</div>
              <div className="text-text mt-2 text-sm font-medium">{venue.contributor.username}</div>
            </div>

            <div className="border-line-soft bg-page rounded-lg border p-3.5">
              <div className="text-text-mute font-mono text-xs tracking-[0.14em] uppercase">Added</div>
              <div className="text-text mt-2 text-sm font-medium">{formatDate(venue.contributor.date)}</div>
            </div>
          </div>

          {/* Tags */}
          {venue.tags.length > 0 && (
            <div className="py-4">
              <div className="text-text-mute mb-2 font-mono text-xs tracking-[0.14em] uppercase">Tags</div>
              <div className="flex flex-wrap gap-2">
                {venue.tags.map((tag) => (
                  <span key={tag} className="text-lime rounded-full bg-[oklch(0.9_0.22_128_/_0.06)] px-3 py-1.5 text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {venue.amenities.length > 0 && (
            <div className="py-4">
              <div className="text-text-mute mb-2 font-mono text-xs tracking-[0.14em] uppercase">Amenities</div>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity) => (
                  <span key={amenity} className="text-text-dim rounded-full bg-[oklch(0_0_0_/_0.1)] px-3 py-1.5 text-sm font-medium">
                    {amenity === 'wifi' ? 'WiFi' : amenity === 'parking' ? 'Parking' : amenity === 'coffee' ? 'Coffee' : 'Sound System'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-line-soft border-t px-8 py-4">
          <button
            onClick={onClose}
            className="border-line text-text-dim hover:text-text w-full rounded-full border bg-transparent px-4 py-2.5 font-semibold transition-all hover:bg-[oklch(1_0_0_/_0.04)]"
          >
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
