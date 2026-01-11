import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { QUERY_KEYS } from '../constants';
import type { CreateUserDto, UpdateUserDto, User } from '../types';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Hook to fetch all users
 */
export const useUsers = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;
  
  return useQuery({
    queryKey: normalizedSearch 
      ? [...QUERY_KEYS.USERS, normalizedSearch] 
      : QUERY_KEYS.USERS,
    queryFn: () => usersApi.getAll(normalizedSearch),
  });
};

/**
 * Hook to fetch a single user by ID
 */
export const useUser = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new user (admin only)
 * Does NOT auto-login since admin is creating users for others
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.create(data),
    
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.USERS });
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<User[]>(QUERY_KEYS.USERS);
      
      // Optimistically add the new user with a temporary ID
      if (previousUsers) {
        const optimisticUser: User = {
          id: Date.now(), // Temporary ID
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          contact_info: newUser.contact_info ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
        queryClient.setQueryData<User[]>(
          QUERY_KEYS.USERS,
          [...previousUsers, optimisticUser]
        );
      }
      
      return { previousUsers };
    },
    
    onError: (err, _newUser, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(QUERY_KEYS.USERS, context.previousUsers);
      }
      error(`Failed to create user: ${(err as Error).message || 'Unknown error'}`);
    },
    
    onSuccess: (serverUser) => {
      success(`User "${serverUser.name}" created successfully`);

      // Replace optimistic user with server response
      const users = queryClient.getQueryData<User[]>(QUERY_KEYS.USERS);
      if (users) {
        // Remove the temp user and add the real one
        const updated = users.filter(u => u.id < Date.now() - 10000);
        queryClient.setQueryData<User[]>(QUERY_KEYS.USERS, [...updated, serverUser]);
      }
    },
  });
};

/**
 * Hook to update a user with optimistic update
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDto }) =>
      usersApi.update(id, data),
    
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.USERS });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.USER(id) });
      
      // Snapshot previous values
      const previousUsers = queryClient.getQueryData<User[]>(QUERY_KEYS.USERS);
      const previousUser = queryClient.getQueryData(QUERY_KEYS.USER(id));
      
      // Optimistically update the users list
      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          QUERY_KEYS.USERS,
          previousUsers.map(u => 
            u.id === id ? { ...u, ...data, updated_at: new Date().toISOString() } : u
          )
        );
      }
      
      return { previousUsers, previousUser };
    },
    
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(QUERY_KEYS.USERS, context.previousUsers);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(QUERY_KEYS.USER(id), context.previousUser);
      }
      error(`Failed to update user: ${(err as Error).message || 'Unknown error'}`);
    },
    
    onSuccess: (serverUser, { id }) => {
      success('User updated successfully');
      // Update with server response
      const users = queryClient.getQueryData<User[]>(QUERY_KEYS.USERS);
      if (users) {
        queryClient.setQueryData<User[]>(
          QUERY_KEYS.USERS,
          users.map(u => u.id === id ? { ...u, ...serverUser } : u)
        );
      }
      // Invalidate detail view to get fresh data on next visit
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(id) });
    },
  });
};

/**
 * Hook to delete a user with optimistic update
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.USERS });
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<User[]>(QUERY_KEYS.USERS);
      
      // Optimistically remove the user
      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          QUERY_KEYS.USERS,
          previousUsers.filter(u => u.id !== id)
        );
      }
      
      return { previousUsers };
    },
    
    onError: (err, _id, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(QUERY_KEYS.USERS, context.previousUsers);
      }
      error(`Failed to delete user: ${(err as Error).message || 'Unknown error'}`);
    },
    
    onSuccess: () => {
      success('User deleted successfully');
    },
  });
};
