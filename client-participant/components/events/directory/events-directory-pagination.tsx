'use client';

import { Icon } from './icon';

interface EventsDirectoryPaginationProps {
  currentPage: number;
  totalPages: number;
  filteredLength: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

const pageBtnBase =
  'inline-flex h-[38px] min-w-[38px] items-center justify-center gap-[6px] rounded-[10px] border border-border px-3 text-[13.5px] font-medium text-muted-foreground transition-all disabled:cursor-not-allowed disabled:opacity-40';

export function EventsDirectoryPagination({ currentPage, totalPages, filteredLength, perPage, onPageChange }: EventsDirectoryPaginationProps) {
  const loadedPct = Math.round(((currentPage * perPage) / filteredLength) * 100);
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, filteredLength);

  return (
    <div className="mt-14 mb-8 flex flex-col items-center gap-7">
      {/* Progress */}
      <div className="flex flex-col items-center gap-[10px]">
        <div className="bg-muted relative h-1 w-[220px] overflow-hidden rounded-[3px]">
          <div
            className="from-primary h-full rounded-[3px] bg-linear-to-r to-[oklch(0.62_0.16_60)] transition-[width] duration-400"
            style={{ width: `${Math.min(100, loadedPct)}%` }}
          />
        </div>
        <div className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
          Showing {start}–{end} of {filteredLength}
        </div>
      </div>

      {/* Load more / End of list */}
      {currentPage < totalPages ? (
        <button
          className="border-border text-foreground hover:border-primary hover:text-primary inline-flex items-center justify-center gap-[10px] rounded-full border bg-transparent px-5 py-[13px] text-[14px] font-semibold tracking-[-0.01em] transition-all hover:shadow-[0_0_24px_-8px_var(--lime-glow)]"
          onClick={() => onPageChange(currentPage + 1)}
        >
          Load more events <Icon name="arrow-right" size={14} />
        </button>
      ) : (
        <div className="text-muted-foreground font-mono text-[11px] tracking-[0.14em]">— END OF LIST —</div>
      )}

      {/* Page buttons */}
      <div className="flex items-center gap-[6px]">
        <button className={pageBtnBase} disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>
          <Icon name="arrow-left" size={13} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`inline-flex h-[38px] min-w-[38px] items-center justify-center rounded-[10px] border px-3 text-[13.5px] font-medium transition-all ${
              n === currentPage ? 'border-primary bg-primary text-white shadow-[0_0_0_3px_oklch(0.7_0.2_130_/_0.15)]' : 'border-border text-muted-foreground'
            }`}
            onClick={() => onPageChange(n)}
            onMouseEnter={(e) => {
              if (n !== currentPage) {
                (e.currentTarget as HTMLElement).style.color = 'oklch(0.2 0.012 150)';
                (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.58 0.012 150)';
              }
            }}
            onMouseLeave={(e) => {
              if (n !== currentPage) {
                (e.currentTarget as HTMLElement).style.color = '';
                (e.currentTarget as HTMLElement).style.borderColor = '';
              }
            }}
          >
            {n}
          </button>
        ))}

        <button className={pageBtnBase} disabled={currentPage === totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}>
          <Icon name="arrow-right" size={13} />
        </button>
      </div>
    </div>
  );
}
