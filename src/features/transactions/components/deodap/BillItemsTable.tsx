import React from 'react';
import { CircleCheck, CircleAlert, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from 'cn';
import { ContainerSelector } from './ContainerSelector';
import type { DeodapBillRow, ContainerOption } from './types';

interface BillItemsTableProps {
  rows: DeodapBillRow[];
  onContainerChange: (index: number, container: ContainerOption | null) => void;
}

export const BillItemsTable: React.FC<BillItemsTableProps> = ({ rows, onContainerChange }) => {
  const foundCount = rows.filter((r) => r.lookupStatus === 'found').length;
  const notFoundRows = rows.filter((r) => r.lookupStatus === 'not_found');

  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Step 2 — Assign Containers</h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="border-success/30 bg-success/10 tabular-nums text-success"
            >
              {foundCount} found
            </Badge>
            {notFoundRows.length > 0 && (
              <Badge
                variant="outline"
                className="border-destructive/30 bg-destructive/10 tabular-nums text-destructive"
              >
                {notFoundRows.length} not found
              </Badge>
            )}
          </div>
        </div>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          For each product found, select the container from which stock will be used. If a product
          has no stock, use <strong>Assign Container</strong> to add it first.
        </p>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead numeric>Sr No.</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead numeric>Qty</TableHead>
                <TableHead>Container</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={cn(
                    row.lookupStatus === 'not_found' && 'bg-muted/40 text-muted-foreground'
                  )}
                >
                  <TableCell numeric className="text-muted-foreground">
                    {idx + 1}
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-sm tabular-nums">{row.sku}</span>
                  </TableCell>

                  <TableCell>
                    {row.lookupStatus === 'pending' ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : row.lookupStatus === 'found' ? (
                      <div className="flex items-center gap-2">
                        <CircleCheck className="size-4 shrink-0 text-success" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{row.product!.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {row.product!.size} • {row.product!.packing}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CircleAlert className="size-4 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">SKU not found</p>
                      </div>
                    )}
                  </TableCell>

                  <TableCell numeric>
                    <span className="text-sm font-medium">{row.quantity} items</span>
                  </TableCell>

                  <TableCell>
                    {row.lookupStatus === 'found' ? (
                      <ContainerSelector
                        productId={row.product!.id}
                        productName={row.product!.name}
                        productPacking={row.product!.packing}
                        value={row.selectedContainer}
                        onChange={(c) => onContainerChange(idx, c)}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {notFoundRows.length > 0 && (
          <Alert className="mt-4 border-warning/40 bg-warning/10 text-warning">
            <AlertDescription className="text-warning">
              {notFoundRows.length} SKU(s) not matched and will be skipped:{' '}
              {notFoundRows.map((r) => r.sku).join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
