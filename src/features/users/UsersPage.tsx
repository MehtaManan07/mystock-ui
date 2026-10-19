import React, { useState } from 'react';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from 'cn';
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

// Outlined badge tints standing in for the MUI chip `color` prop.
const roleBadgeClass = {
  error: 'border-destructive/50 text-destructive',
  warning: 'border-warning/50 text-warning',
  info: 'border-primary/50 text-primary',
  default: '',
} as const;

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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="text-sm font-semibold">{user.name}</p>
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(roleBadgeClass[getRoleColor(user.role)])}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>{user.contact_info || '-'}</TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit"
                        onClick={() => handleOpenEditDialog(user)}
                      >
                        <Pencil />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    {/* The span keeps the tooltip reachable while the button is disabled. */}
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleOpenDeleteDialog(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {user.id === currentUser?.id ? "Can't delete yourself" : 'Delete'}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={users ? `${users.length} users in the system` : 'Manage system users'}
        actionLabel="Add User"
        onAction={handleOpenCreateDialog}
      />

      {/* Search bar - always visible */}
      <div className="mb-6 flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or username..."
        />
        {isFetching && !showFullLoading && (
          <span className="text-xs text-muted-foreground">Searching...</span>
        )}
      </div>

      {/* Users table */}
      <Card className="gap-0 overflow-hidden py-0">
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
    </div>
  );
};

export default UsersPage;
