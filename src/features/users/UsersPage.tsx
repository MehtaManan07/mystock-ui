import React, { useState } from 'react';
import { useUrlParam } from '../../hooks/useUrlFilters';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { UserFormDialog } from './components/UserFormDialog';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { useAuthStore } from '../../stores/authStore';
import { USER_ROLES } from '../../constants';
import type { User, CreateUserDto, UpdateUserDto } from '../../types';

const getRoleColor = (role: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'error';
    case USER_ROLES.MANAGER:
      return 'warning';
    case USER_ROLES.STAFF:
      return 'info';
    default:
      return 'default';
  }
};

const getRoleLabel = (role: string): string => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'Admin';
    case USER_ROLES.MANAGER:
      return 'Manager';
    case USER_ROLES.STAFF:
      return 'Staff';
    case USER_ROLES.JOBBER:
      return 'Jobber';
    default:
      return role;
  }
};

export const UsersPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  
  // Search state – synced with URL ?q=
  const [search, setSearch] = useUrlParam('q');
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Data fetching
  const { data: users, isLoading, isFetching, isError, refetch } = useUsers(search || undefined);
  
  // Only show full loading on initial load (no data yet)
  const showFullLoading = isLoading && !users;
  
  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  // Handlers
  const handleOpenCreateDialog = () => {
    setSelectedUser(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedUser(null);
  };

  const handleFormSubmit = (data: CreateUserDto) => {
    if (selectedUser) {
      updateMutation.mutate(
        { id: selectedUser.id, data: data as UpdateUserDto },
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

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id, {
        onSuccess: () => handleCloseDeleteDialog(),
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render content for the table area
  const renderTableContent = () => {
    if (showFullLoading) {
      return <LoadingState message="Loading users..." />;
    }
    
    if (isError) {
      return <ErrorState onRetry={() => refetch()} />;
    }
    
    if (!users || users.length === 0) {
      return (
        <EmptyState
          title="No users found"
          message={search ? 'Try a different search term' : 'Add your first user to get started'}
          actionLabel={!search ? 'Add User' : undefined}
          onAction={!search ? handleOpenCreateDialog : undefined}
        />
      );
    }
    
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {user.name}
                  </Typography>
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    size="small"
                    color={getRoleColor(user.role)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{user.contact_info || '-'}</TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditDialog(user)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.id === currentUser?.id ? "Can't delete yourself" : 'Delete'}>
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(user)}
                        disabled={user.id === currentUser?.id}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle={users ? `${users.length} users in the system` : 'Manage system users'}
        actionLabel="Add User"
        onAction={handleOpenCreateDialog}
      />

      {/* Search bar - always visible */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or username..."
        />
        {isFetching && !showFullLoading && (
          <Typography variant="caption" color="text.secondary">
            Searching...
          </Typography>
        )}
      </Box>

      {/* Users table */}
      <Card>
        {renderTableContent()}
      </Card>

      {/* Create/Edit Dialog */}
      <UserFormDialog
        open={formDialogOpen}
        user={selectedUser}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleFormSubmit}
        onClose={handleCloseFormDialog}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />
    </Box>
  );
};

export default UsersPage;
