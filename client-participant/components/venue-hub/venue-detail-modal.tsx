'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import type { ApiVenue } from '@/types/venue';
import { ModalBackdrop } from './modal-backdrop';
import { useVenueRating } from '@/hooks/venues/use-venue-rating';
import { useAuthStore } from '@/store/auth-store';

interface VenueDetailModalProps {
  venue: ApiVenue | null;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = { indoor: 'Indoor', outdoor: 'Outdoor', hybrid: 'Hybrid' };
const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

function StarPicker({ value, hovered, onChange, onHover }: { value: number; hovered: number; onChange: (n: number) => void; onHover: (n: number) => void }) {
  const active = hovered || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => onHover(n)}
          onMouseLeave={() => onHover(0)}
          className="rounded-lg p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={26}
            className={`transition-colors ${n <= active ? 'fill-amber-400 text-amber-400' : 'text-[oklch(0.4_0_0)]'}`}
          />
        </button>
      ))}
      {active > 0 && (
        <span className="text-amber-400 ml-1.5 font-mono text-[12px] font-semibold">{STAR_LABELS[active]}</span>
      )}
    </div>
  );
}

export function VenueDetailModal({ venue, isOpen, onClose }: VenueDetailModalProps) {
  const { user } = useAuthStore();
  const rating = useVenueRating(isOpen && venue ? venue.id : null);

  const [starValue, setStarValue] = useState(0);
  const [starHovered, setStarHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync form with user's existing rating
  useEffect(() => {
    if (rating.myRating) {
      setStarValue(rating.myRating.rating);
      setComment(rating.myRating.comment ?? '');
      setEditing(false);
    } else {
      setStarValue(0);
      setComment('');
    }
    setSubmitted(false);
  }, [rating.myRating, venue?.id]);

  if (!venue) return null;

  const location = [venue.address_line, venue.city, venue.province].filter(Boolean).join(', ');
  const typeLabel = TYPE_LABEL[venue.venue_type] ?? venue.venue_type;
  const isLoggedIn = Boolean(user);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (starValue === 0) return;
    const ok = await rating.submitRating(starValue, comment);
    if (ok) setSubmitted(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (starValue === 0) return;
    const ok = await rating.updateRating(starValue, comment);
    if (ok) { setEditing(false); setSubmitted(true); }
  }

  async function handleDelete() {
    const ok = await rating.deleteRating();
    if (ok) { setStarValue(0); setComment(''); setSubmitted(false); }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="border-line bg-surface mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl shadow-[oklch(0_0_0_/_0.3)] md:mx-0 md:rounded-3xl">
        {/* Visual Header */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[oklch(0.2_0.01_150)] to-[oklch(0.15_0.008_150)]">
          {venue.image_url ? (
            <img src={venue.image_url} alt={venue.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{ backgroundImage: `repeating-linear-gradient(${venue.angle}, transparent 0 22px, oklch(1 0 0 / 0.035) 22px 24px)` }}
              />
              <div className={`absolute top-[22%] left-[18%] h-[220px] w-[220px] rounded-full blur-[34px] ${venue.orb === 'lime' ? 'bg-lime opacity-30' : 'bg-amber opacity-40'}`} />
            </>
          )}

          {/* Average rating badge */}
          {!rating.loadingAverage && rating.count > 0 && rating.average !== null && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-[oklch(1_0_0_/_0.15)] bg-black/60 px-3 py-1.5 backdrop-blur-[8px]">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="font-mono text-[13px] font-semibold text-white">{rating.average.toFixed(1)}</span>
              <span className="text-white/50 font-mono text-[11px]">({rating.count})</span>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 rounded-lg bg-[oklch(0_0_0_/_0.6)] p-2 text-white transition-all hover:bg-[oklch(0_0_0_/_0.8)]"
        >
          <Icon name="x" size={20} />
        </button>

        {/* Content */}
        <div className="p-5 md:p-8">
          <div className="mb-4">
            <h3 className="text-text m-0 mb-1 text-2xl font-semibold tracking-[-0.02em]">{venue.name}</h3>
            <span className="text-text-mute font-mono text-sm capitalize">{typeLabel}</span>
          </div>

          {venue.description && (
            <p className="text-text-dim mb-4 text-sm leading-relaxed">{venue.description}</p>
          )}

          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div className="border-line-soft bg-page rounded-lg border p-3.5">
              <div className="text-text-mute font-mono text-xs tracking-[0.14em] uppercase">Location</div>
              <div className="text-text mt-2 flex items-center gap-2 text-sm font-medium">
                <Icon name="mapPin" size={16} />
                {location}
              </div>
            </div>

            <div className="border-line-soft bg-page rounded-lg border p-3.5">
              <div className="text-text-mute font-mono text-xs tracking-[0.14em] uppercase">Capacity</div>
              <div className="text-text mt-2 flex items-center gap-2 text-sm font-medium">
                <Icon name="users" size={16} />
                {venue.capacity} people
              </div>
            </div>

            <div className="border-line-soft bg-page rounded-lg border p-3.5">
              <div className="text-text-mute font-mono text-xs tracking-[0.14em] uppercase">Popularity</div>
              <div className="text-text mt-2 text-sm font-medium">{venue.popularity_count} engagements</div>
            </div>

            <div className="border-line-soft bg-page rounded-lg border p-3.5">
              <div className="text-text-mute font-mono text-xs tracking-[0.14em] uppercase">Times used</div>
              <div className="text-text mt-2 text-sm font-medium">{venue.usage_count} event{venue.usage_count !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {venue.amenities && venue.amenities.length > 0 && (
            <div className="py-4">
              <div className="text-text-mute mb-2 font-mono text-xs tracking-[0.14em] uppercase">Amenities</div>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity) => (
                  <span key={amenity} className="text-lime rounded-full bg-[oklch(0.9_0.22_128_/_0.06)] px-3 py-1.5 text-sm font-medium capitalize">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Rating section ── */}
          <div className="border-line-soft mt-4 border-t pt-6">
            <div className="text-text-mute mb-4 font-mono text-xs tracking-[0.14em] uppercase">Rate this venue</div>

            {!isLoggedIn ? (
              <p className="text-text-mute text-sm">Sign in to leave a rating for this venue.</p>
            ) : rating.loadingMine ? (
              <div className="bg-line-soft h-8 w-48 animate-pulse rounded-md" />
            ) : rating.myRating && !editing ? (
              /* Already rated — read view */
              <div className="border-line-soft bg-page rounded-xl border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={18} className={n <= rating.myRating!.rating ? 'fill-amber-400 text-amber-400' : 'text-[oklch(0.4_0_0)]'} />
                    ))}
                    <span className="text-text-mute ml-2 font-mono text-xs">{STAR_LABELS[rating.myRating.rating]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(true)}
                      className="text-text-mute hover:text-text rounded-md px-2 py-1 text-xs transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={rating.submitting}
                      className="text-red-400/70 hover:text-red-400 rounded-md px-2 py-1 text-xs transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {rating.myRating.comment && (
                  <p className="text-text-dim text-sm">{rating.myRating.comment}</p>
                )}
                {submitted && (
                  <p className="text-lime mt-2 font-mono text-[11px]">Rating saved.</p>
                )}
              </div>
            ) : (
              /* Submit / edit form */
              <form onSubmit={rating.myRating ? handleUpdate : handleSubmit} className="space-y-3">
                <StarPicker value={starValue} hovered={starHovered} onChange={setStarValue} onHover={setStarHovered} />
                <textarea
                  placeholder="Leave a comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="border-line-soft bg-page text-text placeholder-text-mute focus:border-lime w-full resize-none rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.12)]"
                />
                {rating.error && <p className="text-red-400 text-xs">{rating.error}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={starValue === 0 || rating.submitting}
                    className="bg-lime rounded-full px-5 py-2 text-sm font-semibold text-white shadow-[0_6px_20px_-8px_var(--lime-glow)] transition-all hover:shadow-[0_10px_28px_-8px_var(--lime-glow)] disabled:opacity-50"
                  >
                    {rating.submitting ? 'Saving…' : rating.myRating ? 'Update rating' : 'Submit rating'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={() => { setEditing(false); setStarValue(rating.myRating!.rating); setComment(rating.myRating!.comment ?? ''); rating.clearError(); }}
                      className="text-text-mute hover:text-text rounded-full px-4 py-2 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="border-line-soft border-t px-5 py-4 md:px-8">
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
