import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorSkusApi } from '../api/vendorSkus.api';
import { QUERY_KEYS } from '../constants';
import type { CreateVendorSkuDto, UpdateVendorSkuDto } from '../types';

export const useCreateVendorSku = (productId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVendorSkuDto) => vendorSkusApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) });
    },
  });
};

export const useUpdateVendorSku = (productId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, data }: { vendorId: number; data: UpdateVendorSkuDto }) =>
      vendorSkusApi.update(productId, vendorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) });
    },
  });
};

export const useDeleteVendorSku = (productId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vendorId: number) => vendorSkusApi.delete(productId, vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) });
    },
  });
};
