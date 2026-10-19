import React, { useState } from 'react';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Pencil, Trash2, Plus, SearchX, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from 'cn';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
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

// Outline pills tinted with the semantic tokens; shapes stay identical so the
// role badges read as one family.
const roleBadgeClass = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  info: 'border-primary/30 bg-primary/10 text-primary',
  default: 'border-border bg-muted text-muted-foreground',
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

  const columns = [
    {
      id: 'name',
      label: 'Name',
      render: (user: User) => <span className="text-sm font-semibold">{user.name}</span>,
    },
    {
      id: 'username',
      label: 'Username',
      render: (user: User) => (
        <span className="font-mono text-sm text-muted-foreground">{user.username}</span>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      render: (user: User) => (
        <Badge variant="outline" className={cn(roleBadgeClass[getRoleColor(user.role)])}>
          {getRoleLabel(user.role)}
        </Badge>
      ),
    },
    {
      id: 'contact',
      label: 'Contact',
      render: (user: User) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {user.contact_info || '—'}
        </span>
      ),
    },
    {
      id: 'created',
      label: 'Created',
      render: (user: User) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatDate(user.created_at)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (user: User) => (
        <div className="flex justify-center gap-1">
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
        </div>
      ),
    },
  ];

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
          icon={search ? <SearchX /> : <UsersRound />}
          title={search ? 'No matching users' : 'No users yet'}
          message={
            search
              ? 'No user matches that name or username.'
              : 'Add team members so they can sign in and work in the app.'
          }
          actionLabel={!search ? 'Add user' : undefined}
          actionIcon={!search ? <Plus /> : undefined}
          onAction={!search ? handleOpenCreateDialog : undefined}
        />
      );
    }

    return (
      <ResponsiveTable
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id.toString()}
        emptyIcon={<UsersRound />}
        emptyTitle="No users yet"
        emptyMessage="Add team members so they can sign in and work in the app."
      />
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

      <div className="space-y-5">
        {/* Toolbar: search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or username..."
            className="sm:max-w-xs"
          />
          {isFetching && !showFullLoading && (
            <span className="text-xs text-muted-foreground sm:ml-auto">Searching...</span>
          )}
        </div>

        {/* Users table */}
        <Card className="gap-0 overflow-hidden py-0">
          {renderTableContent()}
        </Card>
      </div>

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
