import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Box,
} from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasActions?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  hasActions = true,
}) => {
  const totalColumns = hasActions ? columns + 1 : columns;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: totalColumns }).map((_, i) => (
              <TableCell key={i}>
                <Skeleton variant="text" width={i === totalColumns - 1 && hasActions ? 80 : '60%'} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: totalColumns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  {colIndex === totalColumns - 1 && hasActions ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  ) : (
                    <Skeleton
                      variant="text"
                      width={colIndex === 0 ? '80%' : `${50 + Math.random() * 30}%`}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 4 }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            flex: '1 1 200px',
            minWidth: 150,
            p: 2,
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="70%" height={40} sx={{ mt: 1 }} />
        </Box>
      ))}
    </Box>
  );
};

interface DetailSkeletonProps {
  lines?: number;
}

export const DetailSkeleton: React.FC<DetailSkeletonProps> = ({ lines = 6 }) => {
  return (
    <Box>
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width="40%" />
        </Box>
      ))}
    </Box>
  );
};
