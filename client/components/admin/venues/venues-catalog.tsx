'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, MapPin, Plus, Search, Users, UsersRound, X } from 'lucide-react';
import Link from 'next/link';
import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVenues } from '@/hooks/admin/venues/use-venues';
import { CatalogCard, OperationsPageIntro } from './venues-shared';
import type { VenueRecordResponse } from '@/api/types.gen';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { resolveStorageImageUrl } from '@/lib/storage/image-url';

const VENUE_PHOTO: Record<string, string> = {
  indoor: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80',
  outdoor: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80',
  hybrid: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80'
};

function venuePhoto(venue: VenueRecordResponse): string {
  return resolveStorageImageUrl(venue.image_url) || VENUE_PHOTO[venue.venue_type] || VENUE_PHOTO.indoor;
}

const CAPACITY_FILTERS = [
  { key: 'any', label: 'Any size', min: 0 },
  { key: '100', label: '100+ guests', min: 100 },
  { key: '250', label: '250+ guests', min: 250 },
  { key: '500', label: '500+ guests', min: 500 }
];

const SORT_OPTIONS = [
  { key: 'name', label: 'Name (A-Z)' },
  { key: 'capacity', label: 'Largest capacity' },
  { key: 'city', label: 'City (A–Z)' },
  { key: 'venue_type', label: 'Venue type (A–Z)' }
];

const PAGE_SIZE = 8;

// ── Section pagination controls ───────────────────────────────────────────────

function SectionPagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoto
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (n: number) => void;
}) {
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={onPrev}>
        <ArrowLeft className="size-4" />
        Prev
      </Button>
      {pageNumbers.map((n) => (
        <Button key={n} variant={n === currentPage ? 'default' : 'outline'} size="sm" onClick={() => onGoto(n)}>
          {n}
        </Button>
      ))}
      <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={onNext}>
        Next
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  count,
  accent,
  description
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: 'amber' | 'sky';
  description: string;
}) {
  const theme =
    accent === 'amber'
      ? {
          iconRing: 'bg-amber-100 ring-amber-200 text-amber-700',
          labelColor: 'text-amber-950',
          panel: 'border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-white shadow-[0_18px_45px_-34px_rgba(180,83,9,0.3)]',
          countPill: 'border-amber-200 bg-amber-50 text-amber-700',
          rail: 'from-amber-200 via-amber-100 to-transparent',
          sourcePill: 'border-amber-200 bg-white text-amber-700'
        }
      : {
          iconRing: 'bg-sky-100 ring-sky-200 text-sky-700',
          labelColor: 'text-sky-950',
          panel: 'border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-white shadow-[0_18px_45px_-34px_rgba(14,165,233,0.28)]',
          countPill: 'border-sky-200 bg-sky-50 text-sky-700',
          rail: 'from-sky-200 via-sky-100 to-transparent',
          sourcePill: 'border-sky-200 bg-white text-sky-700'
        };

  return (
    <div className={`overflow-hidden rounded-[28px] border px-5 py-4 ${theme.panel}`}>
      <div className="flex flex-wrap items-start gap-4">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${theme.iconRing}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-lg font-semibold tracking-tight ${theme.labelColor}`}>{label}</p>
            <span className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${theme.countPill}`}>
              {count} {count === 1 ? 'venue' : 'venues'}
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        <span className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${theme.sourcePill}`}>
          {accent === 'amber' ? 'Partnered' : 'Community'}
        </span>
      </div>
      <div className={`mt-4 h-px bg-linear-to-r ${theme.rail}`} />
    </div>
  );
}

// ── Section empty state ────────────────────────────────────────────────────────

function SectionEmpty({ hasFilters, label }: { hasFilters: boolean; label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 px-6 py-8 text-center">
      <p className="text-sm font-medium text-neutral-500">
        {hasFilters ? `No ${label} match the current filters.` : `No ${label} have been added yet.`}
      </p>
    </div>
  );
}

// ── Venue card grid ────────────────────────────────────────────────────────────

function VenueGrid({ venues }: { venues: VenueRecordResponse[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {venues.map((venue) => (
        <CatalogCard
          key={venue.id}
          title={venue.name}
          subtitle={[venue.city, venue.province].filter(Boolean).join(', ')}
          photo={venuePhoto(venue)}
          description={venue.description ?? 'No description provided.'}
          href={ADMIN_OPERATIONS_PATHS.venueDetail(venue.id)}
          editHref={ADMIN_OPERATIONS_PATHS.venueEdit(venue.id)}
          badges={[venue.venue_type]}
          specs={[
            { label: 'Location', value: [venue.city, venue.province].filter(Boolean).join(', '), icon: <MapPin className="size-3.5" /> },
            { label: 'Venue type', value: venue.venue_type.charAt(0).toUpperCase() + venue.venue_type.slice(1), icon: <Building2 className="size-3.5" /> },
            { label: 'Capacity', value: `${venue.capacity.toLocaleString()} guests`, icon: <Users className="size-3.5" /> }
          ]}
          tags={venue.amenities ?? []}
        />
      ))}
    </div>
  );
}

// ── Main catalog ───────────────────────────────────────────────────────────────

export function VenuesCatalog() {
  const { venues, isLoading, error } = useVenues();
  const [query, setQuery] = useState('');
  const [capacityKey, setCapacityKey] = useState('any');
  const [sortKey, setSortKey] = useState('name');
  const [partnerPage, setPartnerPage] = useState(1);
  const [communityPage, setCommunityPage] = useState(1);

  const partnerCount = useMemo(() => venues.filter((v) => v.is_partner).length, [venues]);
  const communityCount = useMemo(() => venues.filter((v) => !v.is_partner).length, [venues]);
  const totalCapacity = useMemo(() => venues.reduce((sum, v) => sum + v.capacity, 0), [venues]);

  const capacityMin = CAPACITY_FILTERS.find((o) => o.key === capacityKey)?.min ?? 0;
  const hasActiveFilters = capacityKey !== 'any' || Boolean(query.trim());

  function applyFiltersAndSort(list: VenueRecordResponse[]) {
    const lowerQuery = query.trim().toLowerCase();
    return list
      .filter((v) => (capacityMin ? v.capacity >= capacityMin : true))
      .filter((v) => {
        if (!lowerQuery) return true;
        const haystack = [v.name, v.city, v.province, v.region, v.venue_type, v.contact_name ?? '', (v.amenities ?? []).join(' ')].join(' ').toLowerCase();
        return haystack.includes(lowerQuery);
      })
      .sort((a, b) => {
        if (sortKey === 'capacity') return b.capacity - a.capacity;
        if (sortKey === 'city') return a.city.localeCompare(b.city);
        if (sortKey === 'venue_type') return a.venue_type.localeCompare(b.venue_type);
        return a.name.localeCompare(b.name);
      });
  }

  const filteredPartners = useMemo(
    () => applyFiltersAndSort(venues.filter((v) => v.is_partner)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [venues, query, capacityKey, sortKey]
  );

  const filteredCommunity = useMemo(
    () => applyFiltersAndSort(venues.filter((v) => !v.is_partner)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [venues, query, capacityKey, sortKey]
  );

  const partnerTotalPages = Math.max(1, Math.ceil(filteredPartners.length / PAGE_SIZE));
  const communityTotalPages = Math.max(1, Math.ceil(filteredCommunity.length / PAGE_SIZE));

  const partnerCurrentPage = Math.min(partnerPage, partnerTotalPages);
  const communityCurrentPage = Math.min(communityPage, communityTotalPages);

  const pagedPartners = filteredPartners.slice((partnerCurrentPage - 1) * PAGE_SIZE, partnerCurrentPage * PAGE_SIZE);
  const pagedCommunity = filteredCommunity.slice((communityCurrentPage - 1) * PAGE_SIZE, communityCurrentPage * PAGE_SIZE);

  const capacityLabel = CAPACITY_FILTERS.find((o) => o.key === capacityKey)?.label ?? 'Any size';
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'Name (A-Z)';

  function updateFilters(fn: () => void) {
    fn();
    setPartnerPage(1);
    setCommunityPage(1);
  }

  function clearFilters() {
    setCapacityKey('any');
    setQuery('');
    setPartnerPage(1);
    setCommunityPage(1);
  }

  return (
    <div className="space-y-6">
      <MobileFloatingAction cta="Add venue" href={ADMIN_OPERATIONS_PATHS.venueCreate} theme="amber" />

      <OperationsPageIntro
        eyebrow="Venue Portfolio"
        title="Venue Management"
        description="Shape the event footprint from a single cinematic surface, with venue health, capacity, and booking readiness visible before you ever open a detail page."
        metrics={[
          { label: 'Official partners', value: isLoading ? '—' : partnerCount, hint: 'Officially managed partner spaces in the catalog.' },
          { label: 'Community venues', value: isLoading ? '—' : communityCount, hint: 'Community-suggested spaces under review or active.' },
          { label: 'Portfolio capacity', value: isLoading ? '—' : totalCapacity.toLocaleString(), hint: 'Combined guest capacity across all venues.' }
        ]}
        actions={
          <PrimaryPageAction
            cta="Add venue"
            helper="Create a new space entry right from the command surface."
            href={ADMIN_OPERATIONS_PATHS.venueCreate}
            label="Primary Action"
            theme="amber"
          />
        }
      />

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="grid items-end gap-3 rounded-[24px] border border-neutral-200 bg-white/80 p-4 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.25)] md:grid-cols-[minmax(0,1fr)_minmax(0,190px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,210px)_minmax(0,210px)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search venues, city, region, or amenities"
            value={query}
            onChange={(e) => updateFilters(() => setQuery(e.target.value))}
            className="h-10 pl-9"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Capacity</p>
          <Select value={capacityKey} onValueChange={(v) => updateFilters(() => setCapacityKey(v))}>
            <SelectTrigger className="w-full" size="default"><SelectValue /></SelectTrigger>
            <SelectContent align="start">
              {CAPACITY_FILTERS.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Sort by</p>
          <Select value={sortKey} onValueChange={(v) => updateFilters(() => setSortKey(v))}>
            <SelectTrigger className="w-full" size="default"><SelectValue /></SelectTrigger>
            <SelectContent align="start">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button asChild className="h-10 w-full rounded-xl" variant="amber">
          <Link href={ADMIN_OPERATIONS_PATHS.venueCreate}>Add venue</Link>
        </Button>
      </div>

      {/* ── Active filter chips ──────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-neutral-500">{sortLabel} ·</p>
          {capacityKey !== 'any' && (
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-700">
              {capacityLabel}
              <Button type="button" variant="ghost" size="icon-xs" className="-mr-1 text-amber-700" onClick={() => updateFilters(() => setCapacityKey('any'))}>
                <X className="size-3" />
              </Button>
            </span>
          )}
          {query.trim() && (
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700">
              {`"${query.trim()}"`}
              <Button type="button" variant="ghost" size="icon-xs" className="-mr-1 text-neutral-600" onClick={() => updateFilters(() => setQuery(''))}>
                <X className="size-3" />
              </Button>
            </span>
          )}
          <Button variant="ghost" size="xs" className="text-neutral-500" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-neutral-200" />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-[24px] bg-neutral-100" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 w-44 animate-pulse rounded-lg bg-neutral-200" />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-[24px] bg-neutral-100" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sections ─────────────────────────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="space-y-10">

          {/* Partnered Venues */}
          <section className="space-y-4 rounded-[32px] border border-amber-100 bg-linear-to-br from-amber-50/35 via-white to-white p-4 shadow-[0_20px_60px_-40px_rgba(180,83,9,0.28)]">
            <SectionHeader
              icon={<BadgeCheck className="size-4" />}
              label="Partnered venues"
              count={filteredPartners.length}
              accent="amber"
              description="Managed spaces with direct relationships and stronger booking confidence."
            />

            {pagedPartners.length === 0 ? (
              <SectionEmpty hasFilters={hasActiveFilters} label="official partner venues" />
            ) : (
              <VenueGrid venues={pagedPartners} />
            )}

            <SectionPagination
              currentPage={partnerCurrentPage}
              totalPages={partnerTotalPages}
              onPrev={() => setPartnerPage((p) => Math.max(1, p - 1))}
              onNext={() => setPartnerPage((p) => Math.min(partnerTotalPages, p + 1))}
              onGoto={setPartnerPage}
            />
          </section>

          {/* Community Suggested Venues */}
          <section className="space-y-4 rounded-[32px] border border-sky-100 bg-linear-to-br from-sky-50/35 via-white to-white p-4 shadow-[0_20px_60px_-40px_rgba(14,165,233,0.26)]">
            <SectionHeader
              icon={<UsersRound className="size-4" />}
              label="Community Suggested Venues"
              count={filteredCommunity.length}
              accent="sky"
              description="Community-submitted spaces that broaden the portfolio and invite review."
            />

            {pagedCommunity.length === 0 ? (
              <SectionEmpty hasFilters={hasActiveFilters} label="community venues" />
            ) : (
              <>
                <VenueGrid venues={pagedCommunity} />
                {!hasActiveFilters && communityCurrentPage === 1 && filteredCommunity.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-sky-700 uppercase">Community growth</p>
                        <p className="mt-0.5 text-sm text-neutral-600">Know a venue that should be in the portfolio?</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-100">
                        <Link href={ADMIN_OPERATIONS_PATHS.venueCreate}>
                          <Plus className="size-4" />
                          Suggest venue
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <SectionPagination
              currentPage={communityCurrentPage}
              totalPages={communityTotalPages}
              onPrev={() => setCommunityPage((p) => Math.max(1, p - 1))}
              onNext={() => setCommunityPage((p) => Math.min(communityTotalPages, p + 1))}
              onGoto={setCommunityPage}
            />
          </section>

        </div>
      )}
    </div>
  );
}
