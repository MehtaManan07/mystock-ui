import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Alert,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Box,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { productFormSchema, type ProductFormData, type ContainerQuantity } from '../schemas/productSchema';
import { useCreateProductsBulk } from '../../../hooks/useProducts';
import { useContainers, useCreateContainer } from '../../../hooks/useContainers';
import { useSetContainerProducts } from '../../../hooks/useContainerProducts';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>Bulk Create Products</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Left Panel - Product Entry Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add Product
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      label="Product Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter product name"
                      autoFocus
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Size"
                      value={formData.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      placeholder="e.g., 25kg, 1L, 500g"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Packing"
                      value={formData.packing}
                      onChange={(e) => handleInputChange('packing', e.target.value)}
                      placeholder="e.g., Bag, Box, Bottle"
                      required
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      label="Company SKU (Optional)"
                      value={formData.company_sku}
                      onChange={(e) => handleInputChange('company_sku', e.target.value)}
                      placeholder="e.g., SKU-001, PROD-ABC"
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      label="Display Name"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      placeholder="Display name"
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      label="Description (Optional)"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Product description"
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      label="Product Type (Optional)"
                      value={formData.product_type}
                      onChange={(e) => handleInputChange('product_type', e.target.value)}
                      placeholder="e.g., Home Decor, Wedding Gifts"
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      label="Tags (Optional)"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="Comma-separated tags"
                      helperText="Separate multiple tags with commas"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Default Sale Price"
                      type="number"
                      value={formData.default_sale_price}
                      onChange={(e) => handleInputChange('default_sale_price', e.target.value)}
                      inputProps={{ step: '0.01', min: 0 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="MRP (Optional)"
                      type="number"
                      value={formData.mrp}
                      onChange={(e) => handleInputChange('mrp', e.target.value)}
                      inputProps={{ step: '0.01', min: 0 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      label="Default Purchase Price"
                      type="number"
                      value={formData.default_purchase_price}
                      onChange={(e) => handleInputChange('default_purchase_price', e.target.value)}
                      inputProps={{ step: '0.01', min: 0 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Width (cm)"
                      type="number"
                      value={formData.dimension_width}
                      onChange={(e) => handleInputChange('dimension_width', e.target.value)}
                      inputProps={{ step: '0.01', min: 0 }}
                      placeholder="Width"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Height (cm)"
                      type="number"
                      value={formData.dimension_height}
                      onChange={(e) => handleInputChange('dimension_height', e.target.value)}
                      inputProps={{ step: '0.01', min: 0 }}
                      placeholder="Height"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Length (cm)"
                      type="number"
                      value={formData.dimension_length}
                      onChange={(e) => handleInputChange('dimension_length', e.target.value)}
                      inputProps={{ step: '0.01', min: 0 }}
                      placeholder="Length"
                    />
                  </Grid>

                  {/* Container Section */}
                  <Grid size={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Container & Quantity (Optional)
                    </Typography>
                  </Grid>

                  <Grid size={12}>
                    <Autocomplete
                      freeSolo
                      options={existingContainers.map(c => c.name)}
                      value={newContainerName}
                      onChange={(_, value) => setNewContainerName(value || '')}
                      onInputChange={(_, value) => setNewContainerName(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Container Name"
                          placeholder="Select or type new container name"
                        />
                      )}
                      size="small"
                    />
                  </Grid>

                  <Grid size={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Container Type</InputLabel>
                      <Select
                        value={newContainerType}
                        onChange={(e) => setNewContainerType(e.target.value)}
                        label="Container Type"
                      >
                        {Object.entries(CONTAINER_TYPES).map(([key, value]) => (
                          <MenuItem key={key} value={value}>
                            {key.charAt(0) + key.slice(1).toLowerCase()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={12}>
                    <Button
                      variant="outlined"
                      onClick={handleAddContainerQuantity}
                      fullWidth
                      size="small"
                    >
                      Add Container
                    </Button>
                  </Grid>

                  {/* Display Selected Containers */}
                  {currentContainers.length > 0 && (
                    <>
                      <Grid size={12}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                          Selected Containers
                        </Typography>
                      </Grid>
                      {currentContainers.map((container, index) => (
                        <Grid size={12} key={index}>
                          <Box sx={{
                            display: 'flex',
                            gap: 1,
                            p: 1,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            alignItems: 'center',
                          }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2">
                                {container.container_name} ({container.container_type})
                              </Typography>
                            </Box>
                            <TextField
                              type="number"
                              size="small"
                              label="Qty"
                              value={container.quantity}
                              onChange={(e) => handleUpdateContainerQuantity(index, e.target.value)}
                              inputProps={{ min: 0, step: 1 }}
                              sx={{ width: 80 }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveContainerQuantity(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </>
                  )}

                  <Grid size={12}>
                    <Button
                      variant="contained"
                      onClick={handleAddProduct}
                      fullWidth
                      size="large"
                    >
                      Add to List
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Panel - Preview Table */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Products to Create
                  </Typography>
                  {products.length > 0 && (
                    <Chip label={`${products.length} product${products.length !== 1 ? 's' : ''}`} color="primary" />
                  )}
                </Box>

                {products.length === 0 ? (
                  <Alert severity="info">
                    No products added yet. Fill in the form on the left and click "Add to List" to add products.
                  </Alert>
                ) : (
                  <>
                    <ResponsiveTable
                      columns={[
                        {
                          id: 'name',
                          label: 'Name',
                          render: (row: any) => <Typography variant="body2">{row.name}</Typography>
                        },
                        {
                          id: 'size',
                          label: 'Size',
                          render: (row: any) => <Typography variant="body2">{row.size}</Typography>
                        },
                        {
                          id: 'packing',
                          label: 'Packing',
                          render: (row: any) => <Typography variant="body2">{row.packing}</Typography>
                        },
                        {
                          id: 'containers',
                          label: 'Containers',
                          hideOnMobile: true,
                          render: (row: any) => row.containers ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {row.containers.map((c: any, idx: number) => (
                                <Typography key={idx} variant="caption">
                                  {c.container_name}: {c.quantity}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2">-</Typography>
                          )
                        },
                        {
                          id: 'sale_price',
                          label: 'Sale Price',
                          hideOnMobile: true,
                          render: (row: any) => <Typography variant="body2">{row.sale_price}</Typography>
                        },
                        {
                          id: 'purchase_price',
                          label: 'Purchase Price',
                          hideOnMobile: true,
                          render: (row: any) => <Typography variant="body2">{row.purchase_price}</Typography>
                        },
                        {
                          id: 'actions',
                          label: 'Actions',
                          align: 'center' as const,
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
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveProduct(product.id)}
                            aria-label="delete"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        ),
                      }))}
                      keyExtractor={(row) => row.id}
                    />

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleClearAll}
                        size="small"
                      >
                        Clear All
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={createBulkMutation.isPending} fullWidth={isMobile}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={products.length === 0 || createBulkMutation.isPending}
          fullWidth={isMobile}
        >
          {createBulkMutation.isPending ? 'Creating...' : `Create ${products.length} Product${products.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkProductFormDialog;
