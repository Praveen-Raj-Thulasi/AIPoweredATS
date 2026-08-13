import React from 'react';
import { Search } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterComponent?: React.ReactNode;
  actionButton?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterComponent,
  actionButton,
  emptyMessage = 'No records found.',
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      {(onSearchChange || filterComponent || actionButton) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            {onSearchChange && (
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
            )}
            {filterComponent}
          </div>
          {actionButton}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#0c0c0e]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/40 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`py-3.5 px-5 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/60">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-zinc-500 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors ${
                      onRowClick ? 'hover:bg-zinc-900/40 cursor-pointer' : 'hover:bg-zinc-900/20'
                    }`}
                  >
                    {columns.map((col, idx) => (
                      <td key={idx} className={`py-4 px-5 text-zinc-300 ${col.className || ''}`}>
                        {col.render
                          ? col.render(item)
                          : col.accessor
                          ? (item[col.accessor] as any)
                          : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


