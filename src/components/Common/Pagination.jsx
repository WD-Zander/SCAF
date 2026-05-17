import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, totalItems, onPageChange, itemsPerPage, label = 'elementos' }) => {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const rangeStart = Math.max(2, currentPage - 1);
      const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 20px', borderTop: '1px solid var(--glass-border)',
      flexWrap: 'wrap', gap: '12px'
    }}>
      <span className="text-muted" style={{ fontSize: '0.82rem' }}>
        {start}–{end} de {totalItems} {label}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          className="btn-secondary"
          style={{ padding: '6px 8px', opacity: currentPage === 1 ? 0.4 : 1 }}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>

        {getPages().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} style={{ padding: '4px 6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>…</span>
          ) : (
            <button
              key={page}
              className="btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '0.8rem',
                fontWeight: page === currentPage ? 700 : 400,
                background: page === currentPage ? 'var(--accent-primary)' : 'transparent',
                color: page === currentPage ? '#fff' : 'var(--text-main)',
                border: page === currentPage ? 'none' : undefined,
              }}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          className="btn-secondary"
          style={{ padding: '6px 8px', opacity: currentPage === totalPages ? 0.4 : 1 }}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
