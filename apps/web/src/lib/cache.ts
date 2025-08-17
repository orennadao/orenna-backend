// API Response Caching Utilities

export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cached items
  staleWhileRevalidate?: boolean;
}

export class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize || 100;
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  isStale(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    return Date.now() - cached.timestamp > cached.ttl * 0.8; // 80% of TTL
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const apiCache = new APICache({
  maxSize: 100,
  ttl: 5 * 60 * 1000 // 5 minutes default
});

// Cache key generators
export function createCacheKey(url: string, params?: Record<string, any>): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${url}:${paramString}`;
}

// Fetch with caching
export async function fetchWithCache(
  url: string, 
  options: RequestInit = {},
  cacheConfig: CacheConfig = {}
): Promise<any> {
  const cacheKey = createCacheKey(url, options.body ? JSON.parse(options.body as string) : undefined);
  
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached && !cacheConfig.staleWhileRevalidate) {
    return cached;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    apiCache.set(cacheKey, data, cacheConfig.ttl);
    
    return data;
  } catch (error) {
    // Return stale data if available and fetch failed
    if (cached && cacheConfig.staleWhileRevalidate) {
      console.warn('Using stale data due to fetch error:', error);
      return cached;
    }
    throw error;
  }
}

// React Query configuration
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
};

// Background cache cleanup
if (typeof window !== 'undefined') {
  // Clean up cache every 10 minutes
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}