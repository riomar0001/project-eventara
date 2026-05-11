'use client';

import { Building2, CalendarRange, CalendarSync, Globe, Mail, MapPin, PencilLine, Phone, User, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackLink, PhotoPanel } from './venues-shared';
import { DeleteVenueButton } from './venue-delete-button';
import { useVenue } from '@/hooks/admin/venues/use-venue';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { resolveStorageImageUrl } from '@/lib/storage/image-url';

const VENUE_PHOTO: Record<string, string> = {
  indoor: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80',
  outdoor: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80',
  hybrid: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80'
};

function CompactPanel({ children, className, title }: { children: React.ReactNode; className?: string; title: string }) {
  return (
    <section className={`rounded-2xl border border-neutral-200 bg-white shadow-[0_18px_55px_-42px_rgba(15,23,42,0.35)] ${className ?? ''}`}>
      <div className="flex min-h-12 items-center border-b border-neutral-100 px-4">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-950">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function CompactField({ className, icon, label, value }: { className?: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={`flex min-h-14 items-start gap-2.5 rounded-xl bg-neutral-50/70 px-3 py-2.5 ${className ?? ''}`}>
      <span className="mt-0.5 shrink-0 text-neutral-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">{label}</p>
        <p className="mt-0.5 text-sm leading-5 font-medium wrap-break-word text-neutral-900">{value}</p>
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

  const photo = resolveStorageImageUrl(venue.image_url) || VENUE_PHOTO[venue.venue_type] || VENUE_PHOTO.indoor;
  const fullAddress = [venue.address_line, venue.city, venue.province, venue.postal_code, venue.region, venue.country].filter(Boolean).join(', ');
  const hasContact = venue.contact_name || venue.contact_email || venue.contact_phone;
  const amenities = venue.amenities ?? [];

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
        <DeleteVenueButton venueId={venue.id} venueName={venue.name} />
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

      <div className="grid gap-4 xl:grid-cols-12">
        <CompactPanel title="Location" className={hasContact ? 'xl:col-span-7' : 'xl:col-span-12'}>
          <div className="rounded-xl bg-amber-50/80 px-3 py-2.5">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-700 uppercase">Full address</p>
            <p className="mt-1 text-sm leading-5 font-medium text-neutral-900">{fullAddress}</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <CompactField className="sm:col-span-2 lg:col-span-3" icon={<MapPin className="size-4" />} label="Address line" value={venue.address_line} />
            <CompactField icon={<Building2 className="size-4" />} label="City" value={venue.city} />
            <CompactField icon={<MapPin className="size-4" />} label="Province" value={venue.province} />
            <CompactField icon={<MapPin className="size-4" />} label="Region" value={venue.region} />
            <CompactField icon={<MapPin className="size-4" />} label="Postal code" value={venue.postal_code} />
            <CompactField icon={<Globe className="size-4" />} label="Country" value={venue.country} />
          </div>
        </CompactPanel>

        {hasContact && (
          <CompactPanel title="Lead contact" className="xl:col-span-5">
            <div className="grid gap-2">
              {venue.contact_name && <CompactField icon={<User className="size-4" />} label="Name" value={venue.contact_name} />}
              {venue.contact_email && <CompactField icon={<Mail className="size-4" />} label="Email" value={venue.contact_email} />}
              {venue.contact_phone && <CompactField icon={<Phone className="size-4" />} label="Phone" value={venue.contact_phone} />}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {venue.contact_email && (
                <Button asChild variant="outline" size="xs">
                  <a href={`mailto:${venue.contact_email}`}>
                    <Mail className="size-4" />
                    Send email
                  </a>
                </Button>
              )}
              {venue.contact_phone && (
                <Button asChild variant="outline" size="xs">
                  <a href={`tel:${venue.contact_phone}`}>
                    <Phone className="size-4" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </CompactPanel>
        )}

        <CompactPanel title="Venue details" className="xl:col-span-12">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <CompactField icon={<Users className="size-4" />} label="Capacity" value={`${venue.capacity.toLocaleString()} guests`} />
            <CompactField icon={<Building2 className="size-4" />} label="Venue type" value={venue.venue_type.charAt(0).toUpperCase() + venue.venue_type.slice(1)} />
            <CompactField icon={<CalendarSync className="size-4" />} label="Usage" value={`${venue.usage_count} bookings`} />
            <CompactField icon={<Users className="size-4" />} label="Popularity" value={`${venue.popularity_count} interactions`} />
            <CompactField
              className="lg:col-span-2"
              icon={<Building2 className="size-4" />}
              label="Partner status"
              value={venue.is_partner ? 'Eventara partner venue' : 'Community suggestion'}
            />
            {venue.created_at && (
              <CompactField
                icon={<CalendarRange className="size-4" />}
                label="Created"
                value={new Date(venue.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            )}
            {venue.updated_at && (
              <CompactField
                icon={<CalendarRange className="size-4" />}
                label="Last updated"
                value={new Date(venue.updated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            )}
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">Amenities</p>
              {amenities.length > 0 && <p className="text-xs text-neutral-400">{amenities.length} listed</p>}
            </div>
            {amenities.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="h-6 rounded-full bg-neutral-100 px-2.5 text-[11px] font-medium text-neutral-700">
                    {amenity}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-400">No amenities listed for this venue.</p>
            )}
          </div>
        </CompactPanel>
      </div>
    </div>
  );
}
