/**
 * Results Bar - Shows count and active filters
 */
import { FilterChip } from './filter-chip';

interface ResultsBarProps {
  count: number;
  activeFilters: Array<{
    label: string;
    onRemove: () => void;
  }>;
}

export function ResultsBar({ count, activeFilters }: ResultsBarProps) {
  return (
    <div className="border-b border-[var(--line-soft)] px-8 py-4">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="m-0 text-xl font-semibold text-[var(--text)]">
            {count} venue{count !== 1 ? 's' : ''} found
          </h3>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter, idx) => (
              <FilterChip key={idx} label={filter.label} onRemove={filter.onRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
