import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../client';
import type { Project } from '../types/api';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

// Hooks
export const useProjects = (params?: { page?: number; limit?: number }) =>
  useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => client.projects.list(params),
  });

export const useProject = (id: number) =>
  useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => client.projects.get(id),
    enabled: !!id,
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => 
      client.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) => 
      client.projects.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => client.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

export const useProjectMetrics = (id: number) =>
  useQuery({
    queryKey: [...projectKeys.detail(id), 'metrics'],
    queryFn: () => client.projects.getMetrics(id),
    enabled: !!id,
  });

export const useProjectVerification = (id: number) =>
  useQuery({
    queryKey: [...projectKeys.detail(id), 'verification'],
    queryFn: () => client.projects.getVerification(id),
    enabled: !!id,
  });

export const useUpdateProjectState = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, state }: { id: number; state: string }) => 
      client.projects.updateState(id, state),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

export const useUpdateProjectURIs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { tokenUri?: string; registryDataUri?: string; dataHash?: string } }) => 
      client.projects.updateURIs(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
};

export const useCreateAttestation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { round: number; reportHash: string; reportURI: string; attestor: string } }) => 
      client.projects.createAttestation(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(variables.id), 'verification'] });
    },
  });
};