import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ProductFormDialog } from './components/ProductFormDialog';
import { useProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts';
import type { CreateProductDto, UpdateProductDto, Contact, CreateVendorSkuDto, UpdateVendorSkuDto } from '../../types';
import { format } from 'date-fns';
import { vendorSkusApi } from '../../api/vendorSkus.api';
import { contactsApi } from '../../api/contacts.api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = parseInt(id || '0', 10);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorSkuDialogOpen, setVendorSkuDialogOpen] = useState(false);
  const [editingVendorSku, setEditingVendorSku] = useState<{ vendor_id: number; vendor_sku: string } | null>(null);
  const [vendorSkuToDelete, setVendorSkuToDelete] = useState<{ vendor_id: number; vendor_name: string } | null>(null);

  // Form state for vendor SKU
  const [selectedVendorId, setSelectedVendorId] = useState<number | ''>('');
  const [vendorSkuValue, setVendorSkuValue] = useState('');

  // Data fetching
  const { data: product, isLoading, isError, refetch } = useProduct(productId);
  const queryClient = useQueryClient();

  // Fetch customers (vendors/marketplaces) for vendor SKU management
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.getAll(),
  });

  const customers = contacts?.filter(c => c.type === 'customer' || c.type === 'both') || [];

  // Vendor SKU mutations
  const createVendorSkuMutation = useMutation({
    mutationFn: (data: CreateVendorSkuDto) => vendorSkusApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      handleCloseVendorSkuDialog();
    },
  });

  const updateVendorSkuMutation = useMutation({
    mutationFn: ({ productId, vendorId, data }: { productId: number; vendorId: number; data: UpdateVendorSkuDto }) =>
      vendorSkusApi.update(productId, vendorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      handleCloseVendorSkuDialog();
    },
  });

  const deleteVendorSkuMutation = useMutation({
    mutationFn: ({ productId, vendorId }: { productId: number; vendorId: number }) =>
      vendorSkusApi.delete(productId, vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      setVendorSkuToDelete(null);
    },
  });

  // Mutations
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };

  const handleEditSubmit = (data: CreateProductDto) => {
    updateMutation.mutate(
      { id: productId, data: data as UpdateProductDto },
      {
        onSuccess: () => setEditDialogOpen(false),
      }
    );
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(productId, {
      onSuccess: () => {
        navigate('/products');
      },
    });
  };

  const handleOpenVendorSkuDialog = () => {
    setEditingVendorSku(null);
    setSelectedVendorId('');
    setVendorSkuValue('');
    setVendorSkuDialogOpen(true);
  };

  const handleOpenEditVendorSkuDialog = (vendorId: number, vendorSku: string) => {
    setEditingVendorSku({ vendor_id: vendorId, vendor_sku: vendorSku });
    setSelectedVendorId(vendorId);
    setVendorSkuValue(vendorSku);
    setVendorSkuDialogOpen(true);
  };

  const handleCloseVendorSkuDialog = () => {
    setVendorSkuDialogOpen(false);
    setEditingVendorSku(null);
    setSelectedVendorId('');
    setVendorSkuValue('');
  };

  const handleVendorSkuSubmit = () => {
    if (selectedVendorId && vendorSkuValue) {
      if (editingVendorSku) {
        // Update existing
        updateVendorSkuMutation.mutate({
          productId,
          vendorId: editingVendorSku.vendor_id,
          data: { vendor_sku: vendorSkuValue },
        });
      } else {
        // Create new
        createVendorSkuMutation.mutate({
          product_id: productId,
          vendor_id: selectedVendorId as number,
          vendor_sku: vendorSkuValue,
        });
      }
    }
  };

  const handleDeleteVendorSku = () => {
    if (vendorSkuToDelete) {
      deleteVendorSkuMutation.mutate({
        productId,
        vendorId: vendorSkuToDelete.vendor_id,
      });
    }
  };

  // Calculate total quantity from containers
  const totalQuantity = product?.containers?.reduce(
    (sum, cp) => sum + cp.quantity,
    0
  ) || 0;

  if (isLoading) {
    return <LoadingState message="Loading product details..." fullPage />;
  }

  if (isError || !product) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <Box>
      <PageHeader
        title={product.name}
        subtitle={`${product.size} • ${product.packing}`}
        breadcrumbs={[
          { label: 'Products', path: '/products' },
          { label: product.name },
        ]}
      />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Tooltip title="Back to Products">
          <IconButton onClick={() => navigate('/products')}>
            <BackIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Product">
          <IconButton onClick={() => setEditDialogOpen(true)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Product">
          <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Product Info Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {product.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Company SKU
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {product.company_sku || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Display Name
                  </Typography>
                  <Typography variant="body1">
                    {product.display_name || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body1">{product.size}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Packing
                  </Typography>
                  <Typography variant="body1">{product.packing}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Default Sale Price
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(product.default_sale_price)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Quantity
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={totalQuantity}
                      color={totalQuantity > 0 ? 'primary' : 'default'}
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Vendor SKU Management Card */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Vendor SKU Mappings ({product.vendor_skus?.length || 0})
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  size="small"
                  onClick={handleOpenVendorSkuDialog}
                >
                  Add Vendor SKU
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {product.vendor_skus && product.vendor_skus.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer/Vendor Name</TableCell>
                        <TableCell>Vendor SKU</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {product.vendor_skus.map((vs) => (
                        <TableRow key={vs.vendor_id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {vs.vendor_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {vs.vendor_sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditVendorSkuDialog(vs.vendor_id, vs.vendor_sku)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setVendorSkuToDelete({ vendor_id: vs.vendor_id, vendor_name: vs.vendor_name })}
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
                <Typography variant="body2" color="text.secondary">
                  No vendor SKU mappings yet. Add customer/marketplace-specific SKUs (e.g., deodap, meesho, amazon, flipkart).
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Containers Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Distribution ({product.containers?.length || 0} containers)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {product.containers && product.containers.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Container</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {product.containers.map((cp) => (
                        <TableRow
                          key={cp.container.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/containers/${cp.container.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {cp.container.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={cp.container.type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">{cp.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  This product is not stored in any containers yet.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Recent Logs Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity ({product.logs?.length || 0} logs)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {product.logs && product.logs.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>Container</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {product.logs.slice(0, 10).map((log) => (
                        <TableRow
                          key={log.id}
                          hover
                          sx={{ cursor: log.container ? 'pointer' : 'default' }}
                          onClick={() => log.container && navigate(`/containers/${log.container.id}`)}
                        >
                          <TableCell>
                            <Chip
                              label={log.action}
                              size="small"
                              color={
                                log.action === 'add' || log.action === 'purchase'
                                  ? 'success'
                                  : log.action === 'remove' || log.action === 'sale'
                                    ? 'error'
                                    : 'default'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {log.container ? (
                              <Chip
                                label={log.container.name}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">{log.quantity}</TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {formatDate(log.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No activity logs for this product.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <ProductFormDialog
        open={editDialogOpen}
        product={{
          ...product,
          totalQuantity,
        }}
        isLoading={updateMutation.isPending}
        onSubmit={handleEditSubmit}
        onClose={() => setEditDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Vendor SKU Dialog */}
      <Dialog open={vendorSkuDialogOpen} onClose={handleCloseVendorSkuDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVendorSku ? 'Edit Vendor SKU' : 'Add Vendor SKU'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Customer/Vendor"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={!!editingVendorSku}
              fullWidth
            >
              <MenuItem value="">Select a customer/vendor</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Vendor SKU"
              value={vendorSkuValue}
              onChange={(e) => setVendorSkuValue(e.target.value)}
              placeholder="Enter vendor's/customer's SKU for this product"
              helperText="The SKU used by this customer/marketplace for this product"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVendorSkuDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleVendorSkuSubmit}
            disabled={!selectedVendorId || !vendorSkuValue || createVendorSkuMutation.isPending || updateVendorSkuMutation.isPending}
          >
            {createVendorSkuMutation.isPending || updateVendorSkuMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Vendor SKU Confirmation */}
      <ConfirmDialog
        open={!!vendorSkuToDelete}
        title="Delete Vendor SKU"
        message={`Are you sure you want to delete the vendor SKU mapping for "${vendorSkuToDelete?.vendor_name}"? The system will fall back to using the company SKU.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteVendorSkuMutation.isPending}
        onConfirm={handleDeleteVendorSku}
        onCancel={() => setVendorSkuToDelete(null)}
      />
    </Box>
  );
};

export default ProductDetailPage;
