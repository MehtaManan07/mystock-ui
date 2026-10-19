import React, { useState, useEffect } from 'react';
import { Boxes, Check, ChevronDown, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from 'cn';
import { EmptyState } from '../../../components/common/EmptyState';
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
  const [containerPickerOpen, setContainerPickerOpen] = useState(false);
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Containers for {productName}</DialogTitle>
        </DialogHeader>

        <div>
          {error && (
            <Alert variant="destructive" className="mb-4 pr-10">
              <AlertDescription>{error}</AlertDescription>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Dismiss error"
                className="absolute top-2 right-2"
                onClick={() => setError(null)}
              >
                <X />
              </Button>
            </Alert>
          )}

          {/* Add Container Section */}
          <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/30 p-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="manage-containers-select">Select container</Label>
              <Popover open={containerPickerOpen} onOpenChange={setContainerPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    id="manage-containers-select"
                    variant="outline"
                    role="combobox"
                    aria-expanded={containerPickerOpen}
                    size="sm"
                    className="w-full justify-between font-normal"
                  >
                    <span className={cn('truncate', !selectedContainer && 'text-muted-foreground')}>
                      {selectedContainer
                        ? `${selectedContainer.name} (${selectedContainer.type})`
                        : 'Select Container'}
                    </span>
                    {containersLoading ? (
                      <Loader2 className="animate-spin opacity-50" />
                    ) : (
                      <ChevronDown className="opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Select Container"
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      {containersLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No options</CommandEmpty>
                          <CommandGroup>
                            {availableContainers.map((option) => (
                              <CommandItem
                                key={option.id}
                                value={`${option.name} (${option.type})`}
                                onSelect={() => {
                                  setSelectedContainer(option);
                                  setContainerPickerOpen(false);
                                }}
                              >
                                {option.name} ({option.type})
                                <Check
                                  className={cn(
                                    'ml-auto',
                                    selectedContainer?.id === option.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2 sm:w-[120px]">
              <Label htmlFor="manage-containers-quantity">Quantity</Label>
              <Input
                id="manage-containers-quantity"
                type="number"
                className="h-8 tabular-nums"
                min={1}
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleAddContainer}
              disabled={!selectedContainer || newQuantity <= 0}
            >
              <Plus />
              Add
            </Button>
          </div>

          {/* Containers Table */}
          {items.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border/70">
              <Table stickyHeader containerClassName="max-h-[45vh]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Container</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead numeric>Quantity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.container.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{item.container.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.container.type}
                        </Badge>
                      </TableCell>
                      <TableCell numeric>
                        <Input
                          type="number"
                          aria-label={`Quantity in ${item.container.name}`}
                          className="ml-auto h-8 w-[100px] text-right tabular-nums"
                          min={0}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.container.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Remove"
                              onClick={() => handleRemoveContainer(item.container.id)}
                            >
                              <Trash2 />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border">
              <EmptyState
                compact
                icon={<Boxes />}
                title="No containers yet"
                message="This product is not stored in any containers. Pick a container above and add it with a quantity."
              />
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary tabular-nums">
              {items.length} container{items.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success tabular-nums">
              {items.reduce((sum, i) => sum + i.quantity, 0)} total quantity
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || !hasChanges()}>
            {isSaving ? <Loader2 className="animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageContainersDialog;
