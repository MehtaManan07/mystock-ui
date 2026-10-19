import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from 'cn';

interface Column<T> {
  id: string;
  label: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
  minWidth?: number;
  mobileLabel?: string; // Custom label for mobile view
  isAction?: boolean; // Special handling for action columns
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** When provided, Cmd/Ctrl+Click or middle-click opens the row URL in a new tab */
  getRowHref?: (row: T) => string;
  emptyMessage?: string;
  /** Extra classes for the mobile cards. */
  mobileCardClassName?: string;
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

const justifyClass = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const;

/**
 * Renders a table on >= sm and a stack of cards below it.
 *
 * Both layouts are emitted and toggled with CSS breakpoints. The previous MUI
 * version used `useMediaQuery`, which re-rendered the whole table on every
 * resize crossing; this does the switch in the compositor instead.
 */
export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  getRowHref,
  emptyMessage = 'No data available',
  mobileCardClassName,
}: ResponsiveTableProps<T>) {
  const handleActivate = (row: T) => (e: React.MouseEvent) => {
    if (getRowHref && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      window.open(getRowHref(row), '_blank');
      return;
    }
    onRowClick?.(row);
  };

  const handleAux = (row: T) => (e: React.MouseEvent) => {
    if (e.button === 1 && getRowHref) {
      window.open(getRowHref(row), '_blank');
    }
  };

  if (data.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const visibleColumns = columns.filter((col) => !col.hideOnMobile);
  const actionColumn = visibleColumns.find((col) => col.isAction);
  const dataColumns = visibleColumns.filter((col) => !col.isAction);

  return (
    <>
      {/* Mobile: card list */}
      <div className="flex flex-col gap-3 p-3 sm:hidden">
        {data.map((row) => (
          <Card
            key={keyExtractor(row)}
            className={cn(
              'gap-0 p-4 transition-colors',
              onRowClick && 'cursor-pointer hover:bg-accent/50',
              mobileCardClassName
            )}
            onClick={(e) => {
              // Don't trigger row click if clicking on action buttons
              if (!(e.target as HTMLElement).closest('button, a')) {
                handleActivate(row)(e);
              }
            }}
            onAuxClick={handleAux(row)}
          >
            {actionColumn && (
              <div
                className={cn(
                  'flex justify-end',
                  dataColumns.length > 0 && 'mb-3 border-b pb-3'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {actionColumn.render(row)}
              </div>
            )}

            {dataColumns.map((col, index) => (
              <div
                key={col.id}
                className={cn(
                  'flex min-h-7 items-start justify-between gap-4',
                  index > 0 && 'mt-3 border-t pt-3'
                )}
              >
                <span className="shrink-0 pt-0.5 text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">
                  {col.mobileLabel || col.label}
                </span>
                <div
                  className={cn(
                    'flex flex-1 flex-wrap gap-1',
                    justifyClass[col.align ?? 'right']
                  )}
                >
                  {col.render(row)}
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <Table className="min-w-[650px]">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                  className={cn('whitespace-nowrap', alignClass[col.align ?? 'left'])}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={handleActivate(row)}
                onAuxClick={handleAux(row)}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={alignClass[col.align ?? 'left']}
                  >
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default ResponsiveTable;
