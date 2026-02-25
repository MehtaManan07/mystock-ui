import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useContainers } from '../../../hooks/useContainers';
import { useSetContainerProducts } from '../../../hooks/useContainerProducts';
import type { ContainerProductInfo, SetProductsDto } from '../../../types';
import type { ContainerInfo } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';

interface ContainerQuantityItem {
  container: ContainerInfo;
  quantity: number;
}

interface ManageContainersDialogProps {
  open: boolean;
  productId: number;
  productName: string;
  currentContainers: ContainerProductInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ManageContainersDialog: React.FC<ManageContainersDialogProps> = ({
  open,
  productId,
  productName,
  currentContainers,
  onClose,
  onSuccess,
}) => {
  const [items, setItems] = useState<ContainerQuantityItem[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<any | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Fetch all containers for selection
  const { data: allContainers, isLoading: containersLoading } = useContainers(debouncedSearch);

  // Mutation to set products in containers
  const setProductsMutation = useSetContainerProducts();

  // Initialize items from current containers when dialog opens
  useEffect(() => {
    if (open && currentContainers) {
      const initialItems: ContainerQuantityItem[] = currentContainers.map((cp) => ({
        container: cp.container,
        quantity: cp.quantity,
      }));
      setItems(initialItems);
      setError(null);
    }
  }, [open, currentContainers]);

  // Get available containers (not already in the list)
  const availableContainers =
    allContainers?.filter(
      (c) => !items.some((item) => item.container.id === c.id)
    ) || [];

  const handleAddContainer = () => {
    if (!selectedContainer) return;
    if (newQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    // Create ContainerInfo from selected container (which is of type Container)
    const containerInfo: ContainerInfo = {
      id: selectedContainer.id,
      name: selectedContainer.name,
      type: selectedContainer.type,
      created_at: selectedContainer.created_at,
      updated_at: selectedContainer.updated_at,
      deleted_at: selectedContainer.deleted_at,
    };

    setItems([...items, { container: containerInfo, quantity: newQuantity }]);
    setSelectedContainer(null);
    setNewQuantity(1);
    setError(null);
  };

  const handleRemoveContainer = (containerId: number) => {
    setItems(items.filter((item) => item.container.id !== containerId));
  };

  const handleQuantityChange = (containerId: number, quantity: number) => {
    if (quantity < 0) return;
    setItems(
      items.map((item) =>
        item.container.id === containerId ? { ...item, quantity } : item
      )
    );
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      // Build list of all containers that changed
      const changes: Array<{ containerId: number; quantity: number }> = [];

      // 1. Containers with quantity changes (modified quantities)
      items.forEach((item) => {
        const current = currentContainers.find(
          (cc) => cc.container.id === item.container.id
        );
        if (!current || current.quantity !== item.quantity) {
          changes.push({
            containerId: item.container.id,
            quantity: item.quantity,
          });
        }
      });

      // 2. Removed containers (set quantity to 0 for soft delete)
      const removedContainers = currentContainers.filter(
        (cc) => !items.some((item) => item.container.id === cc.container.id)
      );

      removedContainers.forEach((cc) => {
        changes.push({
          containerId: cc.container.id,
          quantity: 0,
        });
      });

      // If no changes, just close the dialog
      if (changes.length === 0) {
        onClose();
        return;
      }

      // Make API calls for all changes (in parallel for speed)
      await Promise.all(
        changes.map((change) => {
          const dto: SetProductsDto = {
            containerId: change.containerId,
            items: [
              {
                productId,
                quantity: change.quantity,
              },
            ],
          };
          return setProductsMutation.mutateAsync(dto);
        })
      );

      // Success - trigger refetch and close
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        'Failed to update containers. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    // Check if there are any differences
    if (items.length !== currentContainers.length) return true;

    return items.some((item) => {
      const current = currentContainers.find(
        (cc) => cc.container.id === item.container.id
      );
      return !current || current.quantity !== item.quantity;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Manage Containers for {productName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Add Container Section */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            mb: 3,
            mt: 1,
          }}
        >
          <Autocomplete
            value={selectedContainer}
            onChange={(_, value) => setSelectedContainer(value)}
            onInputChange={(_, value) => setSearch(value)}
            options={availableContainers}
            getOptionLabel={(option) => `${option.name} (${option.type})`}
            loading={containersLoading}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Container"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {containersLoading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          <TextField
            label="Quantity"
            type="number"
            size="small"
            value={newQuantity}
            onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
            sx={{ width: 120 }}
            inputProps={{ min: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddContainer}
            disabled={!selectedContainer || newQuantity <= 0}
          >
            Add
          </Button>
        </Box>

        {/* Containers Table */}
        {items.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Container</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.container.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item.container.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.container.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.container.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        sx={{ width: 100 }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveContainer(item.container.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              This product is not stored in any containers yet. Add containers using the form above.
            </Typography>
          </Box>
        )}

        {/* Summary */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Chip
            label={`${items.length} container${items.length !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${items.reduce((sum, i) => sum + i.quantity, 0)} total quantity`}
            size="small"
            color="success"
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !hasChanges()}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageContainersDialog;
