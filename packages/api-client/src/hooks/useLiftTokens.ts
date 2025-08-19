import { useQuery } from '@tanstack/react-query';
import { client } from '../client';

// Query keys
export const liftTokenKeys = {
  all: ['liftTokens'] as const,
  lists: () => [...liftTokenKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number; projectId?: number }) => [...liftTokenKeys.lists(), params] as const,
  details: () => [...liftTokenKeys.all, 'detail'] as const,
  detail: (id: number) => [...liftTokenKeys.details(), id] as const,
};

// Hooks
export const useLiftTokens = (params?: { page?: number; limit?: number; projectId?: number }) =>
  useQuery({
    queryKey: liftTokenKeys.list(params),
    queryFn: () => client.liftTokens.list(params),
  });

export const useLiftToken = (id: number) =>
  useQuery({
    queryKey: liftTokenKeys.detail(id),
    queryFn: () => client.liftTokens.get(id),
    enabled: !!id,
  });