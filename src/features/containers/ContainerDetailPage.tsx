import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';
import { ArrowLeft, Boxes, History, PackageOpen, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ContainerFormDialog } from './components/ContainerFormDialog';
import { ManageProductsDialog } from './components/ManageProductsDialog';
import { useContainer, useUpdateContainer, useDeleteContainer } from '../../hooks/useContainers';
import type {
  CreateContainerDto,
  InventoryLogInfo,
  ProductContainerInfo,
  UpdateContainerDto,
} from '../../types';
import { format } from 'date-fns';

const sectionLabelClass =
  'text-xs font-semibold tracking-wider text-muted-foreground uppercase';

const containerTypeClass = (type: string) =>
  type === 'mixed'
    ? 'border-primary/30 bg-primary/10 text-primary'
    : 'border-border bg-muted text-muted-foreground';

/** Stock movements read as money-in/money-out: additions up, removals down. */
const logActionClass = (action: string) => {
  if (action === 'add' || action === 'purchase') {
    return 'border-success/30 bg-success/10 text-success';
  }
  if (action === 'remove' || action === 'sale') {
    return 'border-destructive/30 bg-destructive/10 text-destructive';
  }
  if (action === 'adjustment') {
    return 'border-warning/40 bg-warning/10 text-warning';
  }
  return 'border-border bg-muted text-muted-foreground';
};

export const ContainerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerId = parseInt(id || '0', 10);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [manageProductsDialogOpen, setManageProductsDialogOpen] = useState(false);

  // Data fetching
  const { data: container, isLoading, isError, refetch } = useContainer(containerId);

  // Mutations
  const updateMutation = useUpdateContainer();
  const deleteMutation = useDeleteContainer();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };

  const handleEditSubmit = (data: CreateContainerDto) => {
    updateMutation.mutate(
      { id: containerId, data: data as UpdateContainerDto },
      {
        onSuccess: () => setEditDialogOpen(false),
      }
    );
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(containerId, {
      onSuccess: () => {
        navigate('/containers');
      },
    });
  };

  // Calculate total quantity from products
  const totalQuantity = container?.products?.reduce(
    (sum, cp) => sum + cp.quantity,
    0
  ) || 0;

  const productColumns = [
    {
      id: 'product',
      label: 'Product',
      minWidth: 180,
      render: (cp: ProductContainerInfo) => (
        <span className="font-medium">{cp.product.name}</span>
      ),
    },
    {
      id: 'size',
      label: 'Size',
      render: (cp: ProductContainerInfo) => (
        <span className="text-muted-foreground">{cp.product.size || '-'}</span>
      ),
    },
    {
      id: 'packing',
      label: 'Packing',
      render: (cp: ProductContainerInfo) => (
        <span className="text-muted-foreground">{cp.product.packing || '-'}</span>
      ),
    },
    {
      id: 'quantity',
      label: 'Quantity',
      numeric: true,
      render: (cp: ProductContainerInfo) => (
        <span
          className={cn(
            'font-medium tabular-nums',
            cp.quantity > 0 ? 'text-success' : 'text-muted-foreground'
          )}
        >
          {cp.quantity}
        </span>
      ),
    },
  ];

  const logColumns = [
    {
      id: 'action',
      label: 'Action',
      render: (log: InventoryLogInfo) => (
        <Badge
          variant="outline"
          className={cn('capitalize', logActionClass(log.action))}
        >
          {log.action}
        </Badge>
      ),
    },
    {
      id: 'product',
      label: 'Product',
      minWidth: 160,
      render: (log: InventoryLogInfo) => log.product?.name || '-',
    },
    {
      id: 'quantity',
      label: 'Quantity',
      numeric: true,
      render: (log: InventoryLogInfo) => (
        <span className="font-medium tabular-nums">{log.quantity}</span>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      align: 'right' as const,
      render: (log: InventoryLogInfo) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(log.created_at)}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingState message="Loading container details..." fullPage />;
  }

  if (isError || !container) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const products = container.products ?? [];
  const logs = container.logs ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={container.name}
        subtitle={`${container.type} container`}
        breadcrumbs={[
          { label: 'Containers', path: '/containers' },
          { label: container.name },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Back to Containers" asChild>
                  <a
                    href="/containers"
                    onClick={(e: React.MouseEvent) => {
                      if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        navigate('/containers');
                      }
                    }}
                  >
                    <ArrowLeft />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Containers</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit Container"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Container</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete Container"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Container</TooltipContent>
            </Tooltip>
            <Button onClick={() => setManageProductsDialogOpen(true)}>
              <Boxes />
              Manage products
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Container Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Container information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className={sectionLabelClass}>Name</span>
              <p className="mt-1 font-medium">{container.name}</p>
            </div>
            <div>
              <span className={sectionLabelClass}>Type</span>
              <div className="mt-1.5">
                <Badge
                  variant="outline"
                  className={cn('capitalize', containerTypeClass(container.type))}
                >
                  {container.type}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
              <div>
                <span className={sectionLabelClass}>Products</span>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {products.length}
                </p>
              </div>
              <div>
                <span className={sectionLabelClass}>Total quantity</span>
                <p
                  className={cn(
                    'mt-1 text-lg font-semibold tabular-nums',
                    totalQuantity > 0 ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {totalQuantity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products + activity */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                Products in container
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                  ({products.length})
                </span>
              </CardTitle>
            </CardHeader>
            <div className="border-t border-border/70">
              {products.length > 0 ? (
                <ResponsiveTable
                  columns={productColumns}
                  data={products}
                  keyExtractor={(cp) => cp.product.id}
                  onRowClick={(cp) => navigate(`/products/${cp.product.id}`)}
                  getRowHref={(cp) => `/products/${cp.product.id}`}
                />
              ) : (
                <EmptyState
                  compact
                  icon={<PackageOpen />}
                  title="No products stored here"
                  message="Add products to this container to start tracking stock in it."
                  actionLabel="Manage products"
                  actionIcon={<Boxes />}
                  onAction={() => setManageProductsDialogOpen(true)}
                />
              )}
            </div>
          </Card>

          {/* Recent Logs Card */}
          <Card className="gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                Recent activity
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                  ({logs.length})
                </span>
              </CardTitle>
            </CardHeader>
            <div className="border-t border-border/70">
              {logs.length > 0 ? (
                <ResponsiveTable
                  columns={logColumns}
                  data={logs.slice(0, 10)}
                  keyExtractor={(log) => log.id}
                />
              ) : (
                <EmptyState
                  compact
                  icon={<History />}
                  title="No activity yet"
                  message="Stock movements in and out of this container will appear here."
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <ContainerFormDialog
        open={editDialogOpen}
        container={{
          ...container,
          productCount: container.products?.length || 0,
        }}
        isLoading={updateMutation.isPending}
        onSubmit={handleEditSubmit}
        onClose={() => setEditDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Container"
        message={`Are you sure you want to delete "${container.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Manage Products Dialog */}
      <ManageProductsDialog
        open={manageProductsDialogOpen}
        containerId={containerId}
        containerName={container.name}
        currentProducts={container.products || []}
        onClose={() => setManageProductsDialogOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default ContainerDetailPage;
