import { fetchWithCache, createCacheKey, apiCache } from './cache';

const API_BASE_URL = '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheOptions?: { ttl?: number; useCache?: boolean; staleWhileRevalidate?: boolean }
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Use cache for GET requests by default
    const shouldUseCache = cacheOptions?.useCache !== false && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'PATCH' && options.method !== 'DELETE';
    
    if (shouldUseCache) {
      try {
        return await fetchWithCache(url, config, {
          ttl: cacheOptions?.ttl || 5 * 60 * 1000, // 5 minutes default
          staleWhileRevalidate: cacheOptions?.staleWhileRevalidate || true
        });
      } catch (error) {
        console.error('Cached API request failed:', error);
        throw error;
      }
    }

    // Fallback to regular fetch for non-cacheable requests
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - user should re-authenticate
          throw new Error('Authentication required');
        }
        
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Invalidate related cache entries for mutations
      if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' || options.method === 'DELETE') {
        this.invalidateCache(endpoint);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private invalidateCache(endpoint: string): void {
    // Simple cache invalidation - remove entries that start with the endpoint base
    const baseEndpoint = endpoint.split('?')[0].split('/').slice(0, 3).join('/');
    // This is a basic implementation - in a real app you'd want more sophisticated cache invalidation
    apiCache.clear();
  }

  // Health endpoints
  async getHealth() {
    return this.request('/health/liveness');
  }

  // Payment endpoints
  async getPayments(params?: {
    status?: string;
    paymentType?: string;
    chainId?: number;
    payerAddress?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/payments${query}`);
  }

  async getPayment(paymentId: string) {
    return this.request(`/payments/${paymentId}`);
  }

  async createPayment(payment: import('@/types/api').CreatePaymentRequest) {
    return this.request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async getProjectPayments(projectId: number, params?: {
    status?: string;
    paymentType?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/payments/project/${projectId}${query}`);
  }

  // Project endpoints
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(projectId: number) {
    return this.request(`/projects/${projectId}`);
  }

  // Lift unit endpoints
  async getLiftUnits(params?: {
    status?: string;
    projectId?: number;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/lift-units${query}`);
  }

  async getLiftUnit(liftUnitId: number) {
    return this.request(`/lift-units/${liftUnitId}`);
  }

  // Mint request endpoints
  async getMintRequests(params?: {
    status?: string;
    projectId?: number;
    requestedBy?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/mint-requests${query}`);
  }

  async getMintRequest(mintRequestId: string) {
    return this.request(`/mint-requests/${mintRequestId}`);
  }

  async createMintRequest(request: import('@/types/api').CreateMintRequestRequest) {
    return this.request('/mint-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateMintRequest(mintRequestId: string, update: {
    status: 'APPROVED' | 'REJECTED';
    approvalNotes?: string;
  }) {
    return this.request(`/mint-requests/${mintRequestId}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  }

  // Indexer endpoints
  async getIndexerStatus() {
    return this.request('/indexer/status');
  }

  async getIndexedEvents(params?: {
    chainId?: number;
    contractAddress?: string;
    eventName?: string;
    processed?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/indexer/events${query}`);
  }
}

export const apiClient = new ApiClient();
export const api = apiClient; // Export alias for compatibility