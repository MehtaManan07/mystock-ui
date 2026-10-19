import React from 'react';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from 'cn';
import { EmptyState } from '../../../components/common/EmptyState';
import type { InventoryLogInfo } from '../../../types';

const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM yyyy, HH:mm');

const actionBadgeClass = (action: string) => {
  if (action === 'add' || action === 'purchase')
    return 'bg-success/10 text-success border-success/30';
  if (action === 'remove' || action === 'sale')
    return 'bg-destructive/10 text-destructive border-destructive/30';
  return 'bg-muted text-muted-foreground border-border';
};

export interface ProductRecentActivityCardProps {
  logs: InventoryLogInfo[];
  onContainerClick: (containerId: number) => void;
}

export const ProductRecentActivityCard: React.FC<ProductRecentActivityCardProps> = ({
  logs,
  onContainerClick,
}) => (
  <Card className="overflow-hidden">
    <CardHeader className="border-b border-border/70 pb-5">
      <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
      <CardAction>
        <Badge variant="outline" className="tabular-nums">
          {logs.length} log{logs.length !== 1 ? 's' : ''}
        </Badge>
      </CardAction>
    </CardHeader>

    <CardContent className="px-0">
      {logs.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Action</TableHead>
              <TableHead>Container</TableHead>
              <TableHead numeric>Quantity</TableHead>
              <TableHead className="pr-6">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.slice(0, 10).map((log) => (
              <TableRow
                key={log.id}
                className={cn(log.container ? 'cursor-pointer' : 'cursor-default')}
                onClick={() => log.container && onContainerClick(log.container.id)}
              >
                <TableCell className="pl-6">
                  <Badge
                    variant="outline"
                    className={cn('capitalize', actionBadgeClass(log.action))}
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.container ? (
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/10 text-primary"
                    >
                      {log.container.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell numeric className="font-medium">
                  {log.quantity}
                </TableCell>
                <TableCell className="pr-6 text-sm text-muted-foreground tabular-nums">
                  {formatDate(log.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          compact
          icon={<History />}
          title="No activity yet"
          message="Stock movements for this product will show up here."
        />
      )}
    </CardContent>
  </Card>
);
