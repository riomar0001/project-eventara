/**
 * Action Bar - Search, filters, and add venue button
 */

'use client';

import { useState } from 'react';
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
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-stretch gap-3">
          {/* Search Input */}
          <div className="relative">
            <Icon name="search" size={16} className="absolute top-1/2 left-[18px] -translate-y-1/2 text-text-mute" />
            <input
              type="text"
              placeholder="Search venues, locations..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="h-14 w-full rounded-[14px] border border-line-soft bg-surface py-4 pr-[18px] pl-[52px] text-[15px] text-text placeholder-text-mute transition-all focus:border--lime focus:bg-surface-2 focus:ring-4 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
            />
          </div>

          {/* Capacity Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCapacityOpen(!capacityOpen)}
              className="flex h-14 min-w-[180px] items-center justify-between gap-2 rounded-[14px] border border-line-soft bg-surface px-[18px] py-4 text-sm transition-all hover:border--text-mute"
            >
              <div className="flex flex-row items-center gap-1.5">
                <span className="font-mono text-[10.5px] tracking-[0.14em] text-text-mute uppercase">Capacity</span>
                <span className="text-[14px] font-medium text-text">{CAPACITY_FILTERS.find((f) => f.key === capacityKey)?.label || 'Any'}</span>
              </div>
              <Icon name="chevronDown" size={14} className="flex items-center text-text-mute" />
            </button>

            {/* Capacity Dropdown Menu */}
            {capacityOpen && (
              <div className="absolute top-[calc(100%_+_8px)] right-0 z-50 min-w-[220px] overflow-hidden rounded-[12px] border border-line bg-surface p-[6px] shadow-[0_20px_60px_-20px_oklch(0_0_0_/_0.5)]">
                {CAPACITY_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleCapacitySelect(filter.key)}
                    className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-[13px] transition-all ${
                      capacityKey === filter.key
                        ? 'bg-[oklch(1_0_0_/_0.04)] text-lime'
                        : 'text-text-dim hover:bg-[oklch(1_0_0_/_0.04)] hover:text-text'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex h-14 min-w-[180px] items-center justify-between gap-2 rounded-[14px] border border-line-soft bg-surface px-[18px] py-4 text-sm transition-all hover:border--text-mute"
            >
              <div className="flex flex-row items-center gap-1.5">
                <span className="font-mono text-[10.5px] tracking-[0.14em] text-text-mute uppercase">Sort</span>
                <span className="text-[14px] font-medium text-text">{SORT_OPTIONS.find((o) => o.key === sortKey)?.label || 'Rating'}</span>
              </div>
              <Icon name="chevronDown" size={14} className="flex items-center text-text-mute" />
            </button>

            {/* Sort Dropdown Menu */}
            {sortOpen && (
              <div className="absolute top-[calc(100%_+_8px)] right-0 z-50 min-w-[220px] overflow-hidden rounded-[12px] border border-line bg-surface p-[6px] shadow-[0_20px_60px_-20px_oklch(0_0_0_/_0.5)]">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSortSelect(option.key)}
                    className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-[13px] transition-all ${
                      sortKey === option.key
                        ? 'bg-[oklch(1_0_0_/_0.04)] text-lime'
                        : 'text-text-dim hover:bg-[oklch(1_0_0_/_0.04)] hover:text-text'
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
            className="flex items-center justify-center gap-[10px] rounded-full bg-lime px-5 py-[13px] text-sm font-semibold tracking-[-0.01em] text-[#0a1005] transition-all hover:-translate-y-px hover:shadow-[0_14px_40px_-10px_var(--lime-glow)]"
            style={{
              boxShadow: '0 8px 28px -10px var(--lime-glow)'
            }}
          >
            <Icon name="plus" size={16} className="text-white" />
            <span className="hidden text-white sm:inline">Add Venue Post</span>
          </button>
        </div>
      </div>
    </div>
  );
}
