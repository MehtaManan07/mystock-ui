import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  PlaylistAdd as BulkAddIcon,
} from '@mui/icons-material';
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

  // Search state
  const [search, setSearch] = useState('');

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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Products</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {containers.map((container) => (
                <TableRow
                  key={container.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewContainer(container)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {container.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={container.type}
                      size="small"
                      color={container.type === 'mixed' ? 'secondary' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={container.productCount}
                      size="small"
                      color={container.productCount > 0 ? 'primary' : 'default'}
                      variant={container.productCount > 0 ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => handleViewContainer(container)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog(container)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(container)}
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

        <Box sx={{ p: 2, textAlign: 'center' }}>
          <div ref={observerTarget} style={{ height: '20px' }} />

          {isFetchingNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Loading more containers...
              </Typography>
            </Box>
          )}

          {!hasNextPage && containers.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              All containers loaded ({totalCount} total)
            </Typography>
          )}
        </Box>
      </>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Containers"
        subtitle={
          totalCount > 0
            ? `${totalCount} containers in your inventory (showing ${containers.length})`
            : 'Manage your storage containers'
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Add Container
            </Button>
            <Button
              variant="outlined"
              startIcon={<BulkAddIcon />}
              onClick={handleOpenBulkDialog}
            >
              Bulk Add
            </Button>
          </Box>
        }
      />

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name..."
        />
        {/* Show searching indicator (not for next page fetch) */}
        {isFetching && !isFetchingNextPage && !showFullLoading && (
          <Typography variant="caption" color="text.secondary">
            Searching...
          </Typography>
        )}
      </Box>

      <Card>
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
    </Box>
  );
};

export default ContainersPage;
