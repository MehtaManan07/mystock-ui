import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from 'cn';
import type { InventoryLogInfo } from '../../../types';

const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM yyyy, HH:mm');

const actionBadgeClass = (action: string) => {
  if (action === 'add' || action === 'purchase') return 'border-success text-success';
  if (action === 'remove' || action === 'sale') return 'border-destructive text-destructive';
  return undefined;
};

export interface ProductRecentActivityCardProps {
  logs: InventoryLogInfo[];
  onContainerClick: (containerId: number) => void;
}

export const ProductRecentActivityCard: React.FC<ProductRecentActivityCardProps> = ({
  logs,
  onContainerClick,
}) => (
  <Card>
    <CardContent>
      <h3 className="mb-2 text-base font-semibold">Recent Activity ({logs.length} logs)</h3>
      <Separator className="mb-4" />

      {logs.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Container</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 10).map((log) => (
                <TableRow
                  key={log.id}
                  className={cn(log.container ? 'cursor-pointer' : 'cursor-default')}
                  onClick={() => log.container && onContainerClick(log.container.id)}
                >
                  <TableCell>
                    <Badge variant="outline" className={actionBadgeClass(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.container ? (
                      <Badge variant="outline" className="border-primary text-primary">
                        {log.container.name}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">{log.quantity}</TableCell>
                  <TableCell>
                    <span className="text-xs">{formatDate(log.created_at)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No activity logs for this product.</p>
      )}
    </CardContent>
  </Card>
);
