import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** Card renderer used on small screens instead of the table. */
  mobileCard?: (row: T) => ReactNode;
  empty?: ReactNode;
  caption?: string;
}

/** Responsive data table: a real <table> on md+ screens, stacked cards on mobile. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, mobileCard, empty, caption }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <>{empty}</>;
  }
  return (
    <>
      <div className={cn('overflow-x-auto', mobileCard && 'hidden md:block')}>
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-4 py-3 whitespace-nowrap', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <motion.tr
                key={rowKey(row)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.025 }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-brand-50/50')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3.5 align-middle', c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {mobileCard && (
        <ul className="space-y-3 md:hidden">
          {rows.map((row, i) => (
            <motion.li
              key={rowKey(row)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.035 }}
            >
              {mobileCard(row)}
            </motion.li>
          ))}
        </ul>
      )}
    </>
  );
}
