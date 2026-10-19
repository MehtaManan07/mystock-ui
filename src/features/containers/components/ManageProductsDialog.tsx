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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Check, ChevronDown, Loader2, Plus, Trash2, X } from 'lucide-react';
import { cn } from 'cn';
import { useProducts } from '../../../hooks/useProducts';
import { useDebounce } from '../../../hooks/useDebounce';
import { useSetContainerProducts } from '../../../hooks/useContainerProducts';
import type { Product, ProductContainerInfo, SetProductsDto } from '../../../types';

interface ProductQuantityItem {
  product: Product;
  quantity: number;
}

interface ManageProductsDialogProps {
  open: boolean;
  containerId: number;
  containerName: string;
  currentProducts: ProductContainerInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ManageProductsDialog: React.FC<ManageProductsDialogProps> = ({
  open,
  containerId,
  containerName,
  currentProducts,
  onClose,
  onSuccess,
}) => {
  const [items, setItems] = useState<ProductQuantityItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Product search with debouncing
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);

  // Fetch all products for selection
  const { data: allProducts, isLoading: productsLoading } = useProducts(debouncedProductSearch);

  // Mutation to set products
  const setProductsMutation = useSetContainerProducts();

  // Initialize items from current products when dialog opens
  useEffect(() => {
    if (open && currentProducts) {
      const initialItems: ProductQuantityItem[] = currentProducts.map((cp) => ({
        product: {
          id: cp.product.id,
          name: cp.product.name,
          size: cp.product.size,
          packing: cp.product.packing,
          default_sale_price: null,
          default_purchase_price: null,
          display_name: null,
          company_sku: null,
          totalQuantity: 0,
          created_at: cp.product.created_at,
          updated_at: cp.product.updated_at,
          deleted_at: cp.product.deleted_at,
        },
        quantity: cp.quantity,
      }));
      setItems(initialItems);
      setError(null);
    }
  }, [open, currentProducts]);

  // Get available products (not already in the list)
  const availableProducts =
    allProducts?.filter(
      (p) => !items.some((item) => item.product.id === p.id)
    ) || [];

  const getProductLabel = (product: Product) =>
    `${product.name} (${product.size} - ${product.packing})`;

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts((previous) =>
      previous.some((p) => p.id === product.id)
        ? previous.filter((p) => p.id !== product.id)
        : [...previous, product]
    );
  };

  const handleAddProduct = () => {
    if (!selectedProducts || selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }
    if (newQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    // Filter out products already in the list
    const newItems = selectedProducts
      .filter((product) => !items.some((item) => item.product.id === product.id))
      .map((product) => ({
        product,
        quantity: newQuantity,
      }));

    if (newItems.length === 0) {
      setError('All selected products are already in the list');
      return;
    }

    setItems([...items, ...newItems]);
    setSelectedProducts([]);
    setNewQuantity(1);
    setError(null);
  };

  const handleRemoveProduct = (productId: number) => {
    setItems(items.filter((item) => item.product.id !== productId));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 0) return;
    setItems(
      items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleSave = async () => {
    // Build the DTO
    const dto: SetProductsDto = {
      containerId,
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    // Also include products that were removed (set quantity to 0)
    const removedProducts = currentProducts.filter(
      (cp) => !items.some((item) => item.product.id === cp.product.id)
    );

    removedProducts.forEach((cp) => {
      dto.items.push({
        productId: cp.product.id,
        quantity: 0, // This will soft-delete the relationship
      });
    });

    try {
      await setProductsMutation.mutateAsync(dto);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to update products. Please try again.');
    }
  };

  const hasChanges = () => {
    // Check if there are any differences
    if (items.length !== currentProducts.length) return true;

    return items.some((item) => {
      const current = currentProducts.find(
        (cp) => cp.product.id === item.product.id
      );
      return !current || current.quantity !== item.quantity;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Products in {containerName}</DialogTitle>
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

          {/* Add Product Section */}
          <div className="mt-2 mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="product-picker">Select Products</Label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="product-picker"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickerOpen}
                    className="h-auto min-h-8 w-full justify-between gap-2 py-1 font-normal"
                  >
                    <span className="flex flex-1 flex-wrap items-center gap-1">
                      {selectedProducts.length === 0 ? (
                        <span className="text-muted-foreground">
                          Search products...
                        </span>
                      ) : (
                        selectedProducts.map((product) => (
                          <Badge
                            key={product.id}
                            variant="secondary"
                            className="gap-1"
                          >
                            {product.name}
                            <span
                              role="button"
                              tabIndex={-1}
                              aria-label={`Remove ${product.name}`}
                              className="cursor-pointer opacity-70 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductSelection(product);
                              }}
                            >
                              <X className="size-3" />
                            </span>
                          </Badge>
                        ))
                      )}
                    </span>
                    {productsLoading ? (
                      <Loader2 className="size-4 animate-spin opacity-50" />
                    ) : (
                      <ChevronDown className="size-4 opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-(--radix-popover-trigger-width) p-0"
                >
                  {/* Results come pre-filtered from the debounced server search,
                      so cmdk's own filtering is disabled. */}
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search products..."
                      value={productSearch}
                      onValueChange={setProductSearch}
                    />
                    <CommandList>
                      {productsLoading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No products found.</CommandEmpty>
                          <CommandGroup>
                            {availableProducts.map((product) => {
                              const isSelected = selectedProducts.some(
                                (p) => p.id === product.id
                              );
                              return (
                                <CommandItem
                                  key={product.id}
                                  value={String(product.id)}
                                  onSelect={() => toggleProductSelection(product)}
                                >
                                  <Check
                                    className={cn(
                                      'size-4',
                                      isSelected ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {getProductLabel(product)}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-quantity">Quantity</Label>
              <Input
                id="new-quantity"
                type="number"
                min={1}
                className="h-8 w-full sm:w-[120px]"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            <Button
              onClick={handleAddProduct}
              disabled={!selectedProducts || selectedProducts.length === 0 || newQuantity <= 0}
            >
              <Plus />
              {selectedProducts.length > 1 ? `Add ${selectedProducts.length}` : 'Add'}
            </Button>
          </div>

          {/* Products Table */}
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Packing</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{item.product.name}</p>
                      </TableCell>
                      <TableCell>{item.product.size}</TableCell>
                      <TableCell>{item.product.packing}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          className="ml-auto h-8 w-[100px]"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.product.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Remove"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveProduct(item.product.id)}
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
            <div className="rounded-md bg-accent py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No products in this container. Add products using the form above.
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 flex gap-4">
            <Badge variant="outline" className="border-primary text-primary">
              {`${items.length} products`}
            </Badge>
            <Badge variant="outline" className="border-success text-success">
              {`${items.reduce((sum, i) => sum + i.quantity, 0)} total quantity`}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setProductsMutation.isPending || !hasChanges()}
          >
            {setProductsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageProductsDialog;
