import { fetchWithCache, createCacheKey, apiCache } from './cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://orenna-7notjkury-orenna-dao.vercel.app/api'
    : '/api');

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
    return this.request('/health');
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
    return this.request('/payments', {
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

  // Lift token endpoints
  async getLiftTokens(params?: {
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
    return this.request(`/lift-tokens${query}`);
  }

  async getLiftToken(liftTokenId: number) {
    return this.request(`/lift-tokens/${liftTokenId}`);
  }

  async createLiftToken(liftToken: {
    projectId?: number;
    tokenId: string;
    maxSupply: string;
    quantity?: string;
    unit?: string;
    meta?: Record<string, any>;
    uri?: string;
  }) {
    return this.request('/lift-tokens', {
      method: 'POST',
      body: JSON.stringify(liftToken),
    });
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

  // Governance endpoints
  governance = {
    // Get user's governance token information
    getToken: async (params?: { chainId?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.chainId) {
        searchParams.append('chainId', String(params.chainId));
      }
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request(`/governance/token${query}`);
    },

    // Get governance proposals with pagination
    getProposals: async (params?: {
      chainId?: number;
      limit?: number;
      offset?: number;
      status?: string;
      proposalType?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request(`/governance/proposals${query}`);
    },

    // Get specific proposal
    getProposal: async (proposalId: string) => {
      return this.request(`/governance/proposals/${proposalId}`);
    },

    // Create new proposal (preparation for on-chain submission)
    createProposal: async (proposal: {
      title: string;
      description: string;
      proposalType: string;
      targets: string[];
      values: string[];
      calldatas: string[];
      chainId?: number;
      ecosystemData?: any;
      methodRegistryData?: any;
      financeData?: any;
      liftTokenData?: any;
    }) => {
      return this.request('/governance/proposals', {
        method: 'POST',
        body: JSON.stringify(proposal),
      });
    },

    // Record vote (after on-chain transaction)
    recordVote: async (proposalId: string, vote: {
      support: 0 | 1 | 2; // Against, For, Abstain
      reason?: string;
      signature?: {
        v: number;
        r: string;
        s: string;
      };
    }) => {
      return this.request(`/governance/proposals/${proposalId}/vote`, {
        method: 'POST',
        body: JSON.stringify(vote),
      });
    },

    // Record delegation (after on-chain transaction)
    recordDelegation: async (delegation: {
      delegatee: string;
      chainId?: number;
      signature?: {
        v: number;
        r: string;
        s: string;
        nonce: number;
        expiry: number;
      };
    }) => {
      return this.request('/governance/delegate', {
        method: 'POST',
        body: JSON.stringify(delegation),
      });
    },

    // Get governance parameters
    getParameters: async (params?: { category?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) {
        searchParams.append('category', params.category);
      }
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request(`/governance/parameters${query}`);
    },

    // Get governance metrics
    getMetrics: async (params: {
      chainId?: number;
      periodStart: string; // ISO date string
      periodEnd: string;   // ISO date string
    }) => {
      const searchParams = new URLSearchParams();
      if (params.chainId) {
        searchParams.append('chainId', String(params.chainId));
      }
      searchParams.append('periodStart', params.periodStart);
      searchParams.append('periodEnd', params.periodEnd);
      const query = searchParams.toString();
      return this.request(`/governance/metrics?${query}`);
    },

    // Upload proposal metadata to IPFS
    uploadMetadata: async (metadata: {
      title: string;
      description: string;
      proposalType: string;
      metadata: any;
    }) => {
      return this.request('/governance/proposals/upload-metadata', {
        method: 'POST',
        body: JSON.stringify(metadata),
      });
    },

    // Health check for governance service
    getHealth: async () => {
      return this.request('/governance/health');
    },
  };

  // HTTP method helpers
  async get<T>(endpoint: string, cacheOptions?: { ttl?: number; useCache?: boolean; staleWhileRevalidate?: boolean }): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, { method: 'GET' }, cacheOptions);
    return { data };
  }

  async post<T>(endpoint: string, body?: any, cacheOptions?: { ttl?: number; useCache?: boolean; staleWhileRevalidate?: boolean }): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, { 
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }, cacheOptions);
    return { data };
  }

  async put<T>(endpoint: string, body?: any, cacheOptions?: { ttl?: number; useCache?: boolean; staleWhileRevalidate?: boolean }): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, { 
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }, cacheOptions);
    return { data };
  }

  async patch<T>(endpoint: string, body?: any, cacheOptions?: { ttl?: number; useCache?: boolean; staleWhileRevalidate?: boolean }): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, { 
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    }, cacheOptions);
    return { data };
  }

  async delete<T>(endpoint: string, cacheOptions?: { ttl?: number; useCache?: boolean; staleWhileRevalidate?: boolean }): Promise<{ data: T }> {
    const data = await this.request<T>(endpoint, { method: 'DELETE' }, cacheOptions);
    return { data };
  }
}

export const apiClient = new ApiClient();
export const api = apiClient; // Export alias for compatibility