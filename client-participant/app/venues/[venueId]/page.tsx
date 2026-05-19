'use client';

import { useState } from 'react';
import { ArrowLeft, Star, MapPin, Users, Zap, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Footer } from '@/components/footer/footer';
import { Navbar } from '@/components/navigation/navbar';
import { usePublicVenue } from '@/hooks/venues/use-public-venue';
import { useVenuePublicRatings } from '@/hooks/venues/use-venue-public-ratings';
import { useVenueRating } from '@/hooks/venues/use-venue-rating';
import { useAuthStore } from '@/store/auth-store';

const TYPE_LABEL: Record<string, string> = { indoor: 'Indoor', outdoor: 'Outdoor', hybrid: 'Hybrid' };
const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-[oklch(0.35_0_0)]'} />
      ))}
    </div>
  );
}

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
          <Star size={28} className={`transition-colors ${n <= active ? 'fill-amber-400 text-amber-400' : 'text-[oklch(0.4_0_0)]'}`} />
        </button>
      ))}
      {active > 0 && <span className="ml-2 font-mono text-[12px] font-semibold text-amber-400">{STAR_LABELS[active]}</span>}
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function VenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const { venue, loading: venueLoading, error: venueError } = usePublicVenue(venueId);
  const rating = useVenueRating(venue ? venue.id : null);
  const { user } = useAuthStore();
  const isLoggedIn = Boolean(user);

  const [reviewPage, setReviewPage] = useState(1);
  const { ratings, pagination, loading: ratingsLoading } = useVenuePublicRatings(venueId, reviewPage);

  const [starValue, setStarValue] = useState(0);
  const [starHovered, setStarHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync star form with existing rating
  useState(() => {
    if (rating.myRating) {
      setStarValue(rating.myRating.rating);
      setComment(rating.myRating.comment ?? '');
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (starValue === 0) return;
    const ok = await (rating.myRating ? rating.updateRating(starValue, comment) : rating.submitRating(starValue, comment));
    if (ok) {
      setSubmitted(true);
      setEditing(false);
    }
  }

  async function handleDelete() {
    const ok = await rating.deleteRating();
    if (ok) {
      setStarValue(0);
      setComment('');
      setSubmitted(false);
    }
  }

  if (venueLoading) {
    return (
      <div className="bg-page min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-[1240px] px-4 py-10 md:px-8">
          <div className="mb-6 h-8 w-32 animate-pulse rounded-lg bg-[oklch(0_0_0_/_0.25)]" />
          <div className="aspect-video w-full animate-pulse rounded-2xl bg-[oklch(0_0_0_/_0.25)]" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {[240, 160, 200].map((h, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-[oklch(0_0_0_/_0.2)]" style={{ height: h }} />
              ))}
            </div>
            <div className="space-y-4">
              {[120, 120, 120].map((h, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-[oklch(0_0_0_/_0.2)]" style={{ height: h }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="bg-page min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-[1240px] px-4 py-20 text-center md:px-8">
          <p className="text-text-mute font-mono text-sm">{venueError ?? 'Venue not found.'}</p>
          <Link href="/venues" className="text-lime mt-4 inline-block text-sm underline">
            Back to venues
          </Link>
        </div>
      </div>
    );
  }

  const location = [venue.address_line, venue.city, venue.province].filter(Boolean).join(', ');
  const typeLabel = TYPE_LABEL[venue.venue_type] ?? venue.venue_type;

  return (
    <div className="bg-page min-h-screen">
      <Navbar />

      {/* Content */}
      <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Left: venue info + rating form ── */}
          <div className="space-y-4">
            {/* Hero */}
            <div>
              {/* Back button */}
              <Link href="/venues" className="text-text-mute hover:text-text mb-3 inline-flex items-center gap-2 text-sm transition-colors">
                <ArrowLeft size={15} />
                Back to venues
              </Link>

              <div className="relative aspect-video max-h-120 w-full overflow-hidden rounded-2xl bg-linear-to-br from-[oklch(0.18_0.01_150)] to-[oklch(0.12_0.008_150)] md:rounded-3xl">
                  {venue.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={venue.image_url} alt={venue.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{ backgroundImage: `repeating-linear-gradient(${venue.angle}, transparent 0 22px, oklch(1 0 0 / 0.03) 22px 24px)` }}
                      />
                      <div
                        className={`absolute top-[20%] left-[15%] h-95 w-95 rounded-full blur-[60px] ${venue.orb === 'lime' ? 'bg-lime opacity-25' : 'bg-amber opacity-30'}`}
                      />
                    </>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0_0_0_/_0.1)_0%,oklch(0_0_0_/_0.3)_100%)]" />

                  {/* Average rating */}
                  {!rating.loadingAverage && rating.count > 0 && rating.average !== null && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-[oklch(1_0_0_/_0.15)] bg-black/60 px-3 py-1.5 backdrop-blur-[8px]">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span className="font-mono text-[13px] font-semibold text-white">{rating.average.toFixed(1)}</span>
                      <span className="font-mono text-[11px] text-white/50">({rating.count})</span>
                    </div>
                  )}
                </div>
              </div>
            {/* Name + description card */}
            <div className="border-line-soft bg-surface rounded-xl border p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lime inline-block rounded-full bg-[oklch(0.9_0.22_128_/_0.08)] px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase">
                  {typeLabel}
                </span>
              </div>
              <h1 className="text-text text-2xl font-bold tracking-[-0.03em] md:text-3xl">{venue.name}</h1>
              {venue.description && <p className="text-text-dim mt-2 text-sm leading-relaxed">{venue.description}</p>}
            </div>
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: <MapPin size={16} />, label: 'Location', value: [venue.city, venue.province].filter(Boolean).join(', ') },
                { icon: <Users size={16} />, label: 'Capacity', value: `${venue.capacity.toLocaleString()} people` },
                { icon: <Zap size={16} />, label: 'Popularity', value: `${venue.popularity_count} engagements` },
                { icon: <CalendarDays size={16} />, label: 'Times used', value: `${venue.usage_count} event${venue.usage_count !== 1 ? 's' : ''}` }
              ].map(({ icon, label, value }) => (
                <div key={label} className="border-line-soft bg-surface rounded-xl border p-4">
                  <div className="text-text-mute mb-2 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase">
                    <span className="text-text-mute">{icon}</span>
                    {label}
                  </div>
                  <p className="text-text text-sm leading-snug font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Full address */}
            <div className="border-line-soft bg-surface rounded-xl border p-4">
              <p className="text-text-mute mb-1 font-mono text-[10px] tracking-[0.14em] uppercase">Full address</p>
              <div className="text-text flex items-start gap-2 text-sm">
                <MapPin size={15} className="text-text-mute mt-0.5 shrink-0" />
                {location}
              </div>
            </div>

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <div className="border-line-soft bg-surface rounded-xl border p-4">
                <p className="text-text-mute mb-3 font-mono text-[10px] tracking-[0.14em] uppercase">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {venue.amenities.map((a) => (
                    <span key={a} className="text-lime rounded-full bg-[oklch(0.9_0.22_128_/_0.06)] px-3 py-1.5 text-sm font-medium capitalize">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rate this venue */}
            <div className="border-line-soft bg-surface rounded-xl border p-5">
              <p className="text-text-mute mb-4 font-mono text-[10px] tracking-[0.14em] uppercase">Rate this venue</p>

              {!isLoggedIn ? (
                <p className="text-text-mute text-sm">
                  <Link href="/login" className="text-lime underline">
                    Sign in
                  </Link>{' '}
                  to leave a rating.
                </p>
              ) : rating.loadingMine ? (
                <div className="bg-line-soft h-8 w-48 animate-pulse rounded-md" />
              ) : rating.myRating && !editing ? (
                <div className="border-line-soft bg-page rounded-xl border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stars value={rating.myRating.rating} />
                      <span className="text-text-mute font-mono text-xs">{STAR_LABELS[rating.myRating.rating]}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(true)} className="text-text-mute hover:text-text rounded px-2 py-1 text-xs transition-colors">
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={rating.submitting}
                        className="rounded px-2 py-1 text-xs text-red-400/70 transition-colors hover:text-red-400 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {rating.myRating.comment && <p className="text-text-dim text-sm">{rating.myRating.comment}</p>}
                  {submitted && <p className="text-lime mt-2 font-mono text-[11px]">Rating saved.</p>}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <StarPicker value={starValue} hovered={starHovered} onChange={setStarValue} onHover={setStarHovered} />
                  <textarea
                    placeholder="Leave a comment (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="border-line-soft bg-page text-text placeholder-text-mute focus:border-lime w-full resize-none rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.12)] focus:outline-none"
                  />
                  {rating.error && <p className="text-xs text-red-400">{rating.error}</p>}
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
                        onClick={() => {
                          setEditing(false);
                          setStarValue(rating.myRating!.rating);
                          setComment(rating.myRating!.comment ?? '');
                          rating.clearError();
                        }}
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

          {/* ── Right: community reviews ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-text font-semibold tracking-tight">
                Community Reviews
                {pagination && <span className="text-text-mute ml-2 font-mono text-xs font-normal">({pagination.total_count})</span>}
              </p>
            </div>

            {ratingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-line-soft bg-surface animate-pulse rounded-xl border" style={{ height: 96 }} />
                ))}
              </div>
            ) : ratings.length === 0 ? (
              <div className="border-line-soft bg-surface rounded-xl border px-5 py-10 text-center">
                <p className="text-text-mute font-mono text-xs">No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ratings.map((r) => (
                  <div key={r.id} className="border-line-soft bg-surface rounded-xl border p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-text text-sm font-semibold">@{r.alias}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Stars value={r.rating} size={13} />
                          <span className="text-text-mute font-mono text-[10px]">{STAR_LABELS[r.rating]}</span>
                        </div>
                      </div>
                      <p className="text-text-mute shrink-0 font-mono text-[10px]">{formatDate(r.created_at)}</p>
                    </div>
                    {r.comment && <p className="text-text-dim text-sm leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Reviews pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  disabled={!pagination.has_previous}
                  onClick={() => setReviewPage((p) => p - 1)}
                  className="border-line text-text-mute hover:text-text rounded-full border px-4 py-1.5 font-mono text-xs transition-colors disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-text-mute font-mono text-xs">
                  {pagination.page} / {pagination.total_pages}
                </span>
                <button
                  disabled={!pagination.has_next}
                  onClick={() => setReviewPage((p) => p + 1)}
                  className="border-line text-text-mute hover:text-text rounded-full border px-4 py-1.5 font-mono text-xs transition-colors disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
