import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from 'cn';
import type { Product, ProductImage } from '../../../types';

/** Radix forbids an empty SelectItem value, so the "no selection" row uses a sentinel. */
const NO_PRODUCT = 'none';

export interface CopyImagesDialogProps {
  open: boolean;
  copyFromProductId: number | '';
  otherProducts: Product[];
  /** Images of the currently selected source product (fetch when copyFromProductId is set) */
  sourceProductImages: ProductImage[];
  isPending: boolean;
  onClose: () => void;
  onProductSelect: (productId: number | '') => void;
  onCopy: (selectedImageIds: number[]) => void;
}

export const CopyImagesDialog: React.FC<CopyImagesDialogProps> = ({
  open,
  copyFromProductId,
  otherProducts,
  sourceProductImages,
  isPending,
  onClose,
  onProductSelect,
  onCopy,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (sourceProductImages.length > 0) {
      setSelectedIds(new Set(sourceProductImages.map((img) => img.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [sourceProductImages]);

  const allSelected = sourceProductImages.length > 0 && selectedIds.size === sourceProductImages.length;
  const someSelected = selectedIds.size > 0;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sourceProductImages.map((img) => img.id)));
    }
  };

  const handleToggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = () => {
    if (someSelected) {
      onCopy([...selectedIds]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Copy images from another product</DialogTitle>
        </DialogHeader>

        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose a product, then select which images to copy. No new upload; images are shared.
          </p>

          <div className="mb-4 grid gap-2">
            <Label htmlFor="copy-images-product">Product</Label>
            <Select
              value={copyFromProductId === '' ? '' : String(copyFromProductId)}
              onValueChange={(value) =>
                onProductSelect(value === NO_PRODUCT ? '' : Number(value))
              }
            >
              <SelectTrigger id="copy-images-product" className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PRODUCT}>Select a product</SelectItem>
                {otherProducts.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} — {p.size} • {p.packing}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sourceProductImages.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Checkbox
                  id="copy-images-select-all"
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={handleToggleAll}
                />
                <Label htmlFor="copy-images-select-all" className="font-normal">
                  Select all
                </Label>
              </div>

              <div className="flex flex-wrap gap-3">
                {sourceProductImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => handleToggleOne(img.id)}
                    className={cn(
                      'relative size-20 cursor-pointer overflow-hidden rounded border-2 bg-muted hover:border-primary/60',
                      selectedIds.has(img.id) ? 'border-primary' : 'border-border'
                    )}
                  >
                    <img
                      src={img.thumb_url || img.url}
                      alt=""
                      className="size-full object-cover"
                    />
                    <Checkbox
                      checked={selectedIds.has(img.id)}
                      className="absolute top-1 left-1 border-white bg-black/40 text-white data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => handleToggleOne(img.id)}
                    />
                  </div>
                ))}
              </div>

              <span className="mt-2 block text-xs text-muted-foreground">
                {selectedIds.size} of {sourceProductImages.length} selected
              </span>
            </div>
          ) : (
            copyFromProductId && (
              <p className="text-sm text-muted-foreground">This product has no images.</p>
            )
          )}

          {otherProducts.length === 0 && (
            <span className="mt-2 block text-xs text-muted-foreground">
              No other products found. Create another product first (e.g. same item, different
              size).
            </span>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={!someSelected || isPending}>
            {isPending
              ? 'Copying…'
              : `Copy ${selectedIds.size} image${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
