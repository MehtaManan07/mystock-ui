import React, { useState, useEffect } from 'react';
import { Loader2, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '../Combobox';
import { useProductContainers } from '../../../../hooks/useContainerProducts';
import { ManageContainersDialog } from '../../../products/components/ManageContainersDialog';
import type { ContainerProduct, ContainerProductInfo } from '../../../../types';
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

  useEffect(() => {
    if (!isLoading && options.length === 1 && !value) {
      onChange(options[0]);
    }
  }, [isLoading, options, value, onChange]);

  // Needed by ManageContainersDialog to pre-populate its form
  const currentContainers: ContainerProductInfo[] = (containerProducts ?? [])
    .filter((cp: ContainerProduct) => cp.container)
    .map((cp: ContainerProduct) => ({
      container: cp.container!,
      quantity: cp.quantity,
    }));

  if (isLoading) {
    return <Loader2 className="size-5 animate-spin" />;
  }

  if (options.length === 0) {
    return (
      <>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            No stock available
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-warning text-warning hover:text-warning"
            onClick={() => setAssignDialogOpen(true)}
          >
            <Warehouse />
            Assign Container
          </Button>
        </div>
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
    <div className="min-w-[220px]">
      <Combobox
        value={value}
        onChange={onChange}
        options={options}
        getOptionKey={(o) => o.id}
        getOptionLabel={(o) => `${o.name} (${o.availableQty} items avail)`}
        placeholder="Select container"
        searchPlaceholder="Search containers..."
        emptyText="No stock in any container"
        invalid={!value}
        renderOption={(option) => (
          <div className="flex w-full justify-between gap-2">
            <span className="truncate">{option.name}</span>
            <Badge variant="outline" className="border-success/50 text-success">
              {option.availableQty} items
            </Badge>
          </div>
        )}
      />
      {!value && <p className="mt-1 text-sm text-destructive">Required</p>}
    </div>
  );
};
