'use client';

import { Icon } from '@/components/ui/icon';

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
        className="inline-flex h-[38px] min-w-[38px] items-center justify-center gap-[6px] rounded-[10px] border px-3 text-[13.5px] font-medium transition-all"
        style={{
          borderColor: 'var(--line-soft)',
          color: 'var(--text-dim)'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            const el = e.currentTarget;
            el.style.color = 'var(--text)';
            el.style.borderColor = 'var(--text-mute)';
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.color = '';
          el.style.borderColor = '';
        }}
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
          className={`inline-flex h-[38px] min-w-[38px] items-center justify-center rounded-[10px] px-3 text-[13.5px] font-medium transition-all ${
            currentPage === page
              ? ''
              : ''
          }`}
          style={
            currentPage === page
              ? {
                  background: 'var(--lime)',
                  color: '#fff',
                  borderColor: 'var(--lime)',
                  fontWeight: 600,
                  boxShadow: '0 0 0 3px oklch(0.7 0.2 130 / 0.15)',
                  border: '1px solid var(--lime)'
                }
              : {
                  borderColor: 'var(--line-soft)',
                  color: 'var(--text-dim)',
                  border: '1px solid var(--line-soft)'
                }
          }
          onMouseEnter={(e) => {
            if (currentPage !== page) {
              const el = e.currentTarget;
              el.style.color = 'var(--text)';
              el.style.borderColor = 'var(--text-mute)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== page) {
              const el = e.currentTarget;
              el.style.color = '';
              el.style.borderColor = '';
            }
          }}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex h-[38px] min-w-[38px] items-center justify-center gap-[6px] rounded-[10px] border px-3 text-[13.5px] font-medium transition-all"
        style={{
          borderColor: 'var(--line-soft)',
          color: 'var(--text-dim)'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            const el = e.currentTarget;
            el.style.color = 'var(--text)';
            el.style.borderColor = 'var(--text-mute)';
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.color = '';
          el.style.borderColor = '';
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
