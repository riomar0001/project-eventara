'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, MapPin, Plus, Search, Users, X } from 'lucide-react';
import Link from 'next/link';
import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  { key: 'venue_type', label: 'Venue type (A–Z)' },
  { key: 'partner', label: 'Partners first' }
];

export function VenuesCatalog() {
  const { venues, isLoading, error } = useVenues();
  const [query, setQuery] = useState('');
  const [capacityKey, setCapacityKey] = useState('any');
  const [sortKey, setSortKey] = useState('name');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const partnerVenueCount = useMemo(() => venues.filter((v) => v.is_partner).length, [venues]);
  const totalCapacity = useMemo(() => venues.reduce((sum, v) => sum + v.capacity, 0), [venues]);

  const filtered = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const capacityMin = CAPACITY_FILTERS.find((o) => o.key === capacityKey)?.min ?? 0;

    return venues
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
        if (sortKey === 'partner') return Number(b.is_partner) - Number(a.is_partner);
        return a.name.localeCompare(b.name);
      });
  }, [capacityKey, query, sortKey, venues]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const capacityLabel = CAPACITY_FILTERS.find((o) => o.key === capacityKey)?.label ?? 'Any size';
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'Name (A-Z)';
  const hasActiveFilters = capacityKey !== 'any' || Boolean(query.trim());

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  function clearFilters() {
    setCapacityKey('any');
    setQuery('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <MobileFloatingAction cta="Add venue" href={ADMIN_OPERATIONS_PATHS.venueCreate} theme="amber" />

      <OperationsPageIntro
        eyebrow="Venue Portfolio"
        title="Venue Management"
        description="Shape the event footprint from a single cinematic surface, with venue health, capacity, and booking readiness visible before you ever open a detail page."
        metrics={[
          { label: 'Partner venues', value: partnerVenueCount, hint: 'Spaces marked as Eventara partner venues in the catalog.' },
          { label: 'Portfolio capacity', value: totalCapacity.toLocaleString(), hint: 'Combined guest capacity across all venues.' },
          { label: 'Total venues', value: venues.length, hint: 'All community and official venues in the system.' }
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

      <div className="grid items-end gap-3 rounded-[24px] border border-neutral-200 bg-white/80 p-4 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.25)] md:grid-cols-[minmax(0,1fr)_minmax(0,190px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,210px)_minmax(0,210px)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search venues, city, region, or amenities"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="h-10 pl-9"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Capacity</p>
          <Select
            value={capacityKey}
            onValueChange={(v) => {
              setCapacityKey(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full" size="default">
              <SelectValue />
            </SelectTrigger>
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
          <Select
            value={sortKey}
            onValueChange={(v) => {
              setSortKey(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full" size="default">
              <SelectValue />
            </SelectTrigger>
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

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Venue results</h3>
          <p className="text-sm text-neutral-500">
            {isLoading ? 'Loading venues…' : error ? error : `Showing ${filtered.length} of ${venues.length} venues — ${sortLabel}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {capacityKey !== 'any' && (
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-700">
              {capacityLabel}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="-mr-1 text-amber-700"
                onClick={() => {
                  setCapacityKey('any');
                  setPage(1);
                }}
              >
                <X className="size-3" />
              </Button>
            </span>
          )}
          {query.trim() && (
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700">
              {`"${query.trim()}"`}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="-mr-1 text-neutral-600"
                onClick={() => {
                  setQuery('');
                  setPage(1);
                }}
              >
                <X className="size-3" />
              </Button>
            </span>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="xs" className="text-neutral-500" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-[24px] bg-neutral-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      ) : paged.length === 0 ? (
        <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.45)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  {hasActiveFilters ? <Search className="size-4" /> : <Building2 className="size-4" />}
                </span>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-700 uppercase">
                  {hasActiveFilters ? 'No matching venues' : 'Empty portfolio'}
                </p>
              </div>

              <h3 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-neutral-950">
                {hasActiveFilters ? 'No venue fits this filter set.' : 'Start the venue portfolio with the first space.'}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
                {hasActiveFilters
                  ? 'Adjust the search or capacity filter to widen the result set, then keep scanning from the same catalog view.'
                  : 'Add a community suggestion or official partner venue so event planning can move from blank slate to bookable inventory.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild variant="amber" className="rounded-xl">
                  <Link href={ADMIN_OPERATIONS_PATHS.venueCreate}>
                    <Plus className="size-4" />
                    Add venue
                  </Link>
                </Button>
                {hasActiveFilters && (
                  <Button type="button" variant="outline" className="rounded-xl" onClick={clearFilters}>
                    <X className="size-4" />
                    Clear filters
                  </Button>
                )}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ['Required', 'Name, address, capacity'],
                  ['Media', 'Venue image upload'],
                  ['Contact', 'Lead contact details']
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">{label}</p>
                    <p className="mt-1 text-sm font-medium text-neutral-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-neutral-950 p-6 text-white lg:border-t-0 lg:border-l">
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-300 uppercase">Next best action</p>
                  <p className="text-sm leading-6 text-white/70">
                    Create one complete venue record first. The catalog will immediately unlock filtering, detail review, edit, image, and delete workflows.
                  </p>
                </div>
                <div className="space-y-3">
                  {['Capture the space', 'Attach operational details', 'Use it in event planning'].map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-300 text-xs font-semibold text-neutral-950">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-white/90">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-4">
          {paged.map((venue, index) => (
            <div key={venue.id} className="contents">
              {index === 3 && paged.length > 3 ? (
                <Card className="border-0 bg-white py-0 shadow-none ring-1 ring-neutral-200 xl:col-span-4">
                  <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_auto] md:items-center">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-amber-700 uppercase">Community growth</p>
                      <h3 className="text-xl font-semibold text-neutral-950">Know a venue we should highlight?</h3>
                      <p className="text-sm leading-6 text-neutral-600">
                        Add a new space to the Eventara portfolio so the team can review it and bring it into upcoming programming.
                      </p>
                    </div>
                    <Button asChild size="lg" variant="amber" className="h-11 rounded-xl">
                      <Link href={ADMIN_OPERATIONS_PATHS.venueCreate}>Contribute venue</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              <CatalogCard
                title={venue.name}
                subtitle={[venue.city, venue.province].filter(Boolean).join(', ')}
                photo={venuePhoto(venue)}
                description={venue.description ?? 'No description provided.'}
                href={ADMIN_OPERATIONS_PATHS.venueDetail(venue.id)}
                editHref={ADMIN_OPERATIONS_PATHS.venueEdit(venue.id)}
                badges={[venue.venue_type, ...(venue.is_partner ? ['Partner'] : [])]}
                specs={[
                  { label: 'Location', value: [venue.city, venue.province].filter(Boolean).join(', '), icon: <MapPin className="size-3.5" /> },
                  {
                    label: 'Venue type',
                    value: venue.venue_type.charAt(0).toUpperCase() + venue.venue_type.slice(1),
                    icon: <Building2 className="size-3.5" />
                  },
                  { label: 'Capacity', value: `${venue.capacity.toLocaleString()} guests`, icon: <Users className="size-3.5" /> }
                ]}
                tags={venue.amenities ?? []}
              />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ArrowLeft className="size-4" />
            Prev
          </Button>
          {pageNumbers.map((n) => (
            <Button key={n} variant={n === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setPage(n)}>
              {n}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
