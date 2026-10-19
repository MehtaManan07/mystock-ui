import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Eye, Loader2, Pencil, ListPlus, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ContainerFormDialog } from './components/ContainerFormDialog';
import { BulkContainerFormDialog } from './components/BulkContainerFormDialog';
import { useContainersInfinite, useCreateContainer, useUpdateContainer, useDeleteContainer, useCreateContainersBulk } from '../../hooks/useContainers';
import type { Container, CreateContainerDto, UpdateContainerDto } from '../../types';

export const ContainersPage: React.FC = () => {
  const navigate = useNavigate();

  // Search state – synced with URL ?q=
  const [search, setSearch] = useUrlParam('q');

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [bulkFormDialogOpen, setBulkFormDialogOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<Container | null>(null);

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
  } = useContainersInfinite(search || undefined);

  // Flatten all pages into single array for rendering
  const containers = data?.pages ? data.pages.flatMap((page) => page?.items ?? []) : [];

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
  const createMutation = useCreateContainer();
  const updateMutation = useUpdateContainer();
  const deleteMutation = useDeleteContainer();
  const bulkCreateMutation = useCreateContainersBulk();

  // Handlers
  const handleOpenCreateDialog = () => {
    setSelectedContainer(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (container: Container) => {
    setSelectedContainer(container);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedContainer(null);
  };

  const handleFormSubmit = (data: CreateContainerDto) => {
    if (selectedContainer) {
      updateMutation.mutate(
        { id: selectedContainer.id, data: data as UpdateContainerDto },
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

  const handleOpenDeleteDialog = (container: Container) => {
    setContainerToDelete(container);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setContainerToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (containerToDelete) {
      deleteMutation.mutate(containerToDelete.id, {
        onSuccess: () => handleCloseDeleteDialog(),
      });
    }
  };

  const handleViewContainer = (container: Container) => {
    navigate(`/containers/${container.id}`);
  };

  const handleOpenBulkDialog = () => {
    setBulkFormDialogOpen(true);
  };

  const handleCloseBulkDialog = () => {
    setBulkFormDialogOpen(false);
  };

  const handleBulkSubmit = (data: CreateContainerDto[]) => {
    bulkCreateMutation.mutate(data, {
      onSuccess: () => handleCloseBulkDialog(),
    });
  };

  // Render content for the table area
  const renderTableContent = () => {
    if (showFullLoading) {
      return <LoadingState message="Loading containers..." />;
    }

    if (isError) {
      return <ErrorState onRetry={() => refetch()} />;
    }

    if (!containers || containers.length === 0) {
      return (
        <EmptyState
          title="No containers found"
          message={search ? 'Try a different search term' : 'Add your first container to get started'}
          actionLabel={!search ? 'Add Container' : undefined}
          onAction={!search ? handleOpenCreateDialog : undefined}
        />
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.map((container) => (
                <TableRow
                  key={container.id}
                  className="cursor-pointer"
                  onClick={(e: React.MouseEvent) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey) {
                      window.open(`/containers/${container.id}`, '_blank');
                      return;
                    }
                    handleViewContainer(container);
                  }}
                  onAuxClick={(e: React.MouseEvent) => {
                    if (e.button === 1) window.open(`/containers/${container.id}`, '_blank');
                  }}
                >
                  <TableCell>
                    <p className="text-sm font-semibold">{container.name}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        container.type === 'mixed'
                          ? 'border-secondary-foreground/40 text-secondary-foreground'
                          : 'border-primary text-primary'
                      }
                    >
                      {container.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={container.productCount > 0 ? 'default' : 'outline'}
                    >
                      {container.productCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View"
                          asChild
                        >
                          <a
                            href={`/containers/${container.id}`}
                            onClick={(e: React.MouseEvent) => {
                              if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                                e.preventDefault();
                                handleViewContainer(container);
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
                          onClick={() => handleOpenEditDialog(container)}
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
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleOpenDeleteDialog(container)}
                        >
                          <Trash2 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 text-center">
          <div ref={observerTarget} className="h-5" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading more containers...
              </p>
            </div>
          )}

          {!hasNextPage && containers.length > 0 && (
            <span className="text-xs text-muted-foreground">
              All containers loaded ({totalCount} total)
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="Containers"
        subtitle={
          totalCount > 0
            ? `${totalCount} containers in your inventory (showing ${containers.length})`
            : 'Manage your storage containers'
        }
        action={
          <div className="flex gap-2">
            <Button onClick={handleOpenCreateDialog}>
              <Plus />
              Add Container
            </Button>
            <Button variant="outline" onClick={handleOpenBulkDialog}>
              <ListPlus />
              Bulk Add
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name..."
        />
        {/* Show searching indicator (not for next page fetch) */}
        {isFetching && !isFetchingNextPage && !showFullLoading && (
          <span className="text-xs text-muted-foreground">Searching...</span>
        )}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {renderTableContent()}
      </Card>

      <ContainerFormDialog
        open={formDialogOpen}
        container={selectedContainer}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleFormSubmit}
        onClose={handleCloseFormDialog}
      />

      <BulkContainerFormDialog
        open={bulkFormDialogOpen}
        isLoading={bulkCreateMutation.isPending}
        onSubmit={handleBulkSubmit}
        onClose={handleCloseBulkDialog}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Container"
        message={`Are you sure you want to delete "${containerToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />
    </div>
  );
};

export default ContainersPage;
