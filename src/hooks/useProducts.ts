import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import { QUERY_KEYS } from '../constants';
import type { CreateProductDto, UpdateProductDto, Product, ProductImage, PaginatedResponse } from '../types';
import { useNotificationStore } from '../stores/notificationStore';

const INFINITE_FILTER = { queryKey: QUERY_KEYS.PRODUCTS_INFINITE() };

/**
 * Hook to fetch all products (kept for backward compatibility)
 */
export const useProducts = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;

  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS_LIST(normalizedSearch),
    queryFn: () => productsApi.getAll(normalizedSearch),
  });
};

/**
 * Hook for infinite scroll products list
 */
export const useProductsInfinite = (search?: string) => {
  const normalizedSearch = search?.trim() || undefined;

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.PRODUCTS_INFINITE(normalizedSearch),

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
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.create(data),

    onMutate: async (newData) => {
      await queryClient.cancelQueries(INFINITE_FILTER);

      const previousQueriesData = queryClient.getQueriesData<InfiniteData<PaginatedResponse<Product>>>(INFINITE_FILTER);

      const tempId = Date.now();
      const optimisticProduct: Product = {
        id: tempId,
        name: newData.name,
        display_name: newData.display_name ?? null,
        size: newData.size,
        packing: newData.packing,
        company_sku: newData.company_sku ?? null,
        default_sale_price: newData.default_sale_price ?? null,
        default_purchase_price: newData.default_purchase_price ?? null,
        description: newData.description ?? null,
        mrp: newData.mrp ?? null,
        tags: newData.tags ?? null,
        product_type: newData.product_type ?? null,
        dimensions: newData.dimensions ?? null,
        totalQuantity: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Product>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                items: [optimisticProduct, ...firstPage.items],
                total: firstPage.total + 1,
              },
              ...old.pages.slice(1),
            ],
          };
        }
      );

      return { previousQueriesData, tempId };
    },

    onSuccess: (serverProduct, _, context) => {
      success(`Product "${serverProduct.name}" created successfully`);

      // Replace optimistic entry with real server data
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Product>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((p) =>
                p.id === context?.tempId ? serverProduct : p
              ),
            })),
          };
        }
      );
    },

    onError: (err, _, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      error(`Failed to create product: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to update a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductDto }) =>
      productsApi.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(INFINITE_FILTER);

      const previousQueriesData = queryClient.getQueriesData<InfiniteData<PaginatedResponse<Product>>>(INFINITE_FILTER);

      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Product>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((p) =>
                p.id === id ? { ...p, ...data } : p
              ),
            })),
          };
        }
      );

      return { previousQueriesData };
    },

    onSuccess: (serverProduct, { id }) => {
      success(`Product "${serverProduct.name}" updated successfully`);

      // Update with confirmed server data
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Product>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((p) =>
                p.id === id ? { ...p, ...serverProduct } : p
              ),
            })),
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(id) });
    },

    onError: (err, _, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      error(`Failed to update product: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries(INFINITE_FILTER);

      const previousQueriesData = queryClient.getQueriesData<InfiniteData<PaginatedResponse<Product>>>(INFINITE_FILTER);

      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Product>>>(
        INFINITE_FILTER,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((p) => p.id !== id),
              total: Math.max(0, page.total - 1),
            })),
          };
        }
      );

      return { previousQueriesData };
    },

    onSuccess: () => {
      success('Product deleted successfully');
      queryClient.invalidateQueries(INFINITE_FILTER);
    },

    onError: (err, _, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      error(`Failed to delete product: ${(err as Error).message || 'Unknown error'}`);
    },
  });
};

/**
 * Hook to create multiple products in bulk
 */
export const useCreateProductsBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto[]) => productsApi.createBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries(INFINITE_FILTER);
    },
  });
};

export const useUploadProductImages = (productId: number) => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (files: File[]) => productsApi.uploadProductImages(productId, files),
    onSuccess: (data: ProductImage[]) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) });
      const count = data?.length || 0;
      success(`Successfully uploaded ${count} image${count !== 1 ? 's' : ''}`);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Failed to upload images';
      error(message);
    },
  });
};

export const useCopyProductImages = (productId: number) => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: ({ sourceProductId, imageIds }: { sourceProductId: number; imageIds: number[] }) =>
      productsApi.copyProductImagesFrom(productId, sourceProductId, imageIds),
    onSuccess: (data: ProductImage[]) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) });
      const count = data?.length || 0;
      success(`Successfully copied ${count} image${count !== 1 ? 's' : ''}`);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Failed to copy images';
      error(message);
    },
  });
};

export const useDeleteProductImage = (productId: number) => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (imageId: number) => productsApi.deleteProductImage(productId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) });
      success('Image deleted successfully');
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete image';
      error(message);
    },
  });
};

/**
 * Returns imperative lookup functions for products by company_sku.
 * lookupBySkus: batch lookup — one request for all SKUs (use for Excel upload).
 * lookupBySku: single SKU lookup, cached via React Query (kept for other uses).
 */
export const useProductLookup = () => {
  const queryClient = useQueryClient();

  const lookupBySkus = async (skus: string[]): Promise<Map<string, Product | null>> => {
    if (skus.length === 0) return new Map();
    const products = await queryClient.fetchQuery({
      queryKey: QUERY_KEYS.PRODUCTS_BATCH(skus),
      queryFn: () => productsApi.lookupBySkus(skus),
      staleTime: 1000 * 60 * 5,
    });
    const map = new Map<string, Product | null>(skus.map((s) => [s, null]));
    for (const product of products) {
      const key = skus.find((s) => s.toLowerCase() === product.company_sku?.toLowerCase());
      if (key) map.set(key, product);
    }
    return map;
  };

  const lookupBySku = async (sku: string): Promise<Product | null> => {
    const results = await queryClient.fetchQuery({
      queryKey: QUERY_KEYS.PRODUCT_BY_SKU(sku),
      queryFn: () => productsApi.getAll(sku),
      staleTime: 1000 * 60 * 5,
    });
    return results.find((p) => p.company_sku?.toLowerCase() === sku.toLowerCase()) ?? null;
  };

  return { lookupBySku, lookupBySkus };
};
