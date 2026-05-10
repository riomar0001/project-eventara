'use client';

import { Building2, CalendarRange, CalendarSync, Globe, Mail, MapPin, PencilLine, Phone, Trash2, User, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackLink, DetailPanel, PhotoPanel } from './venues-shared';
import { useVenue } from '@/hooks/admin/venues/use-venue';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

const VENUE_PHOTO: Record<string, string> = {
  indoor: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80',
  outdoor: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80',
  hybrid: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80'
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 py-3 last:border-0">
      <span className="mt-0.5 shrink-0 text-neutral-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">{label}</p>
        <p className="mt-0.5 text-sm font-medium break-words text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center">
      <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-amber-600' : 'text-neutral-900'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">{label}</p>
    </div>
  );
}

export function VenueDetail({ venueId }: { venueId: string }) {
  const { venue, isLoading, error } = useVenue(venueId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-neutral-100" />
        <div className="min-h-90 animate-pulse rounded-[32px] bg-neutral-100" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100" />)}
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="space-y-4">
        <BackLink href={ADMIN_OPERATIONS_PATHS.venues} label="Back to venues" />
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">{error ?? 'Venue not found.'}</p>
        </div>
      </div>
    );
  }

  const photo = VENUE_PHOTO[venue.venue_type] ?? VENUE_PHOTO.indoor;
  const fullAddress = [venue.address_line, venue.city, venue.province, venue.postal_code, venue.region, venue.country].filter(Boolean).join(', ');
  const hasContact = venue.contact_name || venue.contact_email || venue.contact_phone;

  return (
    <div className="space-y-6">
      {/* ── Action bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.venues} label="Back to venues" />
        <Button asChild variant="outline" size="sm">
          <Link href={ADMIN_OPERATIONS_PATHS.venueEdit(venue.id)}>
            <PencilLine className="size-4" />
            Edit venue
          </Link>
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2 className="size-4" />
          Delete venue
        </Button>
      </div>

      {/* ── Hero photo panel ─────────────────────────────────────────────────── */}
      <PhotoPanel photo={photo} className="min-h-90">
        <div className="flex min-h-90 flex-col justify-between p-7">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-white/90 text-neutral-900 capitalize">
              {venue.venue_type}
            </Badge>
            {venue.is_partner && (
              <Badge variant="secondary" className="bg-amber-400/90 font-semibold text-amber-950">
                Partner
              </Badge>
            )}
          </div>
          <div className="max-w-3xl space-y-3">
            <p className="text-xs tracking-[0.2em] text-white/70 uppercase">{[venue.city, venue.province].filter(Boolean).join(', ')}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{venue.name}</h1>
            {venue.description && <p className="max-w-2xl text-sm leading-6 text-white/85">{venue.description}</p>}
          </div>
        </div>
      </PhotoPanel>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCell label="Capacity" value={venue.capacity.toLocaleString()} accent />
        <StatCell label="Venue type" value={venue.venue_type.charAt(0).toUpperCase() + venue.venue_type.slice(1)} />
        <StatCell label="Popularity" value={venue.popularity_count.toLocaleString()} />
        <StatCell label="Usage count" value={venue.usage_count.toLocaleString()} />
      </div>

      {/* ── Row 1: Location + Contact ────────────────────────────────────────── */}
      <div className={`grid gap-6 ${hasContact ? 'xl:grid-cols-[1.1fr_0.9fr]' : ''}`}>
        <DetailPanel title="Location" description="Full registered address for this venue.">
          <div className="divide-y divide-neutral-100">
            <InfoRow icon={<MapPin className="size-4" />} label="Address line" value={venue.address_line} />
            <InfoRow icon={<Building2 className="size-4" />} label="City" value={venue.city} />
            <InfoRow icon={<MapPin className="size-4" />} label="Province" value={venue.province} />
            <InfoRow icon={<MapPin className="size-4" />} label="Region" value={venue.region} />
            <InfoRow icon={<MapPin className="size-4" />} label="Postal code" value={venue.postal_code} />
            <InfoRow icon={<Globe className="size-4" />} label="Country" value={venue.country} />
          </div>
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Full address</p>
            <p className="text-sm leading-6 text-neutral-700">{fullAddress}</p>
          </div>
        </DetailPanel>

        {hasContact && (
          <DetailPanel title="Lead contact" description="Primary point of contact for this venue.">
            <div className="divide-y divide-neutral-100">
              {venue.contact_name && <InfoRow icon={<User className="size-4" />} label="Name" value={venue.contact_name} />}
              {venue.contact_email && <InfoRow icon={<Mail className="size-4" />} label="Email" value={venue.contact_email} />}
              {venue.contact_phone && <InfoRow icon={<Phone className="size-4" />} label="Phone" value={venue.contact_phone} />}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {venue.contact_email && (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${venue.contact_email}`}>
                    <Mail className="size-4" />
                    Send email
                  </a>
                </Button>
              )}
              {venue.contact_phone && (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${venue.contact_phone}`}>
                    <Phone className="size-4" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </DetailPanel>
        )}
      </div>

      {/* ── Row 2: Amenities + Metadata ──────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DetailPanel title="Amenities" description="Features and facilities available at this venue.">
          {venue.amenities && venue.amenities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {venue.amenities.map((amenity) => (
                <Badge key={amenity} variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                  {amenity}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No amenities listed for this venue.</p>
          )}
        </DetailPanel>

        <DetailPanel title="Venue metadata" description="System-tracked counts and flags.">
          <div className="divide-y divide-neutral-100">
            <InfoRow icon={<Users className="size-4" />} label="Capacity" value={`${venue.capacity.toLocaleString()} guests`} />
            <InfoRow icon={<Building2 className="size-4" />} label="Venue type" value={venue.venue_type.charAt(0).toUpperCase() + venue.venue_type.slice(1)} />
            <InfoRow icon={<CalendarSync className="size-4" />} label="Usage count" value={`${venue.usage_count} times booked`} />
            <InfoRow icon={<Users className="size-4" />} label="Popularity" value={`${venue.popularity_count} interactions`} />
            <InfoRow icon={<Building2 className="size-4" />} label="Partner status" value={venue.is_partner ? 'Eventara partner venue' : 'Community suggestion'} />
            {venue.created_at && (
              <InfoRow
                icon={<CalendarRange className="size-4" />}
                label="Created"
                value={new Date(venue.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            )}
            {venue.updated_at && (
              <InfoRow
                icon={<CalendarRange className="size-4" />}
                label="Last updated"
                value={new Date(venue.updated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            )}
          </div>
        </DetailPanel>
      </div>
    </div>
  );
}
