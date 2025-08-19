// apps/api/src/lib/governance.ts
import { createPublicClient, http, parseAbi, getContract, Address, Hash, encodeFunctionData } from 'viem';
import { mainnet, sepolia, polygon, arbitrum } from 'viem/chains';
import { FastifyInstance } from 'fastify';
import { prisma, PrismaClient } from '@orenna/db';
import { blockchainService } from './blockchain.js';
import { getEnv } from '../types/env.js';

const env = getEnv();

// Governance Contract ABIs
export const GOVERNANCE_TOKEN_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function getVotes(address account) view returns (uint256)',
  'function getPastVotes(address account, uint256 blockNumber) view returns (uint256)',
  'function delegates(address account) view returns (address)',
  'function delegate(address delegatee)',
  'function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)',
  'event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)',
  'event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)',
]);

export const GOVERNOR_ABI = parseAbi([
  'function name() view returns (string)',
  'function version() view returns (string)',
  'function votingDelay() view returns (uint256)',
  'function votingPeriod() view returns (uint256)',
  'function proposalThreshold() view returns (uint256)',
  'function quorum(uint256 blockNumber) view returns (uint256)',
  'function getVotes(address account, uint256 blockNumber) view returns (uint256)',
  'function hasVoted(uint256 proposalId, address account) view returns (bool)',
  'function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)',
  'function proposalDeadline(uint256 proposalId) view returns (uint256)',
  'function proposalSnapshot(uint256 proposalId) view returns (uint256)',
  'function state(uint256 proposalId) view returns (uint8)',
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
  'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)',
  'function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) returns (uint256)',
  'function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)',
  'function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)',
  'function cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)',
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
  'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)',
  'event ProposalQueued(uint256 proposalId, uint256 eta)',
  'event ProposalExecuted(uint256 proposalId)',
  'event ProposalCanceled(uint256 proposalId)',
]);

export const TIMELOCK_ABI = parseAbi([
  'function getMinDelay() view returns (uint256)',
  'function isOperation(bytes32 id) view returns (bool)',
  'function isOperationPending(bytes32 id) view returns (bool)',
  'function isOperationReady(bytes32 id) view returns (bool)',
  'function isOperationDone(bytes32 id) view returns (bool)',
  'function getTimestamp(bytes32 id) view returns (uint256)',
  'function hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) pure returns (bytes32)',
  'function hashOperationBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt) pure returns (bytes32)',
  'function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)',
  'function scheduleBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt, uint256 delay)',
  'function cancel(bytes32 id)',
  'function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)',
  'function executeBatch(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt)',
  'event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)',
  'event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data)',
  'event Cancelled(bytes32 indexed id)',
]);

// Contract addresses (will be populated from environment or deployment)
const CONTRACT_ADDRESSES = {
  1: { // Mainnet
    governanceToken: env.GOVERNANCE_TOKEN_ADDRESS_MAINNET as Address,
    governor: env.GOVERNOR_ADDRESS_MAINNET as Address,
    timelock: env.TIMELOCK_ADDRESS_MAINNET as Address,
  },
  11155111: { // Sepolia
    governanceToken: env.GOVERNANCE_TOKEN_ADDRESS_SEPOLIA as Address,
    governor: env.GOVERNOR_ADDRESS_SEPOLIA as Address,
    timelock: env.TIMELOCK_ADDRESS_SEPOLIA as Address,
  },
  137: { // Polygon
    governanceToken: env.GOVERNANCE_TOKEN_ADDRESS_POLYGON as Address,
    governor: env.GOVERNOR_ADDRESS_POLYGON as Address,
    timelock: env.TIMELOCK_ADDRESS_POLYGON as Address,
  },
};

// Proposal states (from OpenZeppelin Governor)
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

// Vote support values
export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export interface ProposalCreateRequest {
  title: string;
  description: string;
  proposalType: string;
  targets: Address[];
  values: bigint[];
  calldatas: string[];
  ecosystemData?: any;
  methodRegistryData?: any;
  financeData?: any;
  liftTokenData?: any;
}

export interface VoteRequest {
  proposalId: string;
  support: VoteSupport;
  reason?: string;
}

export interface DelegationRequest {
  delegatee: Address;
}

export class GovernanceService {
  private prisma: PrismaClient;
  private app: FastifyInstance;

  constructor(app: FastifyInstance, prisma: PrismaClient) {
    this.app = app;
    this.prisma = prisma;
  }

  /**
   * Get governance token information for a user
   */
  async getGovernanceToken(userAddress: Address, chainId: number = 1) {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses?.governanceToken) {
      throw new Error(`Governance token not deployed on chain ${chainId}`);
    }

    const client = blockchainService.getPublicClient(chainId);
    const tokenContract = getContract({
      address: addresses.governanceToken,
      abi: GOVERNANCE_TOKEN_ABI,
      client,
    });

    // Get on-chain data
    const [balance, votingPower, delegate] = await Promise.all([
      client.readContract({
        address: tokenContract.address,
        abi: tokenContract.abi,
        functionName: 'balanceOf',
        args: [userAddress],
      }),
      client.readContract({
        address: tokenContract.address,
        abi: tokenContract.abi,
        functionName: 'getVotes',
        args: [userAddress],
      }),
      client.readContract({
        address: tokenContract.address,
        abi: tokenContract.abi,
        functionName: 'delegates',
        args: [userAddress],
      }),
    ]);

    // Get or create database record
    const user = await this.prisma.user.findUnique({
      where: { address: userAddress.toLowerCase() },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let governanceToken = await this.prisma.governanceToken.findUnique({
      where: {
        userId_tokenAddress_chainId: {
          userId: user.id,
          tokenAddress: addresses.governanceToken.toLowerCase(),
          chainId,
        },
      },
    });

    if (!governanceToken) {
      governanceToken = await this.prisma.governanceToken.create({
        data: {
          userId: user.id,
          tokenAddress: addresses.governanceToken.toLowerCase(),
          chainId,
          balance: balance.toString(),
          votingPower: votingPower.toString(),
          delegatedTo: delegate !== userAddress ? delegate.toLowerCase() : null,
        },
      });
    } else {
      // Update with latest on-chain data
      governanceToken = await this.prisma.governanceToken.update({
        where: { id: governanceToken.id },
        data: {
          balance: balance.toString(),
          votingPower: votingPower.toString(),
          delegatedTo: delegate !== userAddress ? delegate.toLowerCase() : null,
          lastSyncAt: new Date(),
        },
      });
    }

    return {
      ...governanceToken,
      onChain: {
        balance: balance.toString(),
        votingPower: votingPower.toString(),
        delegate: delegate.toLowerCase(),
      },
    };
  }

  /**
   * Get governance proposals with pagination
   */
  async getProposals(
    chainId: number = 1,
    limit: number = 20,
    offset: number = 0,
    status?: string,
    proposalType?: string
  ) {
    const where: any = { chainId };
    
    if (status) {
      where.status = status;
    }
    
    if (proposalType) {
      where.proposalType = proposalType;
    }

    const [proposals, total] = await Promise.all([
      this.prisma.governanceProposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          votes: {
            include: {
              proposal: false,
            },
          },
          events: true,
        },
      }),
      this.prisma.governanceProposal.count({ where }),
    ]);

    return {
      proposals,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get a specific proposal by ID
   */
  async getProposal(proposalId: string) {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
      include: {
        votes: {
          orderBy: { votedAt: 'desc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Get current on-chain state
    const addresses = CONTRACT_ADDRESSES[proposal.chainId as keyof typeof CONTRACT_ADDRESSES];
    if (addresses?.governor) {
      try {
        const client = blockchainService.getPublicClient(proposal.chainId);
        const governorContract = getContract({
          address: addresses.governor,
          abi: GOVERNOR_ABI,
          client,
        });

        const [state, votes, deadline, snapshot] = await Promise.all([
          client.readContract({
            address: governorContract.address,
            abi: governorContract.abi,
            functionName: 'state',
            args: [BigInt(proposalId)],
          }),
          client.readContract({
            address: governorContract.address,
            abi: governorContract.abi,
            functionName: 'proposalVotes',
            args: [BigInt(proposalId)],
          }),
          client.readContract({
            address: governorContract.address,
            abi: governorContract.abi,
            functionName: 'proposalDeadline',
            args: [BigInt(proposalId)],
          }),
          client.readContract({
            address: governorContract.address,
            abi: governorContract.abi,
            functionName: 'proposalSnapshot',
            args: [BigInt(proposalId)],
          }),
        ]);

        return {
          ...proposal,
          onChain: {
            state: Number(state),
            stateName: ProposalState[Number(state)],
            votes: {
              against: votes[0].toString(),
              for: votes[1].toString(),
              abstain: votes[2].toString(),
            },
            deadline: deadline.toString(),
            snapshot: snapshot.toString(),
          },
        };
      } catch (error) {
        console.warn('Failed to fetch on-chain proposal state:', error);
      }
    }

    return proposal;
  }

  /**
   * Create a new governance proposal
   */
  async createProposal(
    proposerAddress: Address,
    proposal: ProposalCreateRequest,
    chainId: number = 1
  ) {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses?.governor) {
      throw new Error(`Governor not deployed on chain ${chainId}`);
    }

    // Validate proposer has enough tokens
    const tokenInfo = await this.getGovernanceToken(proposerAddress, chainId);
    // Add validation logic here based on proposal threshold

    // Generate proposal description with metadata
    const description = `${proposal.title}\n\n${proposal.description}\n\n## Metadata\n${JSON.stringify({
      proposalType: proposal.proposalType,
      ecosystemData: proposal.ecosystemData,
      methodRegistryData: proposal.methodRegistryData,
      financeData: proposal.financeData,
      liftTokenData: proposal.liftTokenData,
    }, null, 2)}`;

    // Create database record first
    const user = await this.prisma.user.findUnique({
      where: { address: proposerAddress.toLowerCase() },
    });

    if (!user) {
      throw new Error('Proposer not found in database');
    }

    const dbProposal = await this.prisma.governanceProposal.create({
      data: {
        proposalId: '0', // Will be updated after on-chain creation
        chainId,
        title: proposal.title,
        description: proposal.description,
        proposalType: proposal.proposalType as any,
        targets: JSON.stringify(proposal.targets),
        values: JSON.stringify(proposal.values.map(v => v.toString())),
        calldatas: JSON.stringify(proposal.calldatas),
        ecosystemData: proposal.ecosystemData || null,
        methodRegistryData: proposal.methodRegistryData || null,
        financeData: proposal.financeData || null,
        liftTokenData: proposal.liftTokenData || null,
        proposerAddress: proposerAddress.toLowerCase(),
        proposerUserId: user.id,
        forVotes: '0',
        againstVotes: '0',
        abstainVotes: '0',
      },
    });

    return {
      proposal: dbProposal,
      onChainData: {
        targets: proposal.targets,
        values: proposal.values,
        calldatas: proposal.calldatas,
        description,
      },
    };
  }

  /**
   * Record a vote on a proposal
   */
  async recordVote(
    voterAddress: Address,
    proposalId: string,
    support: VoteSupport,
    votingPower: string,
    reason?: string,
    txHash?: Hash,
    blockNumber?: number
  ) {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { address: voterAddress.toLowerCase() },
    });

    // Create or update vote record
    const vote = await this.prisma.governanceVote.upsert({
      where: {
        proposalId_voterAddress: {
          proposalId: proposal.id,
          voterAddress: voterAddress.toLowerCase(),
        },
      },
      update: {
        support: support === VoteSupport.For ? 'FOR' : support === VoteSupport.Against ? 'AGAINST' : 'ABSTAIN',
        votingPower,
        reason,
        txHash: txHash?.toLowerCase(),
        blockNumber,
      },
      create: {
        proposalId: proposal.id,
        voterAddress: voterAddress.toLowerCase(),
        voterUserId: user?.id,
        support: support === VoteSupport.For ? 'FOR' : support === VoteSupport.Against ? 'AGAINST' : 'ABSTAIN',
        votingPower,
        reason,
        txHash: txHash?.toLowerCase(),
        blockNumber,
      },
    });

    // Update proposal vote totals
    const voteCount = await this.prisma.governanceVote.groupBy({
      by: ['support'],
      where: { proposalId: proposal.id },
      _sum: { votingPower: true },
    });

    const totals = {
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
    };

    voteCount.forEach((group) => {
      const power = group._sum.votingPower || '0';
      switch (group.support) {
        case 'FOR':
          totals.forVotes = power;
          break;
        case 'AGAINST':
          totals.againstVotes = power;
          break;
        case 'ABSTAIN':
          totals.abstainVotes = power;
          break;
      }
    });

    await this.prisma.governanceProposal.update({
      where: { id: proposal.id },
      data: totals,
    });

    return vote;
  }

  /**
   * Record delegation event
   */
  async recordDelegation(
    delegatorAddress: Address,
    delegateeAddress: Address,
    amount: string,
    chainId: number = 1,
    txHash?: Hash,
    blockNumber?: number
  ) {
    const tokenInfo = await this.getGovernanceToken(delegatorAddress, chainId);

    // Deactivate previous delegations
    await this.prisma.governanceDelegation.updateMany({
      where: {
        tokenId: tokenInfo.id,
        delegatorAddress: delegatorAddress.toLowerCase(),
        active: true,
      },
      data: {
        active: false,
        revokedAt: new Date(),
      },
    });

    // Create new delegation
    const delegation = await this.prisma.governanceDelegation.create({
      data: {
        tokenId: tokenInfo.id,
        delegatorAddress: delegatorAddress.toLowerCase(),
        delegateeAddress: delegateeAddress.toLowerCase(),
        amount,
        txHash: txHash?.toLowerCase(),
        blockNumber,
      },
    });

    // Update governance token record
    await this.prisma.governanceToken.update({
      where: { id: tokenInfo.id },
      data: {
        delegatedTo: delegateeAddress !== delegatorAddress ? delegateeAddress.toLowerCase() : null,
        delegatedAmount: delegateeAddress !== delegatorAddress ? amount : null,
      },
    });

    return delegation;
  }

  /**
   * Get governance parameters
   */
  async getGovernanceParameters(category?: string) {
    const where = category ? { category } : {};
    
    return this.prisma.governanceParameter.findMany({
      where,
      include: {
        changeHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 changes
        },
      },
      orderBy: { parameterKey: 'asc' },
    });
  }

  /**
   * Update governance parameter
   */
  async updateGovernanceParameter(
    parameterKey: string,
    newValue: string,
    proposalId?: string,
    implementedBy?: Address,
    emergencyOverride: boolean = false,
    emergencyReason?: string
  ) {
    const parameter = await this.prisma.governanceParameter.findUnique({
      where: { parameterKey },
    });

    if (!parameter) {
      throw new Error('Parameter not found');
    }

    // Record the change
    await this.prisma.governanceParameterChange.create({
      data: {
        parameterId: parameter.id,
        proposalId,
        oldValue: parameter.currentValue,
        newValue,
        implementedBy: implementedBy?.toLowerCase(),
        emergencyOverride,
        emergencyReason,
        implementedAt: new Date(),
      },
    });

    // Update the parameter
    return this.prisma.governanceParameter.update({
      where: { id: parameter.id },
      data: {
        previousValue: parameter.currentValue,
        currentValue: newValue,
        lastChangedBy: proposalId || implementedBy?.toLowerCase(),
        lastChangedAt: new Date(),
      },
    });
  }

  /**
   * Get governance metrics for a time period
   */
  async getGovernanceMetrics(periodStart: Date, periodEnd: Date, chainId: number = 1) {
    const proposals = await this.prisma.governanceProposal.findMany({
      where: {
        chainId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        votes: true,
      },
    });

    const totalProposals = proposals.length;
    const activeProposals = proposals.filter(p => p.status === 'ACTIVE').length;
    const passedProposals = proposals.filter(p => p.status === 'SUCCEEDED' || p.status === 'EXECUTED').length;
    const failedProposals = proposals.filter(p => p.status === 'DEFEATED').length;

    const allVotes = proposals.flatMap(p => p.votes);
    const totalVotes = allVotes.length;
    const uniqueVoters = new Set(allVotes.map(v => v.voterAddress)).size;

    return {
      periodStart,
      periodEnd,
      totalProposals,
      activeProposals,
      passedProposals,
      failedProposals,
      totalVotes,
      uniqueVoters,
    };
  }
}

export const createGovernanceService = (app: FastifyInstance, prisma: PrismaClient) => {
  return new GovernanceService(app, prisma);
};