import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  IconButton,
  Chip,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { ProductFormDialog } from './components';
import { BulkProductFormDialog } from './components/BulkProductFormDialog';
import { useProductsInfinite, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts';
import type { Product, CreateProductDto, UpdateProductDto } from '../../types';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();

  // Search state
  const [search, setSearch] = useState('');

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Infinite scroll ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // Data fetching with infinite scroll
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useProductsInfinite(search || undefined);

  // Flatten all pages into single array for rendering
  const products = data?.pages ? data.pages.flatMap((page) => page?.items ?? []) : [];

  // Get total count from first page
  const totalCount = data?.pages?.[0]?.total ?? 0;

  // Only show full loading on initial load (no data yet)
  const showFullLoading = isLoading && !data;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Load next page when observer target is visible
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Handlers
  const handleOpenCreateDialog = () => {
    setSelectedProduct(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleFormSubmit = (data: CreateProductDto) => {
    if (selectedProduct) {
      updateMutation.mutate(
        { id: selectedProduct.id, data: data as UpdateProductDto },
        {
          onSuccess: () => handleCloseFormDialog(),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => handleCloseFormDialog(),
      });
    }
  };

  const handleOpenDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id, {
        onSuccess: () => handleCloseDeleteDialog(),
      });
    }
  };

  const handleViewProduct = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Define table columns for ResponsiveTable
  const columns = [
    {
      id: 'name',
      label: 'Name',
      render: (product: Product) => (
        <Typography variant="body2" fontWeight={600}>
          {product.name}
        </Typography>
      ),
    },
    {
      id: 'company_sku',
      label: 'Company SKU',
      render: (product: Product) => (
        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
          {product.company_sku || '-'}
        </Typography>
      ),
      hideOnMobile: true,
    },

    {
      id: 'displayName',
      label: 'Display Name',
      mobileLabel: 'Display',
      align: 'right' as const,
      render: (product: Product) => (
        <Typography variant="body2">{product.display_name || '-'}</Typography>
      ),
      hideOnMobile: true,
    },
    {
      id: 'product_type',
      label: 'Type',
      render: (product: Product) => (
        product.product_type ? (
          <Chip label={product.product_type} size="small" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )
      ),
      hideOnMobile: true,
    },
    {
      id: 'size',
      label: 'Size',
      render: (product: Product) => <Typography variant="body2">{product.size || '-'}</Typography>,
      hideOnMobile: true,
    },
    {
      id: 'packing',
      label: 'Packing',
      render: (product: Product) => <Typography variant="body2">{product.packing || '-'}</Typography>,
      hideOnMobile: true,
    },
    {
      id: 'salePrice',
      label: 'Sale Price',
      mobileLabel: 'Sale',
      align: 'right' as const,
      render: (product: Product) => (
        <Chip
          label={formatCurrency(product.default_sale_price)}
          size="small"
          color="success"
          variant="outlined"
        />
      ),
    },
    {
      id: 'quantity',
      label: 'Total Qty',
      mobileLabel: 'Qty',
      align: 'center' as const,
      render: (product: Product) => (
        <Chip
          label={product.totalQuantity}
          size="small"
          color={product.totalQuantity > 0 ? 'primary' : 'default'}
          variant={product.totalQuantity > 0 ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (product: Product) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleViewProduct(product);
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditDialog(product);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDeleteDialog(product);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Render content for the table area
  const renderTableContent = () => {
    if (showFullLoading) {
      return <LoadingState message="Loading products..." />;
    }

    if (isError) {
      return <ErrorState onRetry={() => refetch()} />;
    }

    if (!products || products.length === 0) {
      return (
        <EmptyState
          title="No products found"
          message={search ? 'Try a different search term' : 'Add your first product to get started'}
          actionLabel={!search ? 'Add Product' : undefined}
          onAction={!search ? handleOpenCreateDialog : undefined}
        />
      );
    }

    return (
      <>
        <ResponsiveTable
          columns={columns}
          data={products}
          keyExtractor={(product) => product.id.toString()}
          onRowClick={handleViewProduct}
          emptyMessage="No products found"
        />

        {/* Infinite scroll trigger and loading indicator */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          {/* Invisible div that triggers intersection observer */}
          <div ref={observerTarget} style={{ height: '20px' }} />

          {/* Loading indicator while fetching next page */}
          {isFetchingNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Loading more products...
              </Typography>
            </Box>
          )}

          {/* End of results indicator */}
          {!hasNextPage && products.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              All products loaded ({totalCount} total)
            </Typography>
          )}
        </Box>
      </>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle={
          totalCount > 0
            ? `${totalCount} products in your catalog (showing ${products.length})`
            : 'Manage your product catalog'
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setBulkDialogOpen(true)}>
              Bulk Create
            </Button>
            <Button variant="contained" onClick={handleOpenCreateDialog}>
              Add Product
            </Button>
          </Box>
        }
      />

      {/* Search bar - always visible */}
      <Box sx={{ mb: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: { xs: '100%', sm: '200px' } }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, size, or packing..."
          />
        </Box>
        {/* Show searching indicator (not for next page fetch) */}
        {isFetching && !isFetchingNextPage && !showFullLoading && (
          <Typography variant="caption" color="text.secondary">
            Searching...
          </Typography>
        )}
      </Box>

      {/* Products table */}
      <Card>
        {renderTableContent()}
      </Card>

      {/* Create/Edit Dialog */}
      <ProductFormDialog
        open={formDialogOpen}
        product={selectedProduct}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleFormSubmit}
        onClose={handleCloseFormDialog}
      />

      {/* Bulk Create Dialog */}
      <BulkProductFormDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />
    </Box>
  );
};

export default ProductsPage;
