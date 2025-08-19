// Generated API types - this would normally be generated from OpenAPI spec
export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiftToken {
  id: number;
  projectId: number;
  tokenId: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  projectId: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MintRequest {
  id: number;
  projectId: number;
  status: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProjectsParams extends PaginationParams {}

export interface LiftTokensParams extends PaginationParams {
  projectId?: number;
}

export interface PaymentsParams extends PaginationParams {
  projectId?: number;
}

export interface MintRequestsParams extends PaginationParams {
  projectId?: number;
}