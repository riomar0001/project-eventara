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
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-[oklch(0_0_0_/_0.3)]">
        {/* Visual Header */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[oklch(0.2_0.01_150)] to-[oklch(0.15_0.008_150)]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(${venue.angle}, transparent 0 22px, oklch(1 0 0 / 0.035) 22px 24px)`
            }}
          />
          <div
            className="absolute rounded-full blur-[34px]"
            style={{
              width: '220px',
              height: '220px',
              left: '18%',
              top: '22%',
              background: venue.orb === 'lime' ? 'var(--lime)' : 'var(--amber)',
              opacity: venue.orb === 'lime' ? 0.3 : 0.4
            }}
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
              <h3 className="m-0 mb-2 text-2xl font-semibold tracking-[-0.02em] text-text">{venue.name}</h3>
              <div className="flex items-center gap-4">
                <RatingBadge rating={venue.rating} reviews={venue.reviews} />
                <span className="font-mono text-sm text-text-mute">{venue.type}</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="rounded-lg border border-line-soft bg-page p-3.5">
              <div className="font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Location</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-text">
                <Icon name="mapPin" size={16} />
                {venue.location}
              </div>
            </div>

            <div className="rounded-lg border border-line-soft bg-page p-3.5">
              <div className="font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Capacity</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-text">
                <Icon name="users" size={16} />
                {venue.capacity}
              </div>
            </div>

            <div className="rounded-lg border border-line-soft bg-page p-3.5">
              <div className="font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Contributed by</div>
              <div className="mt-2 text-sm font-medium text-text">{venue.contributor.username}</div>
            </div>

            <div className="rounded-lg border border-line-soft bg-page p-3.5">
              <div className="font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Added</div>
              <div className="mt-2 text-sm font-medium text-text">{formatDate(venue.contributor.date)}</div>
            </div>
          </div>

          {/* Tags */}
          {venue.tags.length > 0 && (
            <div className="py-4">
              <div className="mb-2 font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Tags</div>
              <div className="flex flex-wrap gap-2">
                {venue.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[oklch(0.9_0.22_128_/_0.06)] px-3 py-1.5 text-sm font-medium text-lime">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {venue.amenities.length > 0 && (
            <div className="py-4">
              <div className="mb-2 font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Amenities</div>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-[oklch(0_0_0_/_0.1)] px-3 py-1.5 text-sm font-medium text-text-dim">
                    {amenity === 'wifi' ? 'WiFi' : amenity === 'parking' ? 'Parking' : amenity === 'coffee' ? 'Coffee' : 'Sound System'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line-soft px-8 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-full border border-line bg-transparent px-4 py-2.5 font-semibold text-text-dim transition-all hover:bg-[oklch(1_0_0_/_0.04)] hover:text-text"
          >
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
