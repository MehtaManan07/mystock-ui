import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Contact } from '../../../types';

/** Radix forbids an empty SelectItem value, so the "no selection" row uses a sentinel. */
const NO_VENDOR = 'none';

export interface VendorSkuDialogProps {
  open: boolean;
  editingVendorSku: { vendor_id: number; vendor_sku: string } | null;
  selectedVendorId: number | '';
  vendorSkuValue: string;
  customers: Contact[];
  isPending: boolean;
  onClose: () => void;
  onVendorChange: (vendorId: number | '') => void;
  onSkuChange: (value: string) => void;
  onSubmit: () => void;
}

export const VendorSkuDialog: React.FC<VendorSkuDialogProps> = ({
  open,
  editingVendorSku,
  selectedVendorId,
  vendorSkuValue,
  customers,
  isPending,
  onClose,
  onVendorChange,
  onSkuChange,
  onSubmit,
}) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{editingVendorSku ? 'Edit Vendor SKU' : 'Add Vendor SKU'}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="vendor-sku-vendor">Customer / vendor</Label>
          <Select
            value={selectedVendorId === '' ? '' : String(selectedVendorId)}
            onValueChange={(value) => onVendorChange(value === NO_VENDOR ? '' : Number(value))}
            disabled={!!editingVendorSku}
          >
            <SelectTrigger id="vendor-sku-vendor" className="w-full">
              <SelectValue placeholder="Select a customer/vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_VENDOR}>Select a customer/vendor</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="vendor-sku-value">Vendor SKU</Label>
          <Input
            id="vendor-sku-value"
            value={vendorSkuValue}
            onChange={(e) => onSkuChange(e.target.value)}
            placeholder="Enter vendor's/customer's SKU for this product"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            The SKU used by this customer/marketplace for this product
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!selectedVendorId || !vendorSkuValue || isPending}
        >
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
