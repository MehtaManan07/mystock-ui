import React, { useState } from 'react';
import { Box, Autocomplete, TextField, Chip, CircularProgress, Button, Typography } from '@mui/material';
import { Warehouse as AssignIcon } from '@mui/icons-material';
import { useProductContainers } from '../../../../hooks/useContainerProducts';
import { ManageContainersDialog } from '../../../products/components/ManageContainersDialog';
import type { ContainerProduct, ContainerProductInfo, Product } from '../../../../types';
import type { ContainerOption } from './types';

interface ContainerSelectorProps {
  productId: number;
  productName: string;
  productPacking?: string;
  value: ContainerOption | null;
  onChange: (container: ContainerOption | null) => void;
}

export const ContainerSelector: React.FC<ContainerSelectorProps> = ({
  productId,
  productName,
  productPacking,
  value,
  onChange,
}) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const { data: containerProducts, isLoading } = useProductContainers(productId);

  const options: ContainerOption[] = (containerProducts ?? [])
    .filter((cp: ContainerProduct) => cp.container && cp.quantity > 0)
    .map((cp: ContainerProduct) => ({
      id: cp.container!.id,
      name: cp.container!.name,
      type: cp.container!.type,
      availableQty: cp.quantity, // Already in items
    }));

  // Needed by ManageContainersDialog to pre-populate its form
  const currentContainers: ContainerProductInfo[] = (containerProducts ?? [])
    .filter((cp: ContainerProduct) => cp.container)
    .map((cp: ContainerProduct) => ({
      container: cp.container!,
      quantity: cp.quantity,
    }));

  if (isLoading) {
    return <CircularProgress size={20} />;
  }

  if (options.length === 0) {
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            No stock available
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<AssignIcon fontSize="small" />}
            onClick={() => setAssignDialogOpen(true)}
          >
            Assign Container
          </Button>
        </Box>
        <ManageContainersDialog
          open={assignDialogOpen}
          productId={productId}
          productName={productName}
          currentContainers={currentContainers}
          onClose={() => setAssignDialogOpen(false)}
          onSuccess={() => setAssignDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <Autocomplete
      size="small"
      value={value}
      onChange={(_, v) => onChange(v)}
      options={options}
      getOptionLabel={(o) => `${o.name} (${o.availableQty} items avail)`}
      noOptionsText="No stock in any container"
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
            <span>{option.name}</span>
            <Chip label={`${option.availableQty} items`} size="small" color="success" variant="outlined" />
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Select container"
          error={!value}
          helperText={!value ? 'Required' : ''}
        />
      )}
      sx={{ minWidth: 220 }}
    />
  );
};
