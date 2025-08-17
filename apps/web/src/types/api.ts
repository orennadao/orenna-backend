// API Types based on backend schema
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Payment Types
export type PaymentType = 'LIFT_UNIT_PURCHASE' | 'PROJECT_FUNDING' | 'REPAYMENT' | 'PLATFORM_FEE' | 'STEWARD_PAYMENT';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'IN_ESCROW' | 'DISTRIBUTED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  id: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  amount: string;
  paymentToken: string;
  chainId: number;
  payerAddress: string;
  recipientAddress: string;
  txHash?: string;
  blockNumber?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  project?: {
    id: number;
    name: string;
    slug: string;
  };
  events?: PaymentEvent[];
}

export interface PaymentEvent {
  id: string;
  type: string;
  performedBy?: string;
  amount?: string;
  txHash?: string;
  blockNumber?: number;
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  projectId: number;
  paymentType: PaymentType;
  amount: string;
  paymentToken: string;
  payerAddress: string;
  recipientAddress: string;
  chainId: number;
  description?: string;
  metadata?: Record<string, any>;
}

// Project Types
export interface Project {
  id: number;
  name: string;
  slug: string;
  description?: string;
  ownerAddress?: string;
  chainId?: number;
  contractAddress?: string;
  createdAt: string;
  updatedAt: string;
  paymentConfig?: ProjectPaymentConfig;
}

export interface ProjectPaymentConfig {
  id: string;
  projectId: number;
  allocationEscrow?: string;
  repaymentEscrow?: string;
  acceptsPayments: boolean;
  paymentTokens?: string[];
  platformFeeBps?: number;
  platformFeeCap?: string;
}

// Lift Unit Types
export interface LiftUnit {
  id: number;
  externalId?: string;
  tokenId?: string;
  contractAddress?: string;
  chainId?: number;
  status: string;
  quantity?: string;
  unit?: string;
  projectId?: number;
  mintRequestId?: string;
  issuedAt?: string;
  retiredAt?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
    slug: string;
  };
  events?: LiftUnitEvent[];
}

export interface LiftUnitEvent {
  id: number;
  type: string;
  txHash?: string;
  blockNumber?: number;
  payload?: any;
  eventAt: string;
  createdAt: string;
}

// Mint Request Types
export type MintRequestStatus = 'PENDING' | 'APPROVED' | 'MINTING' | 'COMPLETED' | 'REJECTED' | 'FAILED' | 'CANCELLED';

export interface MintRequest {
  id: string;
  projectId: number;
  tokenId: string;
  amount: string;
  recipient: string;
  title: string;
  description?: string;
  requestedBy: string;
  status: MintRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvalNotes?: string;
  txHash?: string;
  blockNumber?: number;
  executedAt?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
    slug: string;
  };
  events?: MintRequestEvent[];
}

export interface MintRequestEvent {
  id: string;
  type: string;
  performedBy: string;
  notes?: string;
  txHash?: string;
  blockNumber?: number;
  createdAt: string;
}

export interface CreateMintRequestRequest {
  projectId: number;
  tokenId: string;
  amount: string;
  recipient: string;
  title: string;
  description?: string;
  verificationData?: Record<string, any>;
  verificationHash?: string;
}

// Blockchain Indexer Types
export interface IndexedEvent {
  id: string;
  chainId: number;
  contractAddress: string;
  eventName: string;
  blockNumber: number;
  blockHash: string;
  blockTimestamp: string;
  txHash: string;
  txIndex: number;
  logIndex: number;
  decodedArgs: any;
  processed: boolean;
  processedAt?: string;
  createdAt: string;
}

export interface IndexerState {
  id: string;
  chainId: number;
  contractAddress: string;
  indexerType: string;
  lastBlockNumber: number;
  lastSyncAt?: string;
  isActive: boolean;
  errorCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}