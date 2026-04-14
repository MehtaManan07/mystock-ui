import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  ProductFormDialog,
  ProductImagesCard,
  ProductInfoCard,
  ProductVendorSkusCard,
  ProductStockDistributionCard,
  ProductRecentActivityCard,
  VendorSkuDialog,
  CopyImagesDialog,
  ManageContainersDialog,
} from './components';
import { useProduct, useProducts, useUpdateProduct, useDeleteProduct, useUploadProductImages, useCopyProductImages, useDeleteProductImage } from '../../hooks/useProducts';
import { useContacts } from '../../hooks/useContacts';
import { useCreateVendorSku, useUpdateVendorSku, useDeleteVendorSku } from '../../hooks/useVendorSkus';
import type { CreateProductDto, UpdateProductDto } from '../../types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = parseInt(id || '0', 10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [manageContainersDialogOpen, setManageContainersDialogOpen] = useState(false);
  const [vendorSkuDialogOpen, setVendorSkuDialogOpen] = useState(false);
  const [editingVendorSku, setEditingVendorSku] = useState<{ vendor_id: number; vendor_sku: string } | null>(null);
  const [vendorSkuToDelete, setVendorSkuToDelete] = useState<{ vendor_id: number; vendor_name: string } | null>(null);

  // Form state for vendor SKU
  const [selectedVendorId, setSelectedVendorId] = useState<number | ''>('');
  const [vendorSkuValue, setVendorSkuValue] = useState('');

  // Images: selected index, copy-from dialog
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copyFromDialogOpen, setCopyFromDialogOpen] = useState(false);
  const [copyFromProductId, setCopyFromProductId] = useState<number | ''>('');

  // Data fetching
  const { data: product, isLoading, isError, refetch } = useProduct(productId);

  // Fetch only customers/both (for vendor SKU dialog) — filtered server-side
  const { data: contacts } = useContacts({ types: ['customer', 'both'] });
  const customers = contacts ?? [];

  // Only fetch products when copy-from dialog is open (avoids loading entire catalog on page load)
  const { data: allProducts } = useProducts(undefined, { enabled: copyFromDialogOpen });
  const otherProducts = (allProducts ?? []).filter((p) => p.id !== productId);

  const { data: sourceProduct } = useProduct(copyFromProductId !== '' ? Number(copyFromProductId) : 0);
  const sourceProductImages = sourceProduct?.images ?? [];

  const images = product?.images ?? [];
  useEffect(() => {
    if (images.length > 0 && selectedImageIndex >= images.length) {
      setSelectedImageIndex(Math.max(0, images.length - 1));
    }
  }, [images.length, selectedImageIndex]);

  // Vendor SKU mutations
  const createVendorSkuMutation = useCreateVendorSku(productId);
  const updateVendorSkuMutation = useUpdateVendorSku(productId);
  const deleteVendorSkuMutation = useDeleteVendorSku(productId);

  // Image mutations
  const uploadImagesMutation = useUploadProductImages(productId);
  const copyFromMutation = useCopyProductImages(productId);
  const deleteImageMutation = useDeleteProductImage(productId);

  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const handleEditSubmit = (data: CreateProductDto) => {
    updateMutation.mutate(
      { id: productId, data: data as UpdateProductDto },
      { onSuccess: () => setEditDialogOpen(false) }
    );
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(productId, {
      onSuccess: () => navigate('/products'),
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
    if (!selectedVendorId || !vendorSkuValue) return;
    if (editingVendorSku) {
      updateVendorSkuMutation.mutate(
        { vendorId: editingVendorSku.vendor_id, data: { vendor_sku: vendorSkuValue } },
        { onSuccess: handleCloseVendorSkuDialog }
      );
    } else {
      createVendorSkuMutation.mutate(
        { product_id: productId, vendor_id: selectedVendorId as number, vendor_sku: vendorSkuValue },
        { onSuccess: handleCloseVendorSkuDialog }
      );
    }
  };

  const handleDeleteVendorSku = () => {
    if (vendorSkuToDelete) {
      deleteVendorSkuMutation.mutate(vendorSkuToDelete.vendor_id, {
        onSuccess: () => setVendorSkuToDelete(null),
      });
    }
  };

  const totalQuantity =
    product?.containers?.reduce((sum, cp) => sum + cp.quantity, 0) ?? 0;

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

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Tooltip title="Back to Products">
          <IconButton
            component="a"
            href="/products"
            onClick={(e: React.MouseEvent) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                navigate('/products');
              }
            }}
          >
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
        <Grid size={{ xs: 12 }}>
          <ProductImagesCard
            images={images}
            selectedImageIndex={selectedImageIndex}
            onSelectImage={setSelectedImageIndex}
            onUpload={(files) => uploadImagesMutation.mutate(files, {
              onSuccess: () => { if (fileInputRef.current) fileInputRef.current.value = ''; }
            })}
            onCopyFromClick={() => setCopyFromDialogOpen(true)}
            onDeleteImage={(imageId) => deleteImageMutation.mutate(imageId, {
              onSuccess: () => setSelectedImageIndex((i) => Math.max(0, i - 1)),
            })}
            uploadPending={uploadImagesMutation.isPending}
            copyPending={copyFromMutation.isPending}
            deletePending={deleteImageMutation.isPending}
            fileInputRef={fileInputRef}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ProductInfoCard product={product} totalQuantity={totalQuantity} />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ProductStockDistributionCard
            containers={product.containers ?? []}
            onContainerClick={(containerId) => navigate(`/containers/${containerId}`)}
            onManageClick={() => setManageContainersDialogOpen(true)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <ProductVendorSkusCard
            vendorSkus={product.vendor_skus ?? []}
            onAdd={handleOpenVendorSkuDialog}
            onEdit={handleOpenEditVendorSkuDialog}
            onDelete={(vendorId, vendorName) =>
              setVendorSkuToDelete({ vendor_id: vendorId, vendor_name: vendorName })
            }
          />
          <ProductRecentActivityCard
            logs={product.logs ?? []}
            onContainerClick={(containerId) => navigate(`/containers/${containerId}`)}
          />
        </Grid>
      </Grid>

      <ProductFormDialog
        open={editDialogOpen}
        product={{ ...product, totalQuantity }}
        isLoading={updateMutation.isPending}
        onSubmit={handleEditSubmit}
        onClose={() => setEditDialogOpen(false)}
      />

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

      <VendorSkuDialog
        open={vendorSkuDialogOpen}
        editingVendorSku={editingVendorSku}
        selectedVendorId={selectedVendorId}
        vendorSkuValue={vendorSkuValue}
        customers={customers}
        isPending={createVendorSkuMutation.isPending || updateVendorSkuMutation.isPending}
        onClose={handleCloseVendorSkuDialog}
        onVendorChange={setSelectedVendorId}
        onSkuChange={setVendorSkuValue}
        onSubmit={handleVendorSkuSubmit}
      />

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

      <CopyImagesDialog
        open={copyFromDialogOpen}
        copyFromProductId={copyFromProductId}
        otherProducts={otherProducts}
        sourceProductImages={sourceProductImages}
        isPending={copyFromMutation.isPending}
        onClose={() => setCopyFromDialogOpen(false)}
        onProductSelect={setCopyFromProductId}
        onCopy={(selectedImageIds) =>
          copyFromProductId && copyFromMutation.mutate(
            { sourceProductId: copyFromProductId, imageIds: selectedImageIds },
            { onSuccess: () => { setCopyFromDialogOpen(false); setCopyFromProductId(''); } }
          )
        }
      />

      {/* Manage Containers Dialog */}
      <ManageContainersDialog
        open={manageContainersDialogOpen}
        productId={productId}
        productName={product.name}
        currentContainers={product.containers ?? []}
        onClose={() => setManageContainersDialogOpen(false)}
        onSuccess={() => refetch()}
      />
    </Box>
  );
};

export default ProductDetailPage;
