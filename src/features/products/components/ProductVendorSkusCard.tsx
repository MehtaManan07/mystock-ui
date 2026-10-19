import React from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '../../../components/common/EmptyState';
import type { VendorSkuInfo } from '../../../types';

export interface ProductVendorSkusCardProps {
  vendorSkus: VendorSkuInfo[];
  onAdd: () => void;
  onEdit: (vendorId: number, vendorSku: string) => void;
  onDelete: (vendorId: number, vendorName: string) => void;
}

export const ProductVendorSkusCard: React.FC<ProductVendorSkusCardProps> = ({
  vendorSkus,
  onAdd,
  onEdit,
  onDelete,
}) => (
  <Card className="overflow-hidden">
    <CardHeader className="border-b border-border/70 pb-5 max-sm:grid-cols-1">
      <CardTitle className="text-base font-semibold">Vendor SKU mappings</CardTitle>
      <CardAction className="flex items-center gap-2 max-sm:col-start-1 max-sm:row-start-2 max-sm:justify-self-start">
        <Badge variant="outline" className="tabular-nums">
          {vendorSkus.length}
        </Badge>
        <Button size="sm" onClick={onAdd}>
          <Plus />
          Add vendor SKU
        </Button>
      </CardAction>
    </CardHeader>

    <CardContent className="px-0">
      {vendorSkus.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Customer / vendor</TableHead>
              <TableHead>Vendor SKU</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorSkus.map((vs) => (
              <TableRow key={vs.vendor_id}>
                <TableCell className="pl-6">
                  <p className="text-sm font-medium">{vs.vendor_name}</p>
                </TableCell>
                <TableCell>
                  <p className="font-mono text-sm text-muted-foreground">{vs.vendor_sku}</p>
                </TableCell>
                <TableCell className="pr-6">
                  <div className="flex justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit"
                          onClick={() => onEdit(vs.vendor_id, vs.vendor_sku)}
                        >
                          <Pencil />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete"
                          onClick={() => onDelete(vs.vendor_id, vs.vendor_name)}
                        >
                          <Trash2 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          compact
          icon={<Tags />}
          title="No vendor SKU mappings"
          message="Add customer or marketplace-specific SKUs (e.g. deodap, meesho, amazon, flipkart) so orders map to this product."
          actionLabel="Add vendor SKU"
          actionIcon={<Plus />}
          onAction={onAdd}
        />
      )}
    </CardContent>
  </Card>
);
