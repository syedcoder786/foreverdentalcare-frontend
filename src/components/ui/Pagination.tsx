import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalElements, size, onPageChange }: PaginationProps) {
  if (totalElements === 0) return null;
  const from = page * size + 1;
  const to = Math.min(totalElements, (page + 1) * size);
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-ink">{from}</span>-<span className="font-medium text-ink">{to}</span> of{' '}
        <span className="font-medium text-ink">{totalElements}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 0} icon={<ChevronLeft className="size-4" />}>
          Previous
        </Button>
        <span className="px-2 text-sm text-slate-500">
          {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page + 1 >= totalPages}>
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
