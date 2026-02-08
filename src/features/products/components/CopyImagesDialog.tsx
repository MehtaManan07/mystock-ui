import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import type { Product, ProductImage } from '../../../types';

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Copy images from another product</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose a product, then select which images to copy. No new upload; images are shared.
        </Typography>
        <TextField
          select
          label="Product"
          value={copyFromProductId}
          onChange={(e) => onProductSelect(e.target.value === '' ? '' : Number(e.target.value))}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        >
          <MenuItem value="">Select a product</MenuItem>
          {otherProducts.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} — {p.size} • {p.packing}
            </MenuItem>
          ))}
        </TextField>

        {sourceProductImages.length > 0 ? (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={handleToggleAll}
                />
              }
              label="Select all"
              sx={{ mb: 1.5 }}
            />
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              {sourceProductImages.map((img) => (
                <Box
                  key={img.id}
                  onClick={() => handleToggleOne(img.id)}
                  sx={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: 2,
                    borderColor: selectedIds.has(img.id) ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    bgcolor: 'grey.100',
                    '&:hover': { borderColor: 'primary.light' },
                  }}
                >
                  <img
                    src={img.thumb_url || img.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Checkbox
                    checked={selectedIds.has(img.id)}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      color: 'white',
                      bgcolor: 'rgba(0,0,0,0.4)',
                      p: 0.25,
                      '&.Mui-checked': { color: 'primary.light' },
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleToggleOne(img.id)}
                  />
                </Box>
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {selectedIds.size} of {sourceProductImages.length} selected
            </Typography>
          </Box>
        ) : (
          copyFromProductId && (
            <Typography variant="body2" color="text.secondary">
              This product has no images.
            </Typography>
          )
        )}

        {otherProducts.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            No other products found. Create another product first (e.g. same item, different size).
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCopy}
          disabled={!someSelected || isPending}
        >
          {isPending ? 'Copying…' : `Copy ${selectedIds.size} image${selectedIds.size !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
