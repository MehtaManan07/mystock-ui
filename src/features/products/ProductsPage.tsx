import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Eye, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { formatQuantityDisplay } from '../../utils/packing';
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

  // Search state – synced with URL ?q=
  const [search, setSearch] = useUrlParam('q');

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
        <p className="text-sm font-semibold">{product.name}</p>
      ),
    },
    {
      id: 'company_sku',
      label: 'Company SKU',
      render: (product: Product) => (
        <p className="font-mono text-sm text-muted-foreground">
          {product.company_sku || '-'}
        </p>
      ),
      hideOnMobile: true,
    },

    {
      id: 'displayName',
      label: 'Display Name',
      mobileLabel: 'Display',
      align: 'right' as const,
      render: (product: Product) => (
        <p className="text-sm">{product.display_name || '-'}</p>
      ),
      hideOnMobile: true,
    },
    {
      id: 'product_type',
      label: 'Type',
      render: (product: Product) => (
        product.product_type ? (
          <Badge variant="outline">{product.product_type}</Badge>
        ) : (
          <p className="text-sm text-muted-foreground">-</p>
        )
      ),
      hideOnMobile: true,
    },
    {
      id: 'size',
      label: 'Size',
      render: (product: Product) => <p className="text-sm">{product.size || '-'}</p>,
      hideOnMobile: true,
    },
    {
      id: 'packing',
      label: 'Packing',
      render: (product: Product) => <p className="text-sm">{product.packing || '-'}</p>,
      hideOnMobile: true,
    },
    {
      id: 'salePrice',
      label: 'Sale Price',
      mobileLabel: 'Sale',
      align: 'right' as const,
      render: (product: Product) => (
        <Badge variant="outline" className="border-success text-success">
          {formatCurrency(product.default_sale_price)}
        </Badge>
      ),
    },
    {
      id: 'quantity',
      label: 'Quantity',
      mobileLabel: 'Qty',
      align: 'center' as const,
      render: (product: Product) => (
        <div className="flex flex-col items-center gap-1">
          <Badge variant={product.totalQuantity > 0 ? 'default' : 'outline'}>
            {formatQuantityDisplay(product.totalQuantity, product.packing)}
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (product: Product) => (
        <div className="flex justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon-sm" aria-label="View">
                <a
                  href={`/products/${product.id}`}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      handleViewProduct(product);
                    }
                  }}
                >
                  <Eye />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditDialog(product);
                }}
              >
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete"
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteDialog(product);
                }}
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  // Render content for the table area
  const renderTableContent = () => {
    // No search term — prompt user to search
    if (!search?.trim()) {
      return (
        <EmptyState
          title="Search to find products"
          message="Enter a product name, SKU, size, or packing in the search bar above to get started."
        />
      );
    }

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
          message="Try a different search term"
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
          getRowHref={(product) => `/products/${product.id}`}
          emptyMessage="No products found"
        />

        {/* Infinite scroll trigger and loading indicator */}
        <div className="p-4 text-center">
          {/* Invisible div that triggers intersection observer */}
          <div ref={observerTarget} className="h-5" />

          {/* Loading indicator while fetching next page */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading more products...</p>
            </div>
          )}

          {/* End of results indicator */}
          {!hasNextPage && products.length > 0 && (
            <span className="text-xs text-muted-foreground">
              All products loaded ({totalCount} total)
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={
          search?.trim() && totalCount > 0
            ? `${totalCount} results (showing ${products.length})`
            : 'Search to browse your product catalog'
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
              Bulk Create
            </Button>
            <Button onClick={handleOpenCreateDialog}>Add Product</Button>
          </div>
        }
      />

      {/* Search bar - always visible */}
      <div className="mb-4 flex flex-wrap items-center gap-4 sm:mb-6">
        <div className="w-full sm:w-auto sm:min-w-[200px] sm:flex-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, size, or packing..."
            className="sm:w-full"
          />
        </div>
        {/* Show searching indicator (not for next page fetch) */}
        {isFetching && !isFetchingNextPage && !showFullLoading && (
          <span className="text-xs text-muted-foreground">Searching...</span>
        )}
      </div>

      {/* Products table */}
      <Card className="overflow-hidden py-0">
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
    </div>
  );
};

export default ProductsPage;
