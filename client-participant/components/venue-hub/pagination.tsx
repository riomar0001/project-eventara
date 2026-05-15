'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-[6px] py-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="border-line-soft text-text-dim hover:text-text hover:border-text-mute inline-flex h-[38px] min-w-[38px] items-center justify-center gap-[6px] rounded-[10px] border px-3 text-[13.5px] font-medium transition-all disabled:pointer-events-none disabled:opacity-40"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      </button>

      {/* Page Numbers */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`inline-flex h-[38px] min-w-[38px] items-center justify-center rounded-[10px] border px-3 text-[13.5px] font-medium transition-all ${
            currentPage === page
              ? 'border-lime bg-lime font-semibold text-white shadow-[0_0_0_3px_oklch(0.7_0.2_130_/_0.15)]'
              : 'border-line-soft text-text-dim hover:text-text hover:border-text-mute'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="border-line-soft text-text-dim hover:text-text hover:border-text-mute inline-flex h-[38px] min-w-[38px] items-center justify-center gap-[6px] rounded-[10px] border px-3 text-[13.5px] font-medium transition-all disabled:pointer-events-none disabled:opacity-40"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
