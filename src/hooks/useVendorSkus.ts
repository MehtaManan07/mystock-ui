import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorSkusApi } from '../api/vendorSkus.api';
import { QUERY_KEYS } from '../constants';
import type { CreateVendorSkuDto, UpdateVendorSkuDto, ProductDetail } from '../types';
import { useNotificationStore } from '../stores/notificationStore';

export const useCreateVendorSku = (productId: number) => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (data: CreateVendorSkuDto) => vendorSkusApi.create(data),
    onSuccess: (serverSku) => {
      // Directly update ProductDetail cache with the new vendor SKU
      // server returns vendor_id and vendor_sku; we need vendor_name from the contacts cache
      queryClient.setQueryData<ProductDetail>(
        QUERY_KEYS.PRODUCT(productId),
        (old) => {
          if (!old) return old;
          // Look up vendor name from contacts cache if available
          const contacts = queryClient.getQueryData<{ id: number; name: string }[]>(
            QUERY_KEYS.CONTACTS
          );
          const vendor = contacts?.find((c) => c.id === serverSku.vendor_id);
          return {
            ...old,
            vendor_skus: [
              ...old.vendor_skus,
              {
                vendor_id: serverSku.vendor_id,
                vendor_name: vendor?.name ?? `Vendor ${serverSku.vendor_id}`,
                vendor_sku: serverSku.vendor_sku,
              },
            ],
          };
        }
      );
      success('Vendor SKU added successfully');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Failed to add vendor SKU');
    },
  });
};

export const useUpdateVendorSku = (productId: number) => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: ({ vendorId, data }: { vendorId: number; data: UpdateVendorSkuDto }) =>
      vendorSkusApi.update(productId, vendorId, data),

    onMutate: async ({ vendorId, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) });

      const previousProduct = queryClient.getQueryData(QUERY_KEYS.PRODUCT(productId));

      queryClient.setQueryData<ProductDetail>(
        QUERY_KEYS.PRODUCT(productId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            vendor_skus: old.vendor_skus.map((s) =>
              s.vendor_id === vendorId ? { ...s, vendor_sku: data.vendor_sku } : s
            ),
          };
        }
      );

      return { previousProduct };
    },

    onSuccess: () => {
      success('Vendor SKU updated successfully');
    },

    onError: (err: any, _, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(QUERY_KEYS.PRODUCT(productId), context.previousProduct);
      }
      error(err?.response?.data?.message || err?.message || 'Failed to update vendor SKU');
    },
  });
};

export const useDeleteVendorSku = (productId: number) => {
  const queryClient = useQueryClient();
  const { success, error } = useNotificationStore();

  return useMutation({
    mutationFn: (vendorId: number) => vendorSkusApi.delete(productId, vendorId),

    onMutate: async (vendorId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) });

      const previousProduct = queryClient.getQueryData(QUERY_KEYS.PRODUCT(productId));

      queryClient.setQueryData<ProductDetail>(
        QUERY_KEYS.PRODUCT(productId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            vendor_skus: old.vendor_skus.filter((s) => s.vendor_id !== vendorId),
          };
        }
      );

      return { previousProduct };
    },

    onSuccess: () => {
      success('Vendor SKU removed successfully');
    },

    onError: (err: any, _, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(QUERY_KEYS.PRODUCT(productId), context.previousProduct);
      }
      error(err?.response?.data?.message || err?.message || 'Failed to remove vendor SKU');
    },
  });
};
