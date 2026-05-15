/**
 * Action Bar - Search, filters, and add venue button
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { CAPACITY_FILTERS } from '@/constants/capacity-filters';
import { SORT_OPTIONS } from '@/constants/sort-options';

interface ActionBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  capacityKey: string;
  onCapacityChange: (key: string) => void;
  sortKey: string;
  onSortChange: (key: string) => void;
  onAddVenue: () => void;
}

export function ActionBar({ query, onQueryChange, capacityKey, onCapacityChange, sortKey, onSortChange, onAddVenue }: ActionBarProps) {
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const capacityRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!capacityOpen && !sortOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (capacityRef.current && !capacityRef.current.contains(e.target as Node)) setCapacityOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [capacityOpen, sortOpen]);

  const handleCapacitySelect = (key: string) => {
    onCapacityChange(key);
    setCapacityOpen(false);
  };

  const handleSortSelect = (key: string) => {
    onSortChange(key);
    setSortOpen(false);
  };

  return (
    <div className="px-8 py-6">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Icon name="search" size={16} className="text-text-mute absolute top-1/2 left-[18px] -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search venues, locations..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-line-soft bg-surface text-text placeholder-text-mute focus:border-lime focus:bg-surface-2 h-14 w-full rounded-[14px] border py-4 pr-[18px] pl-[52px] text-[15px] transition-all focus:ring-4 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
            />
          </div>

          {/* Capacity Filter Dropdown */}
          <div ref={capacityRef} className="relative">
            <button
              onClick={() => setCapacityOpen(!capacityOpen)}
              className="border-line-soft bg-surface hover:border-text-mute flex h-14 min-w-[180px] items-center justify-between gap-2 rounded-[14px] border px-[18px] py-4 text-sm transition-all"
            >
              <div className="flex flex-row items-center gap-1.5">
                <span className="text-text-mute font-mono text-[10.5px] tracking-[0.14em] uppercase">Capacity</span>
                <span className="text-text text-[14px] font-medium">{CAPACITY_FILTERS.find((f) => f.key === capacityKey)?.label || 'Any'}</span>
              </div>
              <Icon name="chevronDown" size={14} className="text-text-mute flex items-center" />
            </button>

            {/* Capacity Dropdown Menu */}
            {capacityOpen && (
              <div className="border-line bg-surface absolute top-[calc(100%_+_8px)] right-0 z-50 min-w-[220px] overflow-hidden rounded-[12px] border p-[6px] shadow-[0_20px_60px_-20px_oklch(0_0_0_/_0.5)]">
                {CAPACITY_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleCapacitySelect(filter.key)}
                    className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-[13px] transition-all ${
                      capacityKey === filter.key ? 'text-lime bg-[oklch(1_0_0_/_0.04)]' : 'text-text-dim hover:text-text hover:bg-[oklch(1_0_0_/_0.04)]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="border-line-soft bg-surface hover:border-text-mute flex h-14 min-w-[180px] items-center justify-between gap-2 rounded-[14px] border px-[18px] py-4 text-sm transition-all"
            >
              <div className="flex flex-row items-center gap-1.5">
                <span className="text-text-mute font-mono text-[10.5px] tracking-[0.14em] uppercase">Sort</span>
                <span className="text-text text-[14px] font-medium">{SORT_OPTIONS.find((o) => o.key === sortKey)?.label || 'Rating'}</span>
              </div>
              <Icon name="chevronDown" size={14} className="text-text-mute flex items-center" />
            </button>

            {/* Sort Dropdown Menu */}
            {sortOpen && (
              <div className="border-line bg-surface absolute top-[calc(100%_+_8px)] right-0 z-50 min-w-[220px] overflow-hidden rounded-[12px] border p-[6px] shadow-[0_20px_60px_-20px_oklch(0_0_0_/_0.5)]">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSortSelect(option.key)}
                    className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-[13px] transition-all ${
                      sortKey === option.key ? 'text-lime bg-[oklch(1_0_0_/_0.04)]' : 'text-text-dim hover:text-text hover:bg-[oklch(1_0_0_/_0.04)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Venue Button */}
          <button
            onClick={onAddVenue}
            className="bg-lime flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold tracking-[-0.01em] text-white shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-px hover:shadow-[0_14px_40px_-10px_var(--lime-glow)]"
          >
            <Icon name="plus" size={16} />
            <span className="hidden sm:inline">Add Venue Post</span>
          </button>
        </div>
      </div>
    </div>
  );
}
