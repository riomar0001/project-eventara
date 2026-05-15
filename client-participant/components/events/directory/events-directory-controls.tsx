'use client';

import { useState, useRef, useEffect } from 'react';
import type { EventCategory, SortOption } from '@/types/event-directory';
import { Icon } from './icon';

interface EventsDirectoryControlsProps {
  q: string;
  onQChange: (v: string) => void;
  cat: string;
  onCatChange: (c: string) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  categories: EventCategory[];
  counts: Record<string, number>;
}

const pillInactive = 'border-line bg-transparent text-text-dim';
const pillActive = 'border--lime bg-lime text-white font-semibold shadow-[0_0_0_4px_oklch(0.7_0.2_130_/_0.12)]';

export function EventsDirectoryControls({ q, onQChange, cat, onCatChange, sort, onSortChange, categories, counts }: EventsDirectoryControlsProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const sortLabel = sort === 'date' ? 'By date' : sort === 'popularity' ? 'Popularity' : 'Availability';

  return (
    <>
      {/* Search row */}
      <div className="events-dir-search-row mt-2 grid grid-cols-[1fr_auto] items-center gap-[14px]">
        <div
          className="border-line-soft bg-surface relative rounded-[14px] border transition-all"
          onFocus={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = 'oklch(0.7 0.2 130)';
            el.style.boxShadow = '0 0 0 4px oklch(0.7 0.2 130 / 0.15)';
            el.style.background = 'oklch(0.975 0.005 150)';
          }}
          onBlur={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = '';
            el.style.boxShadow = '';
            el.style.background = '';
          }}
        >
          <span className="text-text-mute absolute top-1/2 left-[18px] -translate-y-1/2">
            <Icon name="search" size={18} />
          </span>
          <input
            className="text-text w-full border-none bg-transparent py-[18px] pr-[18px] pl-[52px] text-[15.5px] tracking-[-0.01em] outline-none"
            placeholder="Search events, venues, tags…"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
          />
          <span className="border-line-soft bg-page text-text-mute absolute top-1/2 right-[14px] -translate-y-1/2 rounded-[6px] border px-2 py-1 font-mono text-[10.5px]">
            ⌘ K
          </span>
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            className="border-line-soft bg-surface text-text flex h-[56px] min-w-[180px] items-center gap-[10px] rounded-[14px] border px-[18px] text-[14px] transition-colors"
            onClick={() => setSortOpen((o) => !o)}
          >
            <span className="text-text-mute font-mono text-[10.5px] tracking-[0.14em] uppercase">Sort</span>
            <span className="font-medium">{sortLabel}</span>
            <Icon name="chevron-down" size={14} />
          </button>

          {sortOpen && (
            <div className="border-line bg-surface absolute right-0 z-50 mt-[6px] min-w-[200px] rounded-[12px] border p-[6px] shadow-[0_20px_60px_-20px_oklch(0_0_0_/_0.5)]">
              {(
                [
                  ['date', 'By date'],
                  ['popularity', 'Most popular'],
                  ['availability', 'Most available']
                ] as const
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  className={`flex w-full items-center justify-between rounded-[8px] px-3 py-[10px] text-left text-[13px] transition-colors ${sort === k ? 'text-lime' : 'text-text-dim'}`}
                  onClick={() => {
                    onSortChange(k);
                    setSortOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'oklch(1 0 0 / 0.04)';
                    (e.currentTarget as HTMLElement).style.color = 'oklch(0.2 0.012 150)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '';
                    (e.currentTarget as HTMLElement).style.color = sort === k ? 'oklch(0.7 0.2 130)' : '';
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="mt-[22px] flex flex-wrap items-center gap-[10px]">
        {categories.map((c) => (
          <button
            key={c.key}
            className={`inline-flex items-center gap-2 rounded-full border px-[18px] py-[9px] text-[13px] font-medium transition-all ${cat === c.key ? pillActive : pillInactive}`}
            onClick={() => onCatChange(c.key)}
            onMouseEnter={(e) => {
              if (cat !== c.key) {
                (e.currentTarget as HTMLElement).style.color = 'oklch(0.2 0.012 150)';
                (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.58 0.012 150)';
              }
            }}
            onMouseLeave={(e) => {
              if (cat !== c.key) {
                (e.currentTarget as HTMLElement).style.color = '';
                (e.currentTarget as HTMLElement).style.borderColor = '';
              }
            }}
          >
            {c.label}
            <span
              className={`rounded-[4px] px-[6px] py-[2px] font-mono text-[10.5px] ${cat === c.key ? 'bg-[oklch(0_0_0_/_0.15)] text-white' : 'bg-[oklch(1_0_0_/_0.06)]'}`}
            >
              {counts[c.key] ?? 0}
            </span>
          </button>
        ))}

        <div className="bg--line-soft mx-1 h-6 w-px" />

        {['This month', 'Free', 'Members only'].map((label) => (
          <button
            key={label}
            className={`inline-flex items-center gap-2 rounded-full border px-[18px] py-[9px] text-[13px] font-medium transition-all ${pillInactive}`}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'oklch(0.2 0.012 150)';
              (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.58 0.012 150)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '';
              (e.currentTarget as HTMLElement).style.borderColor = '';
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
