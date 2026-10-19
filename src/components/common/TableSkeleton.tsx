import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasActions?: boolean;
}

/**
 * Widths are derived from the cell index rather than Math.random() so the
 * placeholder does not reshuffle on every re-render.
 */
const CELL_WIDTHS = ['w-[80%]', 'w-[55%]', 'w-[70%]', 'w-[60%]', 'w-[75%]', 'w-[50%]'];

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  hasActions = true,
}) => {
  const totalColumns = hasActions ? columns + 1 : columns;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: totalColumns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton
                className={
                  i === totalColumns - 1 && hasActions ? 'h-4 w-20' : 'h-4 w-[60%]'
                }
              />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: totalColumns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                {colIndex === totalColumns - 1 && hasActions ? (
                  <div className="flex gap-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="size-8 rounded-full" />
                  </div>
                ) : (
                  <Skeleton
                    className={`h-4 ${CELL_WIDTHS[(rowIndex + colIndex) % CELL_WIDTHS.length]}`}
                  />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="min-w-[150px] flex-[1_1_200px] rounded-lg bg-card p-4"
        >
          <Skeleton className="h-4 w-[40%]" />
          <Skeleton className="mt-2 h-8 w-[70%]" />
        </div>
      ))}
    </div>
  );
};

interface DetailSkeletonProps {
  lines?: number;
}

export const DetailSkeleton: React.FC<DetailSkeletonProps> = ({ lines = 6 }) => {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-[30%]" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mb-4 flex gap-4">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[40%]" />
        </div>
      ))}
    </div>
  );
};
