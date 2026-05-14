'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { EventsDirectoryCard } from '@/components/events/directory/events-directory-card';
import { EventsDirectoryControls } from '@/components/events/directory/events-directory-controls';
import { EventsDirectoryFeatured } from '@/components/events/directory/events-directory-featured';
import { EventsDirectoryPagination } from '@/components/events/directory/events-directory-pagination';
import { Icon } from '@/components/events/directory/icon';
import { Footer } from '@/components/footer/footer';
import { EventsDirectoryModal } from '@/components/modals/events-directory-modal';
import { Navbar } from '@/components/navigation/navbar';
import type { DirectoryEvent, SortOption, ViewMode, TweaksConfig } from '@/types/event-directory';
import { ALL_EVENTS, CATEGORIES, FEATURED } from '@/constants/events-directory';

const TWEAKS_DEFAULTS: TweaksConfig = { density: 'comfortable', bannerVariant: 'featured', badgeStyle: 'floating' };

const MONTH_IDX: Record<string, number> = { JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11 };

export default function EventsPage() {
  const [tweaks, setTweaks] = useState<TweaksConfig>(TWEAKS_DEFAULTS);
  const [editMode, setEditMode] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState<SortOption>('date');
  const [view, setView] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<DirectoryEvent | null>(null);

  const PER_PAGE = tweaks.density === 'compact' ? 8 : 6;

  useEffect(() => {
    const onMsg = (e: MessageEvent) => { const t = e.data?.type; if (t === '__activate_edit_mode') setEditMode(true); if (t === '__deactivate_edit_mode') setEditMode(false); };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*'); }, [tweaks]);

  useEffect(() => {
    const id = 'badge-style';
    let sheet = document.getElementById(id) as HTMLStyleElement | null;
    if (!sheet) { sheet = document.createElement('style'); sheet.id = id; document.head.appendChild(sheet); }
    sheet.textContent = tweaks.badgeStyle === 'lime'
      ? '.date-badge{background:var(--lime)!important;border-color:var(--lime)!important}.date-badge .mo,.date-badge .day{color:#0a1005!important}'
      : '';
  }, [tweaks.badgeStyle]);

  const filtered = useMemo(() => {
    let list = ALL_EVENTS.slice();
    if (cat !== 'All') list = list.filter((e) => e.cat === cat);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(needle) || e.venue.toLowerCase().includes(needle) || e.tags.some((t) => t.toLowerCase().includes(needle)) || e.cat.toLowerCase().includes(needle));
    }
    list.sort((a, b) => {
      if (sort === 'date') return new Date(a.year, MONTH_IDX[a.mo], +a.day).getTime() - new Date(b.year, MONTH_IDX[b.mo], +b.day).getTime();
      if (sort === 'popularity') return b.total - b.seats - (a.total - a.seats);
      if (sort === 'availability') return b.seats - a.seats;
      return 0;
    });
    return list;
  }, [q, cat, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const counts = useMemo(() => {
    const obj: Record<string, number> = { All: ALL_EVENTS.length };
    for (const c of CATEGORIES) { if (c.key !== 'All') obj[c.key] = ALL_EVENTS.filter((e) => e.cat === c.key).length; }
    return obj;
  }, []);

  const changeCat = useCallback((c: string) => { setCat(c); setPage(1); }, []);
  const changeQ = useCallback((v: string) => { setQ(v); setPage(1); }, []);

  const openFeatured = useCallback(() => {
    setDetail({ id: 0, day: '12', mo: 'DEC', year: 2026, date: FEATURED.date, time: FEATURED.time, title: FEATURED.title, desc: FEATURED.desc, venue: FEATURED.venue, cat: 'Meetups', tags: ['Gala', 'Featured'], seats: 80, total: 300, status: null, orb: 'amber', angle: '115deg' });
  }, []);

  return (
    <main className="bg-background text-foreground">
      <Navbar />
      <div className="relative">
        {/* Page mesh background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-220px] left-[-180px] h-[640px] w-[640px] rounded-full blur-[90px] bg-[radial-gradient(circle,oklch(0.7_0.2_130_/_0.22),transparent_65%)]" />
          <div className="absolute top-[-120px] right-[-140px] h-[540px] w-[540px] rounded-full blur-[90px] bg-[radial-gradient(circle,oklch(0.62_0.16_60_/_0.18),transparent_65%)]" />
          <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)' }} />
        </div>

        <div className="events-dir-container relative z-[1] mx-auto max-w-[1240px] px-8">
          <header className="relative pt-16 pb-9">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <span className="inline-flex items-center gap-2.5 font-mono text-xs tracking-widest text-muted-foreground uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--lime-glow)]" />
                  EVENT DIRECTORY · APR–JUL 2026
                </span>
                <h1 className="mx-0 my-[18px] leading-none font-bold tracking-[-0.035em] text-foreground" style={{ fontSize: 'clamp(42px, 5.5vw, 72px)' }}>Discover Events</h1>
                <p className="m-0 mb-9 max-w-[58ch] text-[16px] leading-[1.55] text-muted-foreground">Browse {ALL_EVENTS.length} upcoming workshops, meetups and hackathons across the Davao DeFi community.</p>
              </div>
              <div className="text-right max-sm:text-left">
                <div className="font-mono text-[40px] leading-none font-semibold tracking-[-0.03em] text-primary">{String(ALL_EVENTS.length).padStart(2, '0')}</div>
                <div className="mt-[2px] font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground">Active listings</div>
              </div>
            </div>

            <EventsDirectoryControls q={q} onQChange={changeQ} cat={cat} onCatChange={changeCat} sort={sort} onSortChange={(s) => setSort(s)} categories={CATEGORIES} counts={counts} />

            {tweaks.bannerVariant === 'featured' && <EventsDirectoryFeatured featured={FEATURED} onOpen={openFeatured} />}
          </header>

          <section>
            <div className="mt-14 mb-[22px] flex flex-wrap items-end justify-between gap-6">
              <div>
                <h3 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-foreground">{cat === 'All' ? 'All events' : cat}</h3>
                <div className="mt-1 font-mono text-[12px] text-muted-foreground">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  {q && <><span> · query </span><span className="text-primary">&quot;{q}&quot;</span></>}
                </div>
              </div>
              <div className="flex gap-[2px] rounded-[10px] border border-border p-[3px]">
                <button
                  className={`flex items-center gap-[6px] rounded-[7px] px-[10px] py-[7px] text-[12px] transition-all ${view === 'grid' ? 'bg-card text-foreground shadow-[0_0_0_1px_var(--line-soft)]' : 'text-muted-foreground'}`}
                  onClick={() => setView('grid')}>
                  <Icon name="grid" size={13} /> Grid
                </button>
                <button
                  className={`flex items-center gap-[6px] rounded-[7px] px-[10px] py-[7px] text-[12px] transition-all ${view === 'list' ? 'bg-card text-foreground shadow-[0_0_0_1px_var(--line-soft)]' : 'text-muted-foreground'}`}
                  onClick={() => setView('list')}>
                  <Icon name="list" size={13} /> List
                </button>
              </div>
            </div>

            <div className="events-dir-grid grid gap-[22px]" style={{ gridTemplateColumns: view === 'list' ? '1fr' : tweaks.density === 'compact' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
              {paged.length === 0 ? (
                <div className="col-span-full rounded-[20px] border border-dashed border-border bg-muted/10 px-10 py-20 text-center">
                  <div className="mx-auto mb-[18px] grid h-14 w-14 place-items-center rounded-[16px] bg-muted text-muted-foreground">
                    <Icon name="search" size={22} />
                  </div>
                  <h4 className="m-0 mb-[6px] text-[20px] font-semibold tracking-[-0.02em] text-foreground">No events match your filters</h4>
                  <p className="m-0 text-[14px] text-muted-foreground">Try a broader search or reset your category selection.</p>
                </div>
              ) : (
                paged.map((ev) => <EventsDirectoryCard key={ev.id} ev={ev} onOpen={setDetail} />)
              )}
            </div>
          </section>

          {filtered.length > 0 && <EventsDirectoryPagination currentPage={currentPage} totalPages={totalPages} filteredLength={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />}
        </div>
      </div>

      <Footer />

      {detail && <EventsDirectoryModal ev={detail} onClose={() => setDetail(null)} />}

      {editMode && (
        <div className="fixed right-5 bottom-5 z-80 w-[280px] rounded-[16px] border border-border bg-card p-4 text-[13px] shadow-lg" style={{ boxShadow: '0 20px 60px -20px oklch(0 0 0 / 0.5)', animation: 'modal-pop 200ms ease' }}>
          <h4 className="m-0 mb-3 flex items-center gap-2 text-[13px] font-semibold">
            <span className="h-[6px] w-[6px] rounded-full bg-primary" />
            Tweaks
            <button className="ml-auto text-muted-foreground" onClick={() => setEditMode(false)}><Icon name="x" size={14} /></button>
          </h4>
          {[
            { label: 'Grid density', value: tweaks.density, onChange: (v: string) => setTweaks({ ...tweaks, density: v as TweaksConfig['density'] }), options: [{ v: 'comfortable', l: 'Comfortable (3)' }, { v: 'compact', l: 'Compact (4)' }] },
            { label: 'Featured banner', value: tweaks.bannerVariant, onChange: (v: string) => setTweaks({ ...tweaks, bannerVariant: v as TweaksConfig['bannerVariant'] }), options: [{ v: 'featured', l: 'Show banner' }, { v: 'hidden', l: 'Hide banner' }] },
            { label: 'Date badge', value: tweaks.badgeStyle, onChange: (v: string) => setTweaks({ ...tweaks, badgeStyle: v as TweaksConfig['badgeStyle'] }), options: [{ v: 'floating', l: 'Floating (dark)' }, { v: 'lime', l: 'Solid lime' }] }
          ].map(({ label, value, onChange, options }) => (
            <div key={label} className="flex items-center justify-between gap-[10px] border-t border-border py-2">
              <label className="text-[12.5px] text-muted-foreground">{label}</label>
              <select className="rounded-[6px] border border-border bg-background px-[6px] py-1 text-[12px] text-foreground" value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
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
