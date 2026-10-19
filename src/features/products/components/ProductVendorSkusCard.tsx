import React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  <Card className="mb-6">
    <CardContent>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Vendor SKU Mappings ({vendorSkus.length})</h3>
        <Button size="sm" onClick={onAdd}>
          <Plus />
          Add Vendor SKU
        </Button>
      </div>
      <Separator className="mb-4" />

      {vendorSkus.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer/Vendor Name</TableHead>
                <TableHead>Vendor SKU</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorSkus.map((vs) => (
                <TableRow key={vs.vendor_id}>
                  <TableCell>
                    <p className="text-sm font-medium">{vs.vendor_name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-sm">{vs.vendor_sku}</p>
                  </TableCell>
                  <TableCell className="text-right">
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
                          className="text-destructive"
                          aria-label="Delete"
                          onClick={() => onDelete(vs.vendor_id, vs.vendor_name)}
                        >
                          <Trash2 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No vendor SKU mappings yet. Add customer/marketplace-specific SKUs (e.g., deodap, meesho,
          amazon, flipkart).
        </p>
      )}
    </CardContent>
  </Card>
);
