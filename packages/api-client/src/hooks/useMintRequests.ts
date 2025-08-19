import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../client';
import type { MintRequest } from '../types/api';

// Query keys
export const mintRequestKeys = {
  all: ['mintRequests'] as const,
  lists: () => [...mintRequestKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number; projectId?: number }) => [...mintRequestKeys.lists(), params] as const,
  details: () => [...mintRequestKeys.all, 'detail'] as const,
  detail: (id: number) => [...mintRequestKeys.details(), id] as const,
};

// Hooks
export const useMintRequests = (params?: { page?: number; limit?: number; projectId?: number }) =>
  useQuery({
    queryKey: mintRequestKeys.list(params),
    queryFn: () => client.mintRequests.list(params),
  });

export const useMintRequest = (id: number) =>
  useQuery({
    queryKey: mintRequestKeys.detail(id),
    queryFn: () => client.mintRequests.get(id),
    enabled: !!id,
  });

export const useCreateMintRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<MintRequest, 'id' | 'createdAt' | 'updatedAt'>) => 
      client.mintRequests.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mintRequestKeys.lists() });
    },
  });
};