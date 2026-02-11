import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { z } from 'zod';
import { CONTAINER_TYPES, type ContainerType } from '../../../constants';
import type { BulkContainerRow, CreateContainerDto } from '../../../types';

// Validation schema
const bulkContainerRowSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(255).trim(),
  type: z.enum([CONTAINER_TYPES.SINGLE, CONTAINER_TYPES.MIXED]),
});

const bulkContainerFormSchema = z.object({
  rows: z.array(bulkContainerRowSchema)
    .min(1, 'At least one container is required')
    .max(20, 'Maximum 20 containers at once')
    .refine(
      (rows) => {
        const names = rows.map(r => r.name.toLowerCase());
        return names.length === new Set(names).size;
      },
      { message: 'Container names must be unique' }
    ),
});

interface BulkContainerFormDialogProps {
  open: boolean;
  isLoading?: boolean;
  onSubmit: (data: CreateContainerDto[]) => void;
  onClose: () => void;
}

export const BulkContainerFormDialog: React.FC<BulkContainerFormDialogProps> = ({
  open,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const [rows, setRows] = useState<BulkContainerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize with one empty row when dialog opens
  useEffect(() => {
    if (open) {
      setRows([createEmptyRow()]);
      setError(null);
    }
  }, [open]);

  const createEmptyRow = (): BulkContainerRow => ({
    id: `row-${Date.now()}-${Math.random()}`,
    name: '',
    type: CONTAINER_TYPES.MIXED,
    error: undefined,
  });

  const handleAddRow = () => {
    if (rows.length >= 20) {
      setError('Maximum 20 containers allowed per bulk operation');
      return;
    }
    setRows([...rows, createEmptyRow()]);
    setError(null);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length === 1) {
      setError('At least one container is required');
      return;
    }
    setRows(rows.filter((row) => row.id !== rowId));
    setError(null);
  };

  const handleRowChange = (rowId: string, field: keyof BulkContainerRow, value: string) => {
    setRows(rows.map((row) =>
      row.id === rowId ? { ...row, [field]: value, error: undefined } : row
    ));
    setError(null);
  };

  const handleSubmit = () => {
    // Validate the form
    const validation = bulkContainerFormSchema.safeParse({ rows });

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Validation failed';
      setError(errorMessage);

      // Mark rows with errors
      const updatedRows = rows.map((row) => {
        if (!row.name.trim()) {
          return { ...row, error: 'Name is required' };
        }
        return row;
      });
      setRows(updatedRows);
      return;
    }

    // Check for duplicate names
    const nameCounts = new Map<string, number>();
    rows.forEach((row) => {
      const name = row.name.toLowerCase().trim();
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    });

    const hasDuplicates = Array.from(nameCounts.values()).some(count => count > 1);
    if (hasDuplicates) {
      const updatedRows = rows.map((row) => {
        const name = row.name.toLowerCase().trim();
        if (nameCounts.get(name)! > 1) {
          return { ...row, error: 'Duplicate name' };
        }
        return row;
      });
      setRows(updatedRows);
      setError('Container names must be unique');
      return;
    }

    // Build the DTO array
    const data: CreateContainerDto[] = rows.map((row) => ({
      name: row.name.trim(),
      type: row.type,
    }));

    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Add Containers</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Add Row Button */}
        <Box sx={{ mb: 2, mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
            disabled={isLoading || rows.length >= 20}
            size="small"
          >
            Add Row
          </Button>
          <Chip
            label={`${rows.length} container${rows.length !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 2 }}
          />
        </Box>

        {/* Containers Table */}
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width="50%">Container Name *</TableCell>
                <TableCell width="40%">Type</TableCell>
                <TableCell width="10%" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  sx={{
                    bgcolor: row.error ? 'error.light' : 'transparent',
                  }}
                >
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={row.name}
                      onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                      placeholder={`e.g., Container-${index + 1}`}
                      error={!!row.error}
                      helperText={row.error}
                      disabled={isLoading}
                      autoFocus={index === 0}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={row.type}
                        onChange={(e) =>
                          handleRowChange(row.id, 'type', e.target.value as ContainerType)
                        }
                        disabled={isLoading}
                      >
                        <MenuItem value={CONTAINER_TYPES.SINGLE}>
                          Single (one product)
                        </MenuItem>
                        <MenuItem value={CONTAINER_TYPES.MIXED}>
                          Mixed (multiple products)
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Remove row">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={isLoading || rows.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Helper Text */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            You can add up to 20 containers in a single operation. Each container name must be unique.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || rows.length === 0}
        >
          {isLoading ? 'Creating...' : `Create ${rows.length} Container${rows.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkContainerFormDialog;
