'use client';

import Link from 'next/link';
import { Pencil, Star } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { useAuthStore } from '@/store/auth-store';
import type { ApiVenue } from '@/types/venue';

interface VenueCardProps {
  venue: ApiVenue;
}

const TYPE_LABEL: Record<string, string> = { indoor: 'Indoor', outdoor: 'Outdoor', hybrid: 'Hybrid' };

export function VenueCard({ venue }: VenueCardProps) {
  const user = useAuthStore((s) => s.user);
  const location = [venue.address_line, venue.city].filter(Boolean).join(', ');
  const typeLabel = TYPE_LABEL[venue.venue_type] ?? venue.venue_type;

  return (
    <div className="border-line-soft bg-surface flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-280 hover:border-[oklch(0.9_0.22_128_/_0.45)] hover:shadow-lg hover:shadow-[oklch(0.9_0.22_128_/_0.15)]">
      {/* Visual */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[oklch(0.2_0.01_150)] to-[oklch(0.15_0.008_150)]">
        {venue.image_url ? (
          <img src={venue.image_url} alt={venue.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ backgroundImage: `repeating-linear-gradient(${venue.angle}, transparent 0 22px, oklch(1 0 0 / 0.035) 22px 24px)` }}
            />
            <div className={`absolute top-[22%] left-[18%] h-[220px] w-[220px] rounded-full blur-[34px] ${venue.orb === 'lime' ? 'bg-lime opacity-30' : 'bg-amber opacity-40'}`} />
            <div className={`absolute right-[14%] bottom-[18%] h-[180px] w-[180px] rounded-full blur-[34px] ${venue.orb === 'lime' ? 'bg-amber' : 'bg-lime'} opacity-25`} />
          </>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3 rounded-full border border-[oklch(1_0_0_/_0.15)] bg-black/55 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-white/70 uppercase backdrop-blur-[8px]">
          {typeLabel}
        </div>

        {/* Rating badge */}
        {venue.rating_count > 0 && venue.average_rating !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-[oklch(1_0_0_/_0.15)] bg-black/55 px-2.5 py-1 font-mono text-[10px] text-white/70 backdrop-blur-[8px]">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span className="text-amber-400">{venue.average_rating.toFixed(1)}</span>
            <span className="text-white/40">({venue.rating_count})</span>
          </div>
        )}

        {/* Capacity badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-[oklch(1_0_0_/_0.15)] bg-black/55 px-2.5 py-1 font-mono text-[10px] text-white/70 backdrop-blur-[8px]">
          <Icon name="users" size={10} />
          {venue.capacity}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,oklch(0_0_0_/_0.45))]" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="text-text m-0 text-lg font-semibold tracking-[-0.02em]">{venue.name}</h3>

        <div className="space-y-1.5">
          <div className="text-text flex items-center gap-2 text-sm">
            <Icon name="mapPin" size={15} className="text-text-mute" />
            <span>{location}</span>
          </div>
          {venue.popularity_count > 0 && (
            <div className="text-text-mute flex items-center gap-2 text-xs">
              <Icon name="users" size={13} className="text-text-mute" />
              <span>{venue.popularity_count} times used in events</span>
            </div>
          )}
          {venue.creator_alias && (
            <div className="text-text-mute font-mono text-[10px]">
              Added by <span className="text-lime">@{venue.creator_alias}</span>
            </div>
          )}
        </div>

        {venue.amenities && venue.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {venue.amenities.slice(0, 4).map((tag) => (
              <span key={tag} className="text-text-dim rounded-md bg-[oklch(0_0_0_/_0.025)] px-2 py-1 text-xs font-medium capitalize">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        <div className="border-line-soft border-t border-dashed pt-2.5 flex gap-2">
          <Link
            href={`/venues/${venue.id}`}
            className="border-lime text-lime flex-1 block rounded-full border bg-[oklch(0.9_0.22_128_/_0.05)] px-3 py-2 text-center text-sm font-medium transition-all hover:bg-[oklch(0.9_0.22_128_/_0.12)] hover:shadow-[0_0_16px_-4px_oklch(0.7_0.2_130_/_0.5)]"
          >
            View Details
          </Link>
          {user && !venue.is_partner && user.alias && venue.creator_alias === user.alias && (
            <Link
              href={`/venues/contribute/${venue.id}/edit`}
              className="border-line-soft text-text-mute hover:border-text-mute hover:text-text flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-medium transition-all"
              title="Edit this venue"
            >
              <Pencil size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
