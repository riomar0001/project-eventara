'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import { MobileFloatingAction, PrimaryPageAction } from '@/components/admin/shared/primary-page-action';
import { CatalogCard, OperationsPageIntro } from './venues-shared';
import { ADMIN_OPERATIONS_PATHS, getEventsByVenueId, venueRecords } from '@/constants/admin/operations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  { key: 'status', label: 'Status (A–Z)' }
];

export function VenuesCatalog() {
  const activeVenueCount = venueRecords.filter((venue) => venue.status === 'Active').length;
  const totalCapacity = venueRecords.reduce((sum, venue) => sum + venue.capacity, 0);
  const [query, setQuery] = useState('');
  const [capacityKey, setCapacityKey] = useState('any');
  const [sortKey, setSortKey] = useState('name');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const capacityMin = CAPACITY_FILTERS.find((option) => option.key === capacityKey)?.min ?? 0;

    return venueRecords
      .filter((venue) => (capacityMin ? venue.capacity >= capacityMin : true))
      .filter((venue) => {
        if (!lowerQuery) return true;
        const haystack = [
          venue.name,
          venue.neighborhood,
          venue.city,
          venue.venueType,
          venue.status,
          venue.setting,
          venue.tags.join(' ')
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(lowerQuery);
      })
      .sort((a, b) => {
        if (sortKey === 'capacity') return b.capacity - a.capacity;
        if (sortKey === 'city') return a.city.localeCompare(b.city);
        if (sortKey === 'status') return a.status.localeCompare(b.status);
        return a.name.localeCompare(b.name);
      });
  }, [capacityKey, query, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const capacityLabel = CAPACITY_FILTERS.find((option) => option.key === capacityKey)?.label ?? 'Any size';
  const sortLabel = SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? 'Name (A-Z)';

  useEffect(() => {
    setPage(1);
  }, [capacityKey, query, sortKey]);

  useEffect(() => {
    if (currentPage !== page) setPage(currentPage);
  }, [currentPage, page]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <MobileFloatingAction cta="Add venue" href={ADMIN_OPERATIONS_PATHS.venueCreate} theme="amber" />

      <OperationsPageIntro
        eyebrow="Venue Portfolio"
        title="Venue Management"
        description="Shape the event footprint from a single cinematic surface, with venue health, capacity, and booking readiness visible before you ever open a detail page."
        metrics={[
          {
            label: 'Live venues',
            value: activeVenueCount,
            hint: 'Spaces currently presented as active in the mock admin catalog.'
          },
          {
            label: 'Portfolio capacity',
            value: totalCapacity.toLocaleString(),
            hint: 'Combined guest capacity across the current venue preview set.'
          },
          {
            label: 'Event-ready spaces',
            value: venueRecords.filter((venue) => getEventsByVenueId(venue.id).length > 0).length,
            hint: 'Venues already connected to sample events in this UI-only flow.'
          }
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
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search venues, tags, or neighborhoods"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 pl-9"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Capacity</p>
          <Select value={capacityKey} onValueChange={setCapacityKey}>
            <SelectTrigger className="w-full" size="default">
              <SelectValue placeholder="Select capacity" />
            </SelectTrigger>
            <SelectContent align="start">
              {CAPACITY_FILTERS.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Sort by</p>
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-full" size="default">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent align="start">
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
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
          <p className="text-sm text-neutral-500">Showing {filtered.length} of {venueRecords.length} venues - {sortLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {capacityKey !== 'any' && (
            <Badge variant="outline" className="h-7 gap-2 border-amber-200 bg-amber-50 text-amber-700">
              {capacityLabel}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="-mr-1 text-amber-700"
                onClick={() => setCapacityKey('any')}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          )}
          {query.trim() && (
            <Badge variant="outline" className="h-7 gap-2 border-neutral-200 bg-white text-neutral-700">
              {`"${query.trim()}"`}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="-mr-1 text-neutral-600"
                onClick={() => setQuery('')}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          )}
          {(capacityKey !== 'any' || query.trim()) && (
            <Button variant="ghost" size="xs" className="text-neutral-500" onClick={() => { setCapacityKey('any'); setQuery(''); }}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        {paged.map((venue, index) => (
          <div key={venue.id} className="contents">
            {index === 3 && paged.length > 3 ? (
              <Card className="xl:col-span-4 border-0 bg-white py-0 shadow-none ring-1 ring-neutral-200">
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
              subtitle={venue.neighborhood}
              photo={venue.photo}
              description={venue.summary}
              href={ADMIN_OPERATIONS_PATHS.venueDetail(venue.id)}
              editHref={ADMIN_OPERATIONS_PATHS.venueEdit(venue.id)}
              badges={[venue.status, venue.setting, venue.venueType]}
              meta={[
                {
                  label: 'Capacity',
                  value: `${venue.capacity} guests`
                },
                {
                  label: 'Event use',
                  value: `${getEventsByVenueId(venue.id).length} sample events`
                },
                {
                  label: 'Location',
                  value: venue.city
                },
                {
                  label: 'Booking window',
                  value: venue.bookingWindow
                }
              ]}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            <ArrowLeft className="size-4" />
            Prev
          </Button>
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
