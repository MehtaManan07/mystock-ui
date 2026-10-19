import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';
import { Plus, Trash2, X } from 'lucide-react';
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
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Bulk Add Containers</DialogTitle>
        </DialogHeader>

        <div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="pr-6">{error}</AlertDescription>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss error"
                onClick={() => setError(null)}
                className="absolute top-2 right-2"
              >
                <X />
              </Button>
            </Alert>
          )}

          {/* Add Row Button */}
          <div className="mt-2 mb-4 flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              disabled={isLoading || rows.length >= 20}
            >
              <Plus />
              Add Row
            </Button>
            <Badge variant="outline" className="border-primary text-primary">
              {`${rows.length} container${rows.length !== 1 ? 's' : ''}`}
            </Badge>
          </div>

          {/* Containers Table */}
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-[50%]">Container Name *</TableHead>
                  <TableHead className="w-[40%]">Type</TableHead>
                  <TableHead className="w-[10%] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={cn(row.error && 'bg-destructive/10')}
                  >
                    <TableCell className="align-top">
                      <Input
                        className="h-8"
                        value={row.name}
                        onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                        placeholder={`e.g., Container-${index + 1}`}
                        aria-invalid={!!row.error}
                        disabled={isLoading}
                        autoFocus={index === 0}
                      />
                      {row.error && (
                        <p className="mt-1 text-sm text-destructive">{row.error}</p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <Select
                        value={row.type}
                        onValueChange={(value) =>
                          handleRowChange(row.id, 'type', value as ContainerType)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CONTAINER_TYPES.SINGLE}>
                            Single (one product)
                          </SelectItem>
                          <SelectItem value={CONTAINER_TYPES.MIXED}>
                            Mixed (multiple products)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center align-top">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Remove row"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveRow(row.id)}
                              disabled={isLoading || rows.length === 1}
                            >
                              <Trash2 />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Remove row</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Helper Text */}
          <div className="mt-4">
            <span className="text-xs text-muted-foreground">
              You can add up to 20 containers in a single operation. Each container name must be unique.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || rows.length === 0}
          >
            {isLoading ? 'Creating...' : `Create ${rows.length} Container${rows.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkContainerFormDialog;
