import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CONTAINER_TYPES, type ContainerType } from '../../../constants';
import type { Container, CreateContainerDto } from '../../../types';

// Validation schema
const containerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum([CONTAINER_TYPES.SINGLE, CONTAINER_TYPES.MIXED]),
});

type ContainerFormData = z.infer<typeof containerSchema>;

interface ContainerFormDialogProps {
  open: boolean;
  container?: Container | null;
  isLoading?: boolean;
  onSubmit: (data: CreateContainerDto) => void;
  onClose: () => void;
}

const containerTypeOptions: { value: ContainerType; label: string }[] = [
  { value: CONTAINER_TYPES.SINGLE, label: 'Single (one product only)' },
  { value: CONTAINER_TYPES.MIXED, label: 'Mixed (multiple products)' },
];

export const ContainerFormDialog: React.FC<ContainerFormDialogProps> = ({
  open,
  container,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const isEditing = !!container;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContainerFormData>({
    resolver: zodResolver(containerSchema),
    defaultValues: {
      name: '',
      type: CONTAINER_TYPES.MIXED,
    },
  });

  // Reset form when dialog opens/closes or container changes
  useEffect(() => {
    if (open) {
      if (container) {
        reset({
          name: container.name,
          type: container.type as ContainerType,
        });
      } else {
        reset({
          name: '',
          type: CONTAINER_TYPES.MIXED,
        });
      }
    }
  }, [open, container, reset]);

  const handleFormSubmit = (data: ContainerFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Container' : 'Add New Container'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="container-name">Container Name</Label>
              <Input
                id="container-name"
                {...register('name')}
                placeholder="e.g., Warehouse-A, Godown-1, Rack-3"
                aria-invalid={!!errors.name}
                disabled={isLoading}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="container-type">Container Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="container-type"
                      className="w-full"
                      aria-invalid={!!errors.type}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    >
                      <SelectValue placeholder="Container Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {containerTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContainerFormDialog;
