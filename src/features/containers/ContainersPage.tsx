import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';
import { Eye, Loader2, Pencil, ListPlus, Plus, SearchX, Trash2, Warehouse } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ContainerFormDialog } from './components/ContainerFormDialog';
import { BulkContainerFormDialog } from './components/BulkContainerFormDialog';
import { useContainersInfinite, useCreateContainer, useUpdateContainer, useDeleteContainer, useCreateContainersBulk } from '../../hooks/useContainers';
import type { Container, CreateContainerDto, UpdateContainerDto } from '../../types';

/** Containers hold either one product line or many; mixed is the notable case. */
const containerTypeClass = (type: string) =>
  type === 'mixed'
    ? 'border-primary/30 bg-primary/10 text-primary'
    : 'border-border bg-muted text-muted-foreground';

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

  const columns = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 200,
      render: (container: Container) => (
        <span className="font-medium">{container.name}</span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      render: (container: Container) => (
        <Badge
          variant="outline"
          className={cn('capitalize', containerTypeClass(container.type))}
        >
          {container.type}
        </Badge>
      ),
    },
    {
      id: 'productCount',
      label: 'Products',
      numeric: true,
      render: (container: Container) => (
        <span
          className={cn(
            'tabular-nums',
            container.productCount > 0
              ? 'font-medium text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {container.productCount}
        </span>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (container: Container) => (
        <div
          className="flex items-center justify-center gap-0.5"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="View" asChild>
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
        </div>
      ),
    },
  ];

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
          icon={search ? <SearchX /> : <Warehouse />}
          title={search ? 'No matching containers' : 'No containers yet'}
          message={
            search
              ? `Nothing matched "${search}". Try a different search term.`
              : 'Containers are the physical places you store stock. Add your first one to get started.'
          }
          actionLabel={!search ? 'Add container' : undefined}
          actionIcon={!search ? <Plus /> : undefined}
          onAction={!search ? handleOpenCreateDialog : undefined}
        />
      );
    }

    return (
      <>
        <ResponsiveTable
          columns={columns}
          data={containers}
          keyExtractor={(container) => container.id}
          onRowClick={handleViewContainer}
          getRowHref={(container) => `/containers/${container.id}`}
        />

        <div className="border-t border-border/70 px-4 py-4 text-center">
          <div ref={observerTarget} className="h-5" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading more containers...</span>
            </div>
          )}

          {!hasNextPage && containers.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              All containers loaded ({totalCount} total)
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Containers"
        subtitle={
          totalCount > 0
            ? `${totalCount} containers in your inventory (showing ${containers.length})`
            : 'Manage your storage containers'
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleOpenBulkDialog}>
              <ListPlus />
              Bulk add
            </Button>
            <Button onClick={handleOpenCreateDialog}>
              <Plus />
              Add container
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name..."
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {/* Show searching indicator (not for next page fetch) */}
          {isFetching && !isFetchingNextPage && !showFullLoading && (
            <span className="text-xs text-muted-foreground">Searching...</span>
          )}
        </div>
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
