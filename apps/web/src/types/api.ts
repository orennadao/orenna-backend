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
export type PaymentType = 'LIFT_TOKEN_PURCHASE' | 'PROJECT_FUNDING' | 'REPAYMENT' | 'PLATFORM_FEE' | 'STEWARD_PAYMENT';
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
  projectId?: number;
  paymentType?: PaymentType;
  amount: string;
  paymentToken?: string;
  payerAddress: string;
  recipientAddress: string;
  chainId?: number;
  payerEmail?: string;
  escrowContract?: string;
  escrowConfig?: Record<string, any>;
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

// Lift Token Types
export interface LiftToken {
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
  events?: LiftTokenEvent[];
}

export interface LiftTokenEvent {
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

// Governance Types
export type GovernanceProposalType = 
  | 'STANDARD'
  | 'ECOSYSTEM_PARAMETER' 
  | 'METHOD_REGISTRY'
  | 'PROTOCOL_UPGRADE'
  | 'TREASURY_ALLOCATION'
  | 'LIFT_TOKEN_GOVERNANCE'
  | 'FINANCE_PLATFORM'
  | 'FEE_ADJUSTMENT'
  | 'EMERGENCY';

export type GovernanceProposalStatus = 
  | 'PENDING'
  | 'ACTIVE'
  | 'SUCCEEDED'
  | 'DEFEATED'
  | 'QUEUED'
  | 'EXECUTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type GovernanceVoteSupport = 'FOR' | 'AGAINST' | 'ABSTAIN';

export interface GovernanceToken {
  id: number;
  userId: number;
  tokenAddress: string;
  chainId: number;
  symbol: string;
  balance: string;
  delegatedTo?: string;
  delegatedAmount?: string;
  votingPower: string;
  lastSyncBlock?: number;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceProposal {
  id: number;
  proposalId: string;
  txHash?: string;
  blockNumber?: number;
  chainId: number;
  title: string;
  description: string;
  proposalType: GovernanceProposalType;
  targets: any; // JSON array
  values: any; // JSON array  
  calldatas: any; // JSON array
  ipfsHash?: string;
  metadataUri?: string;
  ecosystemData?: any;
  methodRegistryData?: any;
  financeData?: any;
  liftTokenData?: any;
  startBlock?: string;
  endBlock?: string;
  executionETA?: string;
  status: GovernanceProposalStatus;
  state?: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorumReached: boolean;
  proposerAddress: string;
  proposerUserId?: number;
  executed: boolean;
  executedAt?: string;
  executedTxHash?: string;
  queued: boolean;
  queuedAt?: string;
  queuedTxHash?: string;
  cancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  votes?: GovernanceVote[];
  events?: GovernanceEvent[];
  onChain?: {
    state: number;
    stateName: string;
    votes: {
      against: string;
      for: string;
      abstain: string;
    };
    deadline: string;
    snapshot: string;
  };
}

export interface GovernanceVote {
  id: number;
  proposalId: number;
  voterAddress: string;
  voterUserId?: number;
  support: GovernanceVoteSupport;
  votingPower: string;
  reason?: string;
  txHash?: string;
  blockNumber?: number;
  logIndex?: number;
  isDelegated: boolean;
  delegatedFrom?: string;
  votedAt: string;
}

export interface GovernanceDelegation {
  id: number;
  tokenId: number;
  delegatorAddress: string;
  delegateeAddress: string;
  amount: string;
  txHash?: string;
  blockNumber?: number;
  active: boolean;
  revokedAt?: string;
  revokedTxHash?: string;
  createdAt: string;
}

export interface GovernanceEvent {
  id: number;
  eventId: string;
  proposalId?: number;
  eventType: string;
  actorAddress: string;
  txHash?: string;
  blockNumber?: number;
  logIndex?: number;
  eventData?: any;
  oldValue?: string;
  newValue?: string;
  chainId: number;
  contractAddress?: string;
  createdAt: string;
}

export interface GovernanceParameter {
  id: number;
  parameterKey: string;
  parameterType: string;
  category: string;
  currentValue: string;
  currentUnit?: string;
  valueType: string;
  minValue?: string;
  maxValue?: string;
  allowedValues?: any;
  requiresGovernance: boolean;
  emergencyOverride: boolean;
  lastChangedBy?: string;
  lastChangedAt?: string;
  previousValue?: string;
  title: string;
  description?: string;
  impactLevel: string;
  targetContract?: string;
  targetFunction?: string;
  implementationDelay?: number;
  createdAt: string;
  updatedAt: string;
  changeHistory?: GovernanceParameterChange[];
}

export interface GovernanceParameterChange {
  id: number;
  parameterId: number;
  proposalId?: string;
  oldValue: string;
  newValue: string;
  changeReason?: string;
  implementedAt?: string;
  implementedBy?: string;
  implementationTxHash?: string;
  emergencyOverride: boolean;
  emergencyReason?: string;
  overrideBy?: string;
  createdAt: string;
}

export interface GovernanceMetrics {
  id: number;
  periodStart: string;
  periodEnd: string;
  periodType: string;
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  failedProposals: number;
  totalVotes: number;
  uniqueVoters: number;
  avgVotingPower: string;
  participationRate: string;
  totalSupply: string;
  circulatingSupply: string;
  delegatedAmount: string;
  delegationRate: string;
  avgQuorumReached: string;
  proposalsReachingQuorum: number;
  metrics?: any;
  createdAt: string;
}

// Request/Response Types for Governance API
export interface CreateProposalRequest {
  title: string;
  description: string;
  proposalType: GovernanceProposalType;
  targets: string[];
  values: string[];
  calldatas: string[];
  chainId?: number;
  ecosystemData?: any;
  methodRegistryData?: any;
  financeData?: any;
  liftTokenData?: any;
}

export interface VoteRequest {
  support: 0 | 1 | 2; // Against, For, Abstain
  reason?: string;
  signature?: {
    v: number;
    r: string;
    s: string;
  };
}

export interface DelegationRequest {
  delegatee: string;
  chainId?: number;
  signature?: {
    v: number;
    r: string;
    s: string;
    nonce: number;
    expiry: number;
  };
}