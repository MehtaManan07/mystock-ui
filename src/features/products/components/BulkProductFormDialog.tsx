import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, PackageOpen, Plus, Trash2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from 'cn';
import { productFormSchema, type ProductFormData, type ContainerQuantity } from '../schemas/productSchema';
import { useCreateProductsBulk } from '../../../hooks/useProducts';
import { useContainers, useCreateContainer } from '../../../hooks/useContainers';
import { useSetContainerProducts } from '../../../hooks/useContainerProducts';
import { EmptyState } from '../../../components/common/EmptyState';
import { ResponsiveTable } from '../../../components/common/ResponsiveTable';
import { CONTAINER_TYPES } from '../../../constants';
import type { CreateProductDto } from '../../../types';

interface BulkProductFormDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ProductInList extends CreateProductDto {
  id: string;
  containers?: ContainerQuantity[];
}

export const BulkProductFormDialog: React.FC<BulkProductFormDialogProps> = ({ open, onClose }) => {
  const createBulkMutation = useCreateProductsBulk();
  const { data: containersData } = useContainers();
  const existingContainers = Array.isArray(containersData) ? containersData : [];
  const createContainerMutation = useCreateContainer();
  const setContainerProductsMutation = useSetContainerProducts();

  // Product list state
  const [products, setProducts] = useState<ProductInList[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Container selection state for current product
  const [currentContainers, setCurrentContainers] = useState<ContainerQuantity[]>([]);
  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerType, setNewContainerType] = useState<string>('single');
  const [containerNameOpen, setContainerNameOpen] = useState(false);

  // Form state for adding new product
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    size: '',
    packing: '',
    company_sku: '',
    default_sale_price: '',
    default_purchase_price: '',
    display_name: '',
    description: '',
    mrp: '',
    tags: '',
    product_type: '',
    dimension_width: '',
    dimension_height: '',
    dimension_length: '',
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setProducts([]);
      setFormData({
        name: '',
        size: '',
        packing: '',
        company_sku: '',
        default_sale_price: '',
        default_purchase_price: '',
        display_name: '',
        description: '',
        mrp: '',
        tags: '',
        product_type: '',
        dimension_width: '',
        dimension_height: '',
        dimension_length: '',
        containers: [],
      });
      setError(null);
      setCurrentContainers([]);
      setNewContainerName('');
      setNewContainerType('single');
    }
  }, [open]);

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddContainerQuantity = async () => {
    if (!newContainerName.trim()) {
      setError('Container name is required');
      return;
    }

    if (!newContainerType.trim()) {
      setError('Container type is required');
      return;
    }

    // Check if container with this name already exists
    const existingContainer = existingContainers.find(
      c => c.name.toLowerCase() === newContainerName.toLowerCase()
    );

    let containerToAdd: ContainerQuantity;

    if (existingContainer) {
      // Use existing container
      containerToAdd = {
        container_id: existingContainer.id,
        container_name: existingContainer.name,
        container_type: existingContainer.type,
        quantity: '0',
      };
    } else {
      // Will create new container during product creation
      containerToAdd = {
        container_name: newContainerName.trim(),
        container_type: newContainerType,
        quantity: '0',
      };
    }

    setCurrentContainers([...currentContainers, containerToAdd]);
    setNewContainerName('');
    setNewContainerType('single');
    setError(null);
  };

  const handleRemoveContainerQuantity = (index: number) => {
    setCurrentContainers(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateContainerQuantity = (index: number, quantity: string) => {
    setCurrentContainers(prev =>
      prev.map((c, i) => (i === index ? { ...c, quantity } : c))
    );
  };

  const handleAddProduct = () => {
    // Validate form data
    const validation = productFormSchema.safeParse(formData);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid form data';
      setError(errorMessage);
      return;
    }

    // Additional validation for required fields
    if (!formData.name.trim() || !formData.size.trim() || !formData.packing.trim()) {
      setError('Name, Size, and Packing are required');
      return;
    }

    if (!formData.default_sale_price || !formData.default_purchase_price) {
      setError('Sale Price and Purchase Price are required');
      return;
    }

    // Parse and validate numeric fields
    const salePrice = parseFloat(formData.default_sale_price);
    const purchasePrice = parseFloat(formData.default_purchase_price);

    if (isNaN(salePrice) || salePrice < 0) {
      setError('Sale Price must be a valid positive number');
      return;
    }

    if (isNaN(purchasePrice) || purchasePrice < 0) {
      setError('Purchase Price must be a valid positive number');
      return;
    }

    // Parse optional numeric fields
    const mrp = formData.mrp ? parseFloat(formData.mrp) : undefined;
    if (formData.mrp && (isNaN(mrp!) || mrp! < 0)) {
      setError('MRP must be a valid positive number');
      return;
    }

    // Parse dimensions if provided
    let dimensions: { width: number; height: number; length: number } | undefined;
    if (formData.dimension_width || formData.dimension_height || formData.dimension_length) {
      const width = parseFloat(formData.dimension_width);
      const height = parseFloat(formData.dimension_height);
      const length = parseFloat(formData.dimension_length);

      if (isNaN(width) || isNaN(height) || isNaN(length)) {
        setError('All dimension fields must be provided if any are set');
        return;
      }

      if (width <= 0 || height <= 0 || length <= 0) {
        setError('All dimensions must be greater than 0');
        return;
      }

      dimensions = { width, height, length };
    }

    // Parse tags
    const tags = formData.tags
      ? formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : undefined;

    // Create product DTO
    const newProduct: ProductInList = {
      id: `${Date.now()}-${Math.random()}`,
      name: formData.name.trim(),
      size: formData.size.trim(),
      packing: formData.packing.trim(),
      company_sku: formData.company_sku.trim() || undefined,
      default_sale_price: salePrice,
      default_purchase_price: purchasePrice,
      display_name: formData.display_name.trim() || '',
      description: formData.description.trim() || undefined,
      mrp: mrp ?? salePrice * 3,
      tags,
      product_type: formData.product_type.trim() || undefined,
      dimensions,
      containers: currentContainers.length > 0 ? currentContainers : undefined,
    };

    // Add to products list
    setProducts(prev => [...prev, newProduct]);

    // Reset form
    setFormData({
      name: '',
      size: '',
      packing: '',
      company_sku: '',
      default_sale_price: '',
      default_purchase_price: '',
      display_name: '',
      description: '',
      mrp: '',
      tags: '',
      product_type: '',
      dimension_width: '',
      dimension_height: '',
      dimension_length: '',
      containers: [],
    });
    setCurrentContainers([]);
    setNewContainerName('');
    setNewContainerType('single');
    setError(null);
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleClearAll = () => {
    setProducts([]);
  };

  const handleSubmit = async () => {
    if (products.length === 0) {
      setError('Please add at least one product');
      return;
    }

    try {
      // Remove temporary IDs and container data before submitting
      const productsToCreate = products.map(({ id, containers, ...product }) => product);

      const createdProducts = await createBulkMutation.mutateAsync(productsToCreate);

      // Handle inventory setup for products with containers
      const productsWithContainers = products.filter(p => p.containers && p.containers.length > 0);

      if (productsWithContainers.length > 0 && createdProducts.length > 0) {
        // Create new containers if needed and link products
        for (let i = 0; i < createdProducts.length; i++) {
          const createdProduct = createdProducts[i];
          const originalProduct = productsWithContainers[i];

          if (!originalProduct || !originalProduct.containers) continue;

          // Handle each container for this product
          for (const containerQty of originalProduct.containers) {
            let containerId = containerQty.container_id;

            // Create new container if needed
            if (!containerId) {
              const newContainer = await createContainerMutation.mutateAsync({
                name: containerQty.container_name,
                type: containerQty.container_type as any,
              });
              containerId = newContainer.id;
            }

            // Parse quantity
            const quantity = parseInt(containerQty.quantity, 10);
            if (!isNaN(quantity) && quantity > 0 && containerId) {
              // Set product quantity in container
              await setContainerProductsMutation.mutateAsync({
                containerId,
                items: [{
                  productId: createdProduct.id,
                  quantity,
                }],
              });
            }
          }
        }
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create products');
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '-';
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col max-sm:inset-0 max-sm:h-full max-sm:max-h-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Bulk Create Products</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mt-1 grid grid-cols-12 gap-6 px-1">
            {/* Left Panel - Product Entry Form */}
            <div className="col-span-12 md:col-span-6">
              <Card>
                <CardHeader className="border-b border-border/70 pb-5">
                  <CardTitle className="text-base font-semibold">Add product</CardTitle>
                </CardHeader>
                <CardContent>
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

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-name">Product Name *</Label>
                      <Input
                        id="bulk-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter product name"
                        autoFocus
                      />
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-6">
                      <Label htmlFor="bulk-size">Size *</Label>
                      <Input
                        id="bulk-size"
                        value={formData.size}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        placeholder="e.g., 25kg, 1L, 500g"
                      />
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-6">
                      <Label htmlFor="bulk-packing">Packing *</Label>
                      <Input
                        id="bulk-packing"
                        value={formData.packing}
                        onChange={(e) => handleInputChange('packing', e.target.value)}
                        placeholder="e.g., Bag, Box, Bottle"
                      />
                    </div>

                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-company-sku">Company SKU (Optional)</Label>
                      <Input
                        id="bulk-company-sku"
                        value={formData.company_sku}
                        onChange={(e) => handleInputChange('company_sku', e.target.value)}
                        placeholder="e.g., SKU-001, PROD-ABC"
                        className="font-mono"
                      />
                    </div>

                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-display-name">Display Name</Label>
                      <Input
                        id="bulk-display-name"
                        value={formData.display_name}
                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                        placeholder="Display name"
                      />
                    </div>

                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-description">Description (Optional)</Label>
                      <Textarea
                        id="bulk-description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Product description"
                        rows={2}
                      />
                    </div>

                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-product-type">Product Type (Optional)</Label>
                      <Input
                        id="bulk-product-type"
                        value={formData.product_type}
                        onChange={(e) => handleInputChange('product_type', e.target.value)}
                        placeholder="e.g., Home Decor, Wedding Gifts"
                      />
                    </div>

                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-tags">Tags (Optional)</Label>
                      <Input
                        id="bulk-tags"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="Comma-separated tags"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate multiple tags with commas
                      </p>
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-6">
                      <Label htmlFor="bulk-sale-price">Default Sale Price *</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          id="bulk-sale-price"
                          type="number"
                          step="0.01"
                          min={0}
                          className="pl-7 tabular-nums"
                          value={formData.default_sale_price}
                          onChange={(e) =>
                            handleInputChange('default_sale_price', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-6">
                      <Label htmlFor="bulk-mrp">MRP (Optional)</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          id="bulk-mrp"
                          type="number"
                          step="0.01"
                          min={0}
                          className="pl-7 tabular-nums"
                          value={formData.mrp}
                          onChange={(e) => handleInputChange('mrp', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-purchase-price">Default Purchase Price *</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          id="bulk-purchase-price"
                          type="number"
                          step="0.01"
                          min={0}
                          className="pl-7 tabular-nums"
                          value={formData.default_purchase_price}
                          onChange={(e) =>
                            handleInputChange('default_purchase_price', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-4">
                      <Label htmlFor="bulk-dimension-width">Width (cm)</Label>
                      <Input
                        id="bulk-dimension-width"
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData.dimension_width}
                        onChange={(e) => handleInputChange('dimension_width', e.target.value)}
                        placeholder="Width"
                      />
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-4">
                      <Label htmlFor="bulk-dimension-height">Height (cm)</Label>
                      <Input
                        id="bulk-dimension-height"
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData.dimension_height}
                        onChange={(e) => handleInputChange('dimension_height', e.target.value)}
                        placeholder="Height"
                      />
                    </div>

                    <div className="col-span-12 grid gap-2 sm:col-span-4">
                      <Label htmlFor="bulk-dimension-length">Length (cm)</Label>
                      <Input
                        id="bulk-dimension-length"
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData.dimension_length}
                        onChange={(e) => handleInputChange('dimension_length', e.target.value)}
                        placeholder="Length"
                      />
                    </div>

                    {/* Container Section */}
                    <div className="col-span-12">
                      <p className="mt-2 mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Container &amp; quantity (optional)
                      </p>
                    </div>

                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-container-name">Container Name</Label>
                      <Popover open={containerNameOpen} onOpenChange={setContainerNameOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            id="bulk-container-name"
                            variant="outline"
                            role="combobox"
                            aria-expanded={containerNameOpen}
                            size="sm"
                            className="w-full justify-between font-normal"
                          >
                            <span
                              className={cn(
                                'truncate',
                                !newContainerName && 'text-muted-foreground'
                              )}
                            >
                              {newContainerName || 'Select or type new container name'}
                            </span>
                            <ChevronDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-(--radix-popover-trigger-width) p-0"
                          align="start"
                        >
                          {/* freeSolo: the typed text is itself the value, so the input writes
                              straight through to `newContainerName`. */}
                          <Command>
                            <CommandInput
                              placeholder="Select or type new container name"
                              value={newContainerName}
                              onValueChange={setNewContainerName}
                            />
                            <CommandList>
                              <CommandEmpty>No options</CommandEmpty>
                              <CommandGroup>
                                {existingContainers.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={c.name}
                                    onSelect={() => {
                                      setNewContainerName(c.name);
                                      setContainerNameOpen(false);
                                    }}
                                  >
                                    {c.name}
                                    <Check
                                      className={cn(
                                        'ml-auto',
                                        newContainerName === c.name ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="col-span-12 grid gap-2">
                      <Label htmlFor="bulk-container-type">Container Type</Label>
                      <Select value={newContainerType} onValueChange={setNewContainerType}>
                        <SelectTrigger id="bulk-container-type" size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONTAINER_TYPES).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-12">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleAddContainerQuantity}
                      >
                        <Plus />
                        Add container
                      </Button>
                    </div>

                    {/* Display Selected Containers */}
                    {currentContainers.length > 0 && (
                      <>
                        <div className="col-span-12">
                          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Selected containers
                          </p>
                        </div>
                        {currentContainers.map((container, index) => (
                          <div className="col-span-12" key={index}>
                            <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/40 p-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {container.container_name}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {container.container_type}
                                </p>
                              </div>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                aria-label="Qty"
                                placeholder="Qty"
                                className="h-8 w-20 text-right tabular-nums"
                                value={container.quantity}
                                onChange={(e) =>
                                  handleUpdateContainerQuantity(index, e.target.value)
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Remove container"
                                onClick={() => handleRemoveContainerQuantity(index)}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    <div className="col-span-12">
                      <Button type="button" className="w-full" onClick={handleAddProduct}>
                        <Plus />
                        Add to list
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Preview Table */}
            <div className="col-span-12 md:col-span-6">
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-border/70 pb-5">
                  <CardTitle className="text-base font-semibold">Products to create</CardTitle>
                  {products.length > 0 && (
                    <CardAction>
                      <Badge variant="outline" className="tabular-nums">
                        {products.length} product{products.length !== 1 ? 's' : ''}
                      </Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="px-0">
                  {products.length === 0 ? (
                    <EmptyState
                      compact
                      icon={<PackageOpen />}
                      title="Nothing queued yet"
                      message="Fill in the form on the left and choose “Add to list” to queue products for creation."
                    />
                  ) : (
                    <>
                      <ResponsiveTable
                        columns={[
                          {
                            id: 'name',
                            label: 'Name',
                            render: (row: any) => (
                              <p className="text-sm font-medium">{row.name}</p>
                            )
                          },
                          {
                            id: 'size',
                            label: 'Size',
                            render: (row: any) => <p className="text-sm">{row.size}</p>
                          },
                          {
                            id: 'packing',
                            label: 'Packing',
                            render: (row: any) => <p className="text-sm">{row.packing}</p>
                          },
                          {
                            id: 'containers',
                            label: 'Containers',
                            hideOnMobile: true,
                            render: (row: any) => row.containers ? (
                              <div className="flex flex-col gap-1">
                                {row.containers.map((c: any, idx: number) => (
                                  <span key={idx} className="text-xs text-muted-foreground tabular-nums">
                                    {c.container_name}: {c.quantity}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">-</p>
                            )
                          },
                          {
                            id: 'sale_price',
                            label: 'Sale Price',
                            numeric: true,
                            hideOnMobile: true,
                            render: (row: any) => (
                              <span className="text-sm font-medium text-success">
                                {row.sale_price}
                              </span>
                            )
                          },
                          {
                            id: 'purchase_price',
                            label: 'Purchase Price',
                            numeric: true,
                            hideOnMobile: true,
                            render: (row: any) => <span className="text-sm">{row.purchase_price}</span>
                          },
                          {
                            id: 'actions',
                            label: 'Actions',
                            align: 'right' as const,
                            isAction: true,
                            render: (row: any) => row.actions
                          },
                        ]}
                        data={products.map(product => ({
                          id: product.id,
                          name: product.name,
                          size: product.size,
                          packing: product.packing,
                          containers: product.containers,
                          sale_price: formatCurrency(product.default_sale_price),
                          purchase_price: formatCurrency(product.default_purchase_price),
                          actions: (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRemoveProduct(product.id)}
                              aria-label="delete"
                            >
                              <Trash2 />
                            </Button>
                          ),
                        }))}
                        keyExtractor={(row) => row.id}
                      />

                      <div className="flex justify-end border-t border-border/70 px-6 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={handleClearAll}
                        >
                          <Trash2 />
                          Clear all
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createBulkMutation.isPending}
            className="max-sm:w-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={products.length === 0 || createBulkMutation.isPending}
            className="max-sm:w-full"
          >
            {createBulkMutation.isPending ? 'Creating...' : `Create ${products.length} Product${products.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkProductFormDialog;
