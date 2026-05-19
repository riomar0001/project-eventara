'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EventsDirectoryCard } from '@/components/events/directory/events-directory-card';
import { EventsDirectoryControls } from '@/components/events/directory/events-directory-controls';
import { EventsDirectoryFeatured } from '@/components/events/directory/events-directory-featured';
import { EventsDirectoryPagination } from '@/components/events/directory/events-directory-pagination';
import { Icon } from '@/components/events/directory/icon';
import { Footer } from '@/components/footer/footer';
import { Navbar } from '@/components/navigation/navbar';
import type { DirectoryEvent, SortOption, ViewMode, TweaksConfig, FeaturedEvent } from '@/types/event-directory';
import { useEventsDirectory } from '@/hooks/events/use-events-directory';
import { useHomeEvents } from '@/hooks/events/use-home-events';
import type { HomeEventRecord } from '@/hooks/events/use-home-events';

const TWEAKS_DEFAULTS: TweaksConfig = { density: 'comfortable', bannerVariant: 'featured', badgeStyle: 'floating' };
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const ORBS: Array<'lime' | 'amber'> = ['lime', 'amber'];
const ANGLES = ['115deg', '130deg', '145deg', '160deg', '175deg', '190deg'];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toDirectoryEvent(record: HomeEventRecord, index: number): DirectoryEvent {
  const start = new Date(record.start_date);
  const session = record.sessions[0];
  const venue = session
    ? [session.venue_name, session.venue_location].filter(Boolean).join(', ')
    : 'TBD';
  const time = session
    ? new Date(session.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'TBD';
  const maxSlots = session?.max_slots ?? 0;
  const statusMap: Record<string, DirectoryEvent['status']> = {
    started: 'live',
    posted: 'new',
  };

  return {
    id: record.id,
    day: String(start.getDate()).padStart(2, '0'),
    mo: MONTHS[start.getMonth()],
    year: start.getFullYear(),
    date: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time,
    title: record.title,
    desc: stripHtml(record.description),
    venue,
    cat: 'Event',
    tags: [],
    seats: maxSlots,
    total: maxSlots || 1,
    status: statusMap[record.status] ?? null,
    orb: ORBS[index % ORBS.length],
    angle: ANGLES[index % ANGLES.length],
    banner_url: record.banner_url ?? null,
  };
}

function toLiveEventFeatured(record: HomeEventRecord): FeaturedEvent {
  const session = record.sessions[0];
  const start = new Date(record.start_date);
  const venue = session
    ? [session.venue_name, session.venue_location].filter(Boolean).join(', ')
    : 'TBD';
  const time = session
    ? new Date(session.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'TBD';

  return {
    tag: 'LIVE NOW',
    title: record.title,
    desc: stripHtml(record.description).slice(0, 200),
    date: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time,
    venue,
    banner_url: record.banner_url ?? null,
  };
}

const SINGLE_CAT = [{ key: 'All', label: 'All Events' }];

export default function EventsPage() {
  const router = useRouter();
  const [tweaks, setTweaks] = useState<TweaksConfig>(TWEAKS_DEFAULTS);
  const [editMode, setEditMode] = useState(false);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [sort, setSort] = useState<SortOption>('date');
  const [view, setView] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);

  const PER_PAGE = tweaks.density === 'compact' ? 8 : 6;

  // Debounce search query by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const { events, total, totalPages, loading, error } = useEventsDirectory({ q: debouncedQ, page, pageSize: PER_PAGE });
  const { data: homeData } = useHomeEvents();

  const liveEvent: HomeEventRecord | null = homeData?.live_event
    ? { ...homeData.live_event.event, sessions: homeData.live_event.sessions }
    : null;

  const directoryEvents = useMemo<DirectoryEvent[]>(
    () => events.map((ev, i) => toDirectoryEvent(ev, i)),
    [events]
  );

  const counts = useMemo(() => ({ All: total }), [total]);

  const handleOpen = useCallback((id: string) => {
    router.push(`/events/${id}`);
  }, [router]);

  const handleOpenFeatured = useCallback(() => {
    if (liveEvent) router.push(`/events/${liveEvent.id}`);
  }, [liveEvent, router]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const t = e.data?.type;
      if (t === '__activate_edit_mode') setEditMode(true);
      if (t === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*');
  }, [tweaks]);

  useEffect(() => {
    const id = 'badge-style';
    let sheet = document.getElementById(id) as HTMLStyleElement | null;
    if (!sheet) {
      sheet = document.createElement('style');
      sheet.id = id;
      document.head.appendChild(sheet);
    }
    sheet.textContent =
      tweaks.badgeStyle === 'lime'
        ? '.date-badge{background:var(--lime)!important;border-color:var(--lime)!important}.date-badge .mo,.date-badge .day{color:#0a1005!important}'
        : '';
  }, [tweaks.badgeStyle]);

  const showFeatured = tweaks.bannerVariant === 'featured' && liveEvent;
  const featuredData = liveEvent ? toLiveEventFeatured(liveEvent) : null;

  return (
    <main className="bg-background text-foreground">
      <Navbar />
      <div className="relative">
        {/* Page mesh background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-220px] left-[-180px] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,oklch(0.7_0.2_130_/_0.22),transparent_65%)] blur-[90px]" />
          <div className="absolute top-[-120px] right-[-140px] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,oklch(0.62_0.16_60_/_0.18),transparent_65%)] blur-[90px]" />
          <div className="absolute inset-0 bg-[linear-gradient(var(--line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--line-soft)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_30%,transparent_75%)] bg-[length:64px_64px] opacity-35 [-webkit-mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_30%,transparent_75%)]" />
        </div>

        <div className="events-dir-container relative z-[1] mx-auto max-w-[1240px] px-8">
          <header className="relative pt-16 pb-9">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <span className="text-muted-foreground inline-flex items-center gap-2.5 font-mono text-xs tracking-widest uppercase">
                  <span className="bg-primary h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)]" />
                  EVENT DIRECTORY
                </span>
                <h1 className="text-foreground mx-0 my-[18px] text-[clamp(42px,5.5vw,72px)] leading-none font-bold tracking-[-0.035em]">Discover Events</h1>
                <p className="text-muted-foreground m-0 mb-9 max-w-[58ch] text-[16px] leading-[1.55]">
                  Browse upcoming workshops, meetups and hackathons across the community.
                </p>
              </div>
              <div className="text-right max-sm:text-left">
                <div className="text-primary font-mono text-[40px] leading-none font-semibold tracking-[-0.03em]">
                  {loading ? '--' : String(total).padStart(2, '0')}
                </div>
                <div className="text-muted-foreground mt-[2px] font-mono text-[11px] tracking-[0.18em] uppercase">Active listings</div>
              </div>
            </div>

            <EventsDirectoryControls
              q={q}
              onQChange={(v) => setQ(v)}
              cat="All"
              onCatChange={() => {}}
              sort={sort}
              onSortChange={(s) => setSort(s)}
              categories={SINGLE_CAT}
              counts={counts}
            />

            {showFeatured && featuredData && (
              <EventsDirectoryFeatured featured={featuredData} onOpen={handleOpenFeatured} />
            )}
          </header>

          <section>
            <div className="mt-14 mb-[22px] flex flex-wrap items-end justify-between gap-6">
              <div>
                <h3 className="text-foreground m-0 text-[24px] font-semibold tracking-[-0.02em]">All events</h3>
                <div className="text-muted-foreground mt-1 font-mono text-[12px]">
                  {loading ? 'Loading…' : (
                    <>
                      {total} result{total !== 1 ? 's' : ''}
                      {debouncedQ && (
                        <>
                          <span> · query </span>
                          <span className="text-primary">&quot;{debouncedQ}&quot;</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="border-border flex gap-[2px] rounded-[10px] border p-[3px]">
                <button
                  className={`flex items-center gap-[6px] rounded-[7px] px-[10px] py-[7px] text-[12px] transition-all ${view === 'grid' ? 'bg-card text-foreground shadow-[0_0_0_1px_var(--line-soft)]' : 'text-muted-foreground'}`}
                  onClick={() => setView('grid')}
                >
                  <Icon name="grid" size={13} /> Grid
                </button>
                <button
                  className={`flex items-center gap-[6px] rounded-[7px] px-[10px] py-[7px] text-[12px] transition-all ${view === 'list' ? 'bg-card text-foreground shadow-[0_0_0_1px_var(--line-soft)]' : 'text-muted-foreground'}`}
                  onClick={() => setView('list')}
                >
                  <Icon name="list" size={13} /> List
                </button>
              </div>
            </div>

            <div
              className={`events-dir-grid grid gap-[22px] ${view === 'list' ? 'grid-cols-1' : tweaks.density === 'compact' ? 'grid-cols-4' : 'grid-cols-3'}`}
            >
              {loading ? (
                Array.from({ length: PER_PAGE }).map((_, i) => (
                  <div key={i} className="border-border bg-card animate-pulse rounded-[20px] border" style={{ minHeight: 340 }} />
                ))
              ) : error ? (
                <div className="border-border bg-muted/10 col-span-full rounded-[20px] border border-dashed px-10 py-20 text-center">
                  <p className="text-muted-foreground m-0 text-[14px]">{error}</p>
                </div>
              ) : directoryEvents.length === 0 ? (
                <div className="border-border bg-muted/10 col-span-full rounded-[20px] border border-dashed px-10 py-20 text-center">
                  <div className="bg-muted text-muted-foreground mx-auto mb-[18px] grid h-14 w-14 place-items-center rounded-[16px]">
                    <Icon name="search" size={22} />
                  </div>
                  <h4 className="text-foreground m-0 mb-[6px] text-[20px] font-semibold tracking-[-0.02em]">No events match your search</h4>
                  <p className="text-muted-foreground m-0 text-[14px]">Try a broader search term.</p>
                </div>
              ) : (
                directoryEvents.map((ev) => <EventsDirectoryCard key={ev.id} ev={ev} onOpen={handleOpen} />)
              )}
            </div>
          </section>

          {!loading && total > 0 && (
            <EventsDirectoryPagination
              currentPage={page}
              totalPages={totalPages}
              filteredLength={total}
              perPage={PER_PAGE}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      <Footer />

      {editMode && (
        <div className="border-border bg-card fixed right-5 bottom-5 z-80 w-[280px] animate-[modal-pop_200ms_ease] rounded-[16px] border p-4 text-[13px] shadow-[0_20px_60px_-20px_oklch(0_0_0_/_0.5)]">
          <h4 className="m-0 mb-3 flex items-center gap-2 text-[13px] font-semibold">
            <span className="bg-primary h-[6px] w-[6px] rounded-full" />
            Tweaks
            <button className="text-muted-foreground ml-auto" onClick={() => setEditMode(false)}>
              <Icon name="x" size={14} />
            </button>
          </h4>
          {[
            {
              label: 'Grid density',
              value: tweaks.density,
              onChange: (v: string) => setTweaks({ ...tweaks, density: v as TweaksConfig['density'] }),
              options: [
                { v: 'comfortable', l: 'Comfortable (3)' },
                { v: 'compact', l: 'Compact (4)' }
              ]
            },
            {
              label: 'Featured banner',
              value: tweaks.bannerVariant,
              onChange: (v: string) => setTweaks({ ...tweaks, bannerVariant: v as TweaksConfig['bannerVariant'] }),
              options: [
                { v: 'featured', l: 'Show banner' },
                { v: 'hidden', l: 'Hide banner' }
              ]
            },
            {
              label: 'Date badge',
              value: tweaks.badgeStyle,
              onChange: (v: string) => setTweaks({ ...tweaks, badgeStyle: v as TweaksConfig['badgeStyle'] }),
              options: [
                { v: 'floating', l: 'Floating (dark)' },
                { v: 'lime', l: 'Solid lime' }
              ]
            }
          ].map(({ label, value, onChange, options }) => (
            <div key={label} className="border-border flex items-center justify-between gap-[10px] border-t py-2">
              <label className="text-muted-foreground text-[12.5px]">{label}</label>
              <select
                className="border-border bg-background text-foreground rounded-[6px] border px-[6px] py-1 text-[12px]"
                value={value}
                onChange={(e) => onChange(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) { .events-dir-grid{grid-template-columns:repeat(2,1fr)!important} }
        @media (max-width: 700px) { .events-dir-grid{grid-template-columns:1fr!important} .events-dir-search-row{grid-template-columns:1fr!important} .events-dir-container{padding:0 18px!important} }
      `}</style>
    </main>
  );
}
