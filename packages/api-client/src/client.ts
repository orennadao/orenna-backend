import ky from 'ky';
import type { ApiResponse, PaginatedResponse, Project, LiftToken, Payment, MintRequest } from './types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://orenna-backend-production.up.railway.app';

export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // Add auth headers if available
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Unknown error' })) as { message?: string };
          throw new Error(error.message || `HTTP ${response.status}`);
        }
      },
    ],
  },
});

export const client = {
  // Raw API methods for dynamic endpoints
  get: async <T = any>(path: string): Promise<T> => {
    const response = await apiClient.get(`api/${path}`).json<T>();
    return response;
  },
  post: async <T = any>(path: string, data?: any): Promise<T> => {
    const response = await apiClient.post(`api/${path}`, { json: data }).json<T>();
    return response;
  },
  put: async <T = any>(path: string, data?: any): Promise<T> => {
    const response = await apiClient.put(`api/${path}`, { json: data }).json<T>();
    return response;
  },
  patch: async <T = any>(path: string, data?: any): Promise<T> => {
    const response = await apiClient.patch(`api/${path}`, { json: data }).json<T>();
    return response;
  },
  delete: async (path: string): Promise<void> => {
    await apiClient.delete(`api/${path}`);
  },
  
  projects: {
    list: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Project>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());

      const response = await apiClient.get(`api/projects?${searchParams}`).json<ApiResponse<PaginatedResponse<Project>>>();
      return response.data;
    },
    create: async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
      const response = await apiClient.post('api/projects', { json: data }).json<ApiResponse<Project>>();
      return response.data;
    },
    get: async (id: number): Promise<Project> => {
      const response = await apiClient.get(`api/projects/${id}`).json<ApiResponse<Project>>();
      return response.data;
    },
    update: async (id: number, data: Partial<Project>): Promise<Project> => {
      const response = await apiClient.put(`api/projects/${id}`, { json: data }).json<ApiResponse<Project>>();
      return response.data;
    },
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`api/projects/${id}`);
    },
    getMetrics: async (id: number): Promise<any> => {
      const response = await apiClient.get(`api/projects/${id}/metrics`).json<ApiResponse<any>>();
      return response.data;
    },
    getVerification: async (id: number): Promise<any> => {
      const response = await apiClient.get(`api/projects/${id}/verification`).json<ApiResponse<any>>();
      return response.data;
    },
    updateState: async (id: number, state: string): Promise<Project> => {
      const response = await apiClient.patch(`api/projects/${id}/state`, { json: { state } }).json<ApiResponse<Project>>();
      return response.data;
    },
    updateURIs: async (id: number, data: { tokenUri?: string; registryDataUri?: string; dataHash?: string }): Promise<Project> => {
      const response = await apiClient.patch(`api/projects/${id}/uris`, { json: data }).json<ApiResponse<Project>>();
      return response.data;
    },
    createAttestation: async (id: number, data: { round: number; reportHash: string; reportURI: string; attestor: string }): Promise<any> => {
      const response = await apiClient.post(`api/projects/${id}/attest`, { json: data }).json<ApiResponse<any>>();
      return response.data;
    },
  },
  liftTokens: {
    list: async (params?: { page?: number; limit?: number; projectId?: number }): Promise<PaginatedResponse<LiftToken>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.projectId) searchParams.set('projectId', params.projectId.toString());

      const response = await apiClient.get(`api/lift-tokens?${searchParams}`).json<ApiResponse<PaginatedResponse<LiftToken>>>();
      return response.data;
    },
    get: async (id: number): Promise<LiftToken> => {
      const response = await apiClient.get(`api/lift-tokens/${id}`).json<ApiResponse<LiftToken>>();
      return response.data;
    },
  },
  payments: {
    list: async (params?: { page?: number; limit?: number; projectId?: number }): Promise<PaginatedResponse<Payment>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.projectId) searchParams.set('projectId', params.projectId.toString());

      const response = await apiClient.get(`api/payments?${searchParams}`).json<ApiResponse<PaginatedResponse<Payment>>>();
      return response.data;
    },
    create: async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
      const response = await apiClient.post('api/payments', { json: data }).json<ApiResponse<Payment>>();
      return response.data;
    },
    get: async (id: number): Promise<Payment> => {
      const response = await apiClient.get(`api/payments/${id}`).json<ApiResponse<Payment>>();
      return response.data;
    },
  },
  mintRequests: {
    list: async (params?: { page?: number; limit?: number; projectId?: number }): Promise<PaginatedResponse<MintRequest>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.projectId) searchParams.set('projectId', params.projectId.toString());

      const response = await apiClient.get(`api/mint-requests?${searchParams}`).json<ApiResponse<PaginatedResponse<MintRequest>>>();
      return response.data;
    },
    create: async (data: Omit<MintRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<MintRequest> => {
      const response = await apiClient.post('api/mint-requests', { json: data }).json<ApiResponse<MintRequest>>();
      return response.data;
    },
    get: async (id: number): Promise<MintRequest> => {
      const response = await apiClient.get(`api/mint-requests/${id}`).json<ApiResponse<MintRequest>>();
      return response.data;
    },
  },
};