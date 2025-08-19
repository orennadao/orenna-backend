import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../client';
import type { Payment } from '../types/api';

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number; projectId?: number }) => [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: number) => [...paymentKeys.details(), id] as const,
};

// Hooks
export const usePayments = (params?: { page?: number; limit?: number; projectId?: number }) =>
  useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => client.payments.list(params),
  });

export const usePayment = (id: number) =>
  useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => client.payments.get(id),
    enabled: !!id,
  });

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => 
      client.payments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
};