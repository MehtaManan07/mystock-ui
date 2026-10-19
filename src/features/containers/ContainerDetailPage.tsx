import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { ArrowLeft, Boxes, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ContainerFormDialog } from './components/ContainerFormDialog';
import { ManageProductsDialog } from './components/ManageProductsDialog';
import { useContainer, useUpdateContainer, useDeleteContainer } from '../../hooks/useContainers';
import type { CreateContainerDto, UpdateContainerDto } from '../../types';
import { format } from 'date-fns';

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

  if (isLoading) {
    return <LoadingState message="Loading container details..." fullPage />;
  }

  if (isError || !container) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title={container.name}
        subtitle={`${container.type} container`}
        breadcrumbs={[
          { label: 'Containers', path: '/containers' },
          { label: container.name },
        ]}
      />

      {/* Action buttons */}
      <div className="mb-6 flex gap-2">
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
              aria-label="Manage Products"
              className="text-primary hover:text-primary"
              onClick={() => setManageProductsDialogOpen(true)}
            >
              <Boxes />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manage Products</TooltipContent>
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
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Container Info Card */}
        <div className="col-span-12 md:col-span-4">
          <Card>
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">
                Container Information
              </h3>
              <Separator className="mb-4" />

              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="font-semibold">{container.name}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Type</span>
                  <div className="mt-1">
                    <Badge
                      className={
                        container.type === 'mixed'
                          ? 'bg-secondary text-secondary-foreground'
                          : ''
                      }
                    >
                      {container.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Products Stored
                  </span>
                  <p>{container.products?.length || 0} products</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Total Quantity
                  </span>
                  <div className="mt-1">
                    <Badge
                      variant={totalQuantity > 0 ? 'default' : 'secondary'}
                      className="px-3 py-1 text-sm"
                    >
                      {totalQuantity}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Card */}
        <div className="col-span-12 md:col-span-8">
          <Card className="mb-6">
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">
                Products in Container ({container.products?.length || 0})
              </h3>
              <Separator className="mb-4" />

              {container.products && container.products.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Packing</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {container.products.map((cp) => (
                        <TableRow
                          key={cp.product.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/products/${cp.product.id}`)}
                        >
                          <TableCell>
                            <p className="text-sm font-medium">
                              {cp.product.name}
                            </p>
                          </TableCell>
                          <TableCell>{cp.product.size}</TableCell>
                          <TableCell>{cp.product.packing}</TableCell>
                          <TableCell className="text-right">
                            {cp.quantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No products stored in this container yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Logs Card */}
          <Card>
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">
                Recent Activity ({container.logs?.length || 0} logs)
              </h3>
              <Separator className="mb-4" />

              {container.logs && container.logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {container.logs.slice(0, 10).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                log.action === 'add' || log.action === 'purchase'
                                  ? 'border-success text-success'
                                  : log.action === 'remove' || log.action === 'sale'
                                  ? 'border-destructive text-destructive'
                                  : ''
                              }
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.product?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            {log.quantity}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.created_at)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activity logs for this container.
                </p>
              )}
            </CardContent>
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
