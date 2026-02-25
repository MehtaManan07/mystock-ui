import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import { QUERY_KEYS } from '../constants';
import type { CreateProductDto, UpdateProductDto, Product } from '../types';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Hook to fetch all products (kept for backward compatibility)
 */
export const useProducts = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;

  return useQuery({
    queryKey: normalizedSearch
      ? [...QUERY_KEYS.PRODUCTS, normalizedSearch]
      : QUERY_KEYS.PRODUCTS,
    queryFn: () => productsApi.getAll(normalizedSearch),
  });
};

/**
 * Hook for infinite scroll products list
 */
export const useProductsInfinite = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;

  return useInfiniteQuery({
    queryKey: normalizedSearch
      ? [...QUERY_KEYS.PRODUCTS, 'infinite', normalizedSearch]
      : [...QUERY_KEYS.PRODUCTS, 'infinite'],

    queryFn: ({ pageParam = 1 }) =>
      productsApi.getPaginated(pageParam, 25, normalizedSearch),

    getNextPageParam: (lastPage) => {
      // Return next page number if there are more pages, undefined otherwise
      return lastPage.has_more ? lastPage.page + 1 : undefined;
    },

    initialPageParam: 1,
  });
};

/**
 * Hook to fetch a single product by ID
 */
export const useProduct = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCT(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new product
 * Invalidates infinite scroll cache
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.create(data),

    onSuccess: (serverProduct) => {
      success(`Product "${serverProduct.name}" created successfully`);

      // Invalidate infinite scroll queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.PRODUCTS, 'infinite'],
      });
    },

    onError: (err) => {
      error(`Failed to create product: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to update a product
 * Invalidates infinite scroll cache
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductDto }) =>
      productsApi.update(id, data),

    onSuccess: (serverProduct, { id }) => {
      success(`Product updated successfully ${serverProduct.name}`);

      // Invalidate infinite scroll queries
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.PRODUCTS, 'infinite'],
      });

      // Invalidate detail view
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCT(id),
      });
    },

    onError: (err) => {
      error(`Failed to update product: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to delete a product
 * Invalidates infinite scroll cache
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),

    onSuccess: () => {
      success('Product deleted successfully');

      // Invalidate infinite scroll queries
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.PRODUCTS, 'infinite'],
      });
    },

    onError: (err) => {
      error(`Failed to delete product: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to create multiple products in bulk
 * Invalidates infinite scroll cache
 */
export const useCreateProductsBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto[]) => productsApi.createBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.PRODUCTS, 'infinite'],
      });
    },
  });
};

/**
 * Returns an imperative lookup function that resolves a single product by exact company_sku.
 * Results are cached via React Query (staleTime: 5 min).
 */
export const useProductLookup = () => {
  const queryClient = useQueryClient();

  const lookupBySku = async (sku: string): Promise<Product | null> => {
    const results = await queryClient.fetchQuery({
      queryKey: [...QUERY_KEYS.PRODUCTS, sku],
      queryFn: () => productsApi.getAll(sku),
      staleTime: 1000 * 60 * 5,
    });
    return results.find((p) => p.company_sku?.toLowerCase() === sku.toLowerCase()) ?? null;
  };

  return { lookupBySku };
};
