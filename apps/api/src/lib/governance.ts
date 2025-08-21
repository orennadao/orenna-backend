// apps/api/src/lib/governance.ts
import { createPublicClient, http, parseAbi, getContract, Address, Hash, encodeFunctionData } from 'viem';
import { mainnet, sepolia, polygon, arbitrum } from 'viem/chains';
import { FastifyInstance } from 'fastify';
import { prisma, PrismaClient } from '@orenna/db';
import { blockchainService } from './blockchain.js';
import { getEnv } from '../types/env.js';
import { createIPFSClient, IPFSClient } from './ipfs-client.js';
import crypto from 'crypto';

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
  // DAO Ops extensions
  abstract?: string;
  links?: {
    repo?: string[];
    docs?: string[];
  };
  project?: {
    nftId?: string;
    ipfs?: string;
  };
  liftForward?: {
    template: string;
    milestones: Array<{
      id: string;
      name: string;
      evidence: string[];
      challengeDays: number;
      amount?: string;
    }>;
  };
  budget?: {
    currency: string;
    total: number;
    tranches: Array<{
      amount: number;
      on: string;
    }>;
  };
  risks?: Array<{
    id: string;
    desc: string;
    mitigation: string;
  }>;
  legal?: {
    summary?: string;
    counselMemo?: string;
  };
}

export interface SponsorshipRequest {
  proposalId: string;
  signature?: {
    v: number;
    r: string;
    s: string;
  };
}

export interface ProposalMetadata {
  version: number;
  id: string;
  title: string;
  type: string;
  abstract: string;
  description: string;
  proposalType: string;
  ecosystemData?: any;
  methodRegistryData?: any;
  financeData?: any;
  liftTokenData?: any;
  links?: {
    repo?: string[];
    docs?: string[];
  };
  project?: {
    nftId?: string;
    ipfs?: string;
  };
  liftForward?: any;
  budget?: any;
  params?: {
    quorum: { standard: number; major: number; emergency: number };
    approval: { standard: number; major: number; emergency: number };
    votingDays: number;
    timelockHours: { standard: number; major: number; emergency: number };
  };
  risks?: any[];
  legal?: any;
  changelog?: Array<{ v: string; desc: string }>;
  createdAt: string;
  ipfsHash?: string;
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
  private ipfsClient: IPFSClient;

  constructor(app: FastifyInstance, prisma: PrismaClient) {
    this.app = app;
    this.prisma = prisma;
    this.ipfsClient = createIPFSClient(app.log);
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
   * Create a new governance proposal with DAO Ops functionality
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
    // TODO: Add validation logic here based on proposal threshold

    // Create database record first
    const user = await this.prisma.user.findUnique({
      where: { address: proposerAddress.toLowerCase() },
    });

    if (!user) {
      throw new Error('Proposer not found in database');
    }

    // Create metadata object following DAO Ops template
    const metadata: ProposalMetadata = {
      version: 1,
      id: crypto.randomUUID(),
      title: proposal.title,
      type: proposal.proposalType,
      abstract: proposal.abstract || proposal.description.substring(0, 150),
      description: proposal.description,
      proposalType: proposal.proposalType,
      ecosystemData: proposal.ecosystemData,
      methodRegistryData: proposal.methodRegistryData,
      financeData: proposal.financeData,
      liftTokenData: proposal.liftTokenData,
      links: proposal.links,
      project: proposal.project,
      liftForward: proposal.liftForward,
      budget: proposal.budget,
      params: {
        quorum: { standard: 0.08, major: 0.15, emergency: 0.05 },
        approval: { standard: 0.5001, major: 0.6667, emergency: 0.6 },
        votingDays: 7,
        timelockHours: { standard: 48, major: 72, emergency: 12 }
      },
      risks: proposal.risks,
      legal: proposal.legal,
      changelog: [{ v: "1.0", desc: "initial" }],
      createdAt: new Date().toISOString()
    };

    // Upload metadata to IPFS
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    const ipfsResult = await this.ipfsClient.uploadEvidenceFile(
      metadataBuffer,
      `proposal-${metadata.id}-metadata.json`,
      {
        type: 'governance-proposal-metadata',
        proposalType: proposal.proposalType,
        proposer: proposerAddress.toLowerCase(),
        timestamp: new Date().toISOString()
      }
    );

    // Update metadata with IPFS hash
    metadata.ipfsHash = ipfsResult.cid;

    // Generate proposal description with metadata reference
    const description = `${proposal.title}\n\n${proposal.description}\n\n## Metadata\nIPFS: ${ipfsResult.cid}\nHash: ${ipfsResult.hash}`;

    // Determine proposal status based on type
    let initialStatus: 'DRAFT' | 'PENDING_SPONSORSHIP' = 'DRAFT';
    
    // Check if this proposal type requires sponsorship
    const sponsorshipRequired = ['MAJOR', 'PROTOCOL_UPGRADE'].includes(proposal.proposalType);
    if (sponsorshipRequired) {
      initialStatus = 'PENDING_SPONSORSHIP';
    }

    const dbProposal = await this.prisma.governanceProposal.create({
      data: {
        proposalId: '0', // Will be updated after on-chain creation
        chainId,
        title: proposal.title,
        description: proposal.description,
        proposalType: proposal.proposalType as any,
        status: initialStatus,
        targets: JSON.stringify(proposal.targets),
        values: JSON.stringify(proposal.values.map(v => v.toString())),
        calldatas: JSON.stringify(proposal.calldatas),
        ecosystemData: proposal.ecosystemData || null,
        methodRegistryData: proposal.methodRegistryData || null,
        financeData: proposal.financeData || null,
        liftTokenData: proposal.liftTokenData || null,
        ipfsHash: ipfsResult.cid,
        metadataUri: `ipfs://${ipfsResult.cid}`,
        proposerAddress: proposerAddress.toLowerCase(),
        proposerUserId: user.id,
        forVotes: '0',
        againstVotes: '0',
        abstainVotes: '0',
        antispamDeposit: '250', // Default $250 USDC
        depositPaid: false,
        depositRefunded: false,
      },
    });

    // Create Lift Forward if specified
    if (proposal.liftForward && proposal.budget) {
      const projectNftId = proposal.project?.nftId ? parseInt(proposal.project.nftId) : undefined;
      const projectNftChainId = chainId; // Use the same chain as the proposal
      await this.createLiftForward(
        dbProposal.id, 
        proposal.liftForward, 
        proposal.budget, 
        proposerAddress,
        projectNftId,
        projectNftChainId
      );
    }

    return {
      proposal: dbProposal,
      metadata,
      ipfs: ipfsResult,
      onChainData: {
        targets: proposal.targets,
        values: proposal.values,
        calldatas: proposal.calldatas,
        description,
      },
    };
  }

  /**
   * Create a Lift Forward escrow contract for a proposal
   */
  async createLiftForward(
    proposalId: number,
    liftForwardSpec: any,
    budget: any,
    funderAddress: Address,
    projectNftId?: number,
    projectNftChainId?: number
  ) {
    const user = await this.prisma.user.findUnique({
      where: { address: funderAddress.toLowerCase() },
    });

    const liftForward = await this.prisma.liftForward.create({
      data: {
        proposalId,
        projectNftId,
        projectNftChainId,
        status: 'DRAFT',
        totalAmount: budget.total.toString(),
        currency: budget.currency,
        funderAddress: funderAddress.toLowerCase(),
        funderUserId: user?.id,
        template: liftForwardSpec.template,
        challengeWindow: 14, // Default 14 days
      },
    });

    // Create milestones
    for (const [index, milestone] of liftForwardSpec.milestones.entries()) {
      await this.prisma.liftForwardMilestone.create({
        data: {
          liftForwardId: liftForward.id,
          milestoneNumber: index + 1,
          name: milestone.name,
          description: milestone.name,
          amount: milestone.amount || '0',
          evidenceTypes: JSON.stringify(milestone.evidence),
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        },
      });
    }

    return liftForward;
  }

  /**
   * Submit sponsorship for a proposal
   */
  async submitSponsorship(
    sponsorAddress: Address,
    proposalId: string,
    chainId: number = 1
  ) {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'PENDING_SPONSORSHIP') {
      throw new Error('Proposal is not accepting sponsorships');
    }

    // Get sponsor's voting power
    const tokenInfo = await this.getGovernanceToken(sponsorAddress, chainId);
    
    const user = await this.prisma.user.findUnique({
      where: { address: sponsorAddress.toLowerCase() },
    });

    // Check if already sponsored
    const existingSponsorship = await this.prisma.governanceSponsorship.findUnique({
      where: {
        proposalId_sponsorAddress: {
          proposalId: proposal.id,
          sponsorAddress: sponsorAddress.toLowerCase(),
        },
      },
    });

    if (existingSponsorship) {
      throw new Error('Already sponsored this proposal');
    }

    // Create sponsorship record
    const sponsorship = await this.prisma.governanceSponsorship.create({
      data: {
        proposalId: proposal.id,
        sponsorAddress: sponsorAddress.toLowerCase(),
        sponsorUserId: user?.id,
        votingPower: tokenInfo.votingPower,
      },
    });

    // Check if sponsorship threshold is met
    const sponsorships = await this.prisma.governanceSponsorship.findMany({
      where: { proposalId: proposal.id },
    });

    const totalVotingPower = sponsorships.reduce(
      (sum, s) => sum + BigInt(s.votingPower),
      BigInt(0)
    );

    // Calculate sponsorship requirements based on proposal type
    const requirements = this.getProposalRequirements(proposal.proposalType as any);
    
    // TODO: Get total supply to calculate percentage
    // For now, use hardcoded thresholds
    const sponsorshipMet = sponsorships.length >= requirements.minSponsors;

    if (sponsorshipMet) {
      await this.prisma.governanceProposal.update({
        where: { id: proposal.id },
        data: { status: 'PENDING' },
      });
    }

    return {
      sponsorship,
      sponsorshipMet,
      totalSponsors: sponsorships.length,
      requiredSponsors: requirements.minSponsors,
    };
  }

  /**
   * Get proposal requirements based on type
   */
  private getProposalRequirements(proposalType: string) {
    const requirements = {
      STANDARD: { minSponsors: 5, quorum: 0.08, approval: 0.5001, timelock: 48 },
      MAJOR: { minSponsors: 10, quorum: 0.15, approval: 0.6667, timelock: 72 },
      EMERGENCY: { minSponsors: 3, quorum: 0.05, approval: 0.6, timelock: 12 },
    };

    return requirements[proposalType as keyof typeof requirements] || requirements.STANDARD;
  }

  /**
   * Upload proposal metadata to IPFS
   */
  async uploadProposalMetadata(metadata: ProposalMetadata): Promise<string> {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    const result = await this.ipfsClient.uploadEvidenceFile(
      metadataBuffer,
      `proposal-${metadata.id}-metadata.json`,
      {
        type: 'governance-proposal-metadata',
        proposalType: metadata.proposalType,
        timestamp: new Date().toISOString()
      }
    );

    return result.cid;
  }

  /**
   * Retrieve proposal metadata from IPFS
   */
  async retrieveProposalMetadata(ipfsHash: string): Promise<ProposalMetadata> {
    const result = await this.ipfsClient.retrieveEvidenceFile(ipfsHash);
    
    if (!result.verified) {
      throw new Error('Proposal metadata integrity verification failed');
    }

    try {
      return JSON.parse(result.content.toString());
    } catch (error) {
      throw new Error('Invalid proposal metadata format');
    }
  }

  /**
   * Record anti-spam deposit for a proposal
   */
  async recordAntiSpamDeposit(
    userAddress: Address,
    proposalId: string,
    txHash: Hash,
    amount: string,
    chainId: number = 1
  ) {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.depositPaid) {
      throw new Error('Anti-spam deposit already paid for this proposal');
    }

    // Verify the transaction on-chain (this would be implemented with actual blockchain verification)
    // For now, we'll just record the deposit
    
    await this.prisma.governanceProposal.update({
      where: { id: proposal.id },
      data: {
        depositPaid: true,
        antispamDeposit: amount,
      },
    });

    // Record the event
    await this.prisma.governanceEvent.create({
      data: {
        proposalId: proposal.id,
        eventType: 'ANTISPAM_DEPOSIT_PAID',
        txHash: txHash.toLowerCase(),
        eventData: {
          amount,
          payer: userAddress.toLowerCase(),
          chainId,
        },
      },
    });

    return {
      proposalId: proposal.proposalId,
      amount,
      txHash: txHash.toLowerCase(),
      paid: true,
    };
  }

  /**
   * Get proposal sponsorships
   */
  async getProposalSponsorships(proposalId: string) {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
      include: {
        sponsorships: {
          include: {
            sponsor: {
              select: {
                id: true,
                address: true,
                username: true,
                ensName: true,
              },
            },
          },
        },
      },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const requirements = this.getProposalRequirements(proposal.proposalType as any);
    const totalVotingPower = proposal.sponsorships.reduce(
      (sum, s) => sum + BigInt(s.votingPower),
      BigInt(0)
    );

    return {
      sponsorships: proposal.sponsorships,
      total: proposal.sponsorships.length,
      required: requirements.minSponsors,
      totalVotingPower: totalVotingPower.toString(),
      sponsorshipMet: proposal.sponsorships.length >= requirements.minSponsors,
    };
  }

  /**
   * Get proposal requirements and status (public version)
   */
  async getProposalRequirementsAndStatus(proposalId: string) {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const requirements = this.getProposalRequirements(proposal.proposalType as any);
    const sponsorships = await this.prisma.governanceSponsorship.count({
      where: { proposalId: proposal.id },
    });

    return {
      proposalType: proposal.proposalType,
      requirements,
      current: {
        sponsors: sponsorships,
        depositPaid: proposal.depositPaid,
      },
      status: {
        sponsorshipMet: sponsorships >= requirements.minSponsors,
        depositMet: proposal.depositPaid,
        canSubmit: sponsorships >= requirements.minSponsors && proposal.depositPaid,
      },
    };
  }

  /**
   * Start voting period for a proposal (after sponsorship and deposit requirements met)
   */
  async startVotingPeriod(proposalId: string, chainId: number = 1) {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
      include: {
        sponsorships: true,
      },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Check if requirements are met
    const requirements = this.getProposalRequirements(proposal.proposalType as any);
    const sponsorshipMet = proposal.sponsorships.length >= requirements.minSponsors;
    
    if (!sponsorshipMet) {
      throw new Error('Sponsorship requirements not met');
    }

    if (!proposal.depositPaid) {
      throw new Error('Anti-spam deposit not paid');
    }

    if (proposal.status !== 'PENDING') {
      throw new Error('Proposal is not in pending state');
    }

    // Calculate voting window (7 days = 604800 seconds)
    const votingPeriodSeconds = 7 * 24 * 60 * 60;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + votingPeriodSeconds * 1000);

    // Get current block for snapshot
    const currentBlock = await this.getCurrentBlock(chainId);
    
    await this.prisma.governanceProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'ACTIVE',
        startBlock: currentBlock,
        endBlock: currentBlock + Math.floor(votingPeriodSeconds / 12), // Assuming 12s blocks
        snapshotBlock: currentBlock,
      },
    });

    // Record event
    await this.prisma.governanceEvent.create({
      data: {
        proposalId: proposal.id,
        eventType: 'VOTING_STARTED',
        eventData: {
          startBlock: currentBlock,
          endTime: endTime.toISOString(),
          votingPeriodSeconds,
          chainId,
        },
      },
    });

    return {
      proposalId: proposal.proposalId,
      status: 'ACTIVE',
      votingStarted: startTime,
      votingEnds: endTime,
      snapshotBlock: currentBlock,
    };
  }

  /**
   * Get current block number for a chain
   */
  private async getCurrentBlock(chainId: number): Promise<number> {
    try {
      const client = blockchainService.getPublicClient(chainId);
      const blockNumber = await client.getBlockNumber();
      return Number(blockNumber);
    } catch (error) {
      // Fallback to approximate block based on time
      return Math.floor(Date.now() / 12000); // 12s block time estimate
    }
  }

  /**
   * Check if proposal meets quorum requirements
   */
  async checkQuorum(proposalId: string, chainId: number = 1): Promise<{
    hasQuorum: boolean;
    requiredQuorum: string;
    currentVotes: string;
    quorumPercentage: number;
  }> {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const requirements = this.getProposalRequirements(proposal.proposalType as any);
    
    // Calculate total votes
    const totalVotes = BigInt(proposal.forVotes) + 
                      BigInt(proposal.againstVotes) + 
                      BigInt(proposal.abstainVotes);

    // Get total supply at snapshot block (simplified - in practice would query on-chain)
    const estimatedTotalSupply = BigInt('500000000000000000000000'); // 500k tokens with 18 decimals
    const requiredQuorum = (estimatedTotalSupply * BigInt(Math.floor(requirements.quorum * 10000))) / BigInt(10000);

    const hasQuorum = totalVotes >= requiredQuorum;
    const quorumPercentage = Number(totalVotes * BigInt(10000) / estimatedTotalSupply) / 100;

    return {
      hasQuorum,
      requiredQuorum: requiredQuorum.toString(),
      currentVotes: totalVotes.toString(),
      quorumPercentage,
    };
  }

  /**
   * Check if proposal voting period has ended and finalize if needed
   */
  async finalizeVotingIfEnded(proposalId: string): Promise<{
    ended: boolean;
    result?: 'SUCCEEDED' | 'DEFEATED';
    reason?: string;
  }> {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'ACTIVE') {
      return { ended: false, reason: 'Proposal not in active voting' };
    }

    // Check if voting period has ended (using endBlock)
    const currentBlock = await this.getCurrentBlock(proposal.chainId);
    if (!proposal.endBlock || currentBlock < proposal.endBlock) {
      return { ended: false, reason: 'Voting period still active' };
    }

    // Check quorum and approval
    const quorumResult = await this.checkQuorum(proposalId, proposal.chainId);
    const requirements = this.getProposalRequirements(proposal.proposalType as any);
    
    const forVotes = BigInt(proposal.forVotes);
    const againstVotes = BigInt(proposal.againstVotes);
    const totalVotes = forVotes + againstVotes + BigInt(proposal.abstainVotes);
    
    let result: 'SUCCEEDED' | 'DEFEATED';
    let reason: string;

    if (!quorumResult.hasQuorum) {
      result = 'DEFEATED';
      reason = 'Failed to meet quorum requirement';
    } else {
      // Check approval threshold (for vs against, abstain doesn't count)
      const participatingVotes = forVotes + againstVotes;
      const approvalThreshold = BigInt(Math.floor(requirements.approval * 10000));
      const approvalPercentage = participatingVotes > 0 ? 
        (forVotes * BigInt(10000)) / participatingVotes : BigInt(0);

      if (approvalPercentage >= approvalThreshold) {
        result = 'SUCCEEDED';
        reason = 'Proposal approved by voters';
      } else {
        result = 'DEFEATED';
        reason = 'Failed to meet approval threshold';
      }
    }

    // Update proposal status
    await this.prisma.governanceProposal.update({
      where: { id: proposal.id },
      data: {
        status: result,
      },
    });

    // Record event
    await this.prisma.governanceEvent.create({
      data: {
        proposalId: proposal.id,
        eventType: 'VOTING_ENDED',
        eventData: {
          result,
          reason,
          finalVotes: {
            for: proposal.forVotes,
            against: proposal.againstVotes,
            abstain: proposal.abstainVotes,
          },
          quorum: quorumResult,
          endBlock: currentBlock,
        },
      },
    });

    // If succeeded, queue for timelock
    if (result === 'SUCCEEDED') {
      await this.queueForTimelock(proposal.id, requirements.timelock);
    }

    return { ended: true, result, reason };
  }

  /**
   * Queue proposal for timelock execution
   */
  private async queueForTimelock(proposalId: number, timelockHours: number) {
    const timelockEta = new Date(Date.now() + timelockHours * 60 * 60 * 1000);
    
    await this.prisma.governanceProposal.update({
      where: { id: proposalId },
      data: {
        status: 'QUEUED',
        queuedAt: new Date(),
        timelockEta,
        timelockDelay: timelockHours * 3600, // Convert to seconds
      },
    });

    await this.prisma.governanceEvent.create({
      data: {
        proposalId,
        eventType: 'PROPOSAL_QUEUED',
        eventData: {
          timelockEta: timelockEta.toISOString(),
          timelockHours,
        },
      },
    });
  }

  /**
   * Record a vote on a proposal with DAO Ops compliance
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

    // Check if proposal is in active voting period
    if (proposal.status !== 'ACTIVE') {
      throw new Error('Proposal is not in active voting period');
    }

    // Check if voting period has ended
    const currentBlock = await this.getCurrentBlock(proposal.chainId);
    if (proposal.endBlock && currentBlock >= proposal.endBlock) {
      throw new Error('Voting period has ended');
    }

    const user = await this.prisma.user.findUnique({
      where: { address: voterAddress.toLowerCase() },
    });

    // Verify voting power at snapshot block (simplified - in practice would query on-chain)
    if (BigInt(votingPower) <= 0) {
      throw new Error('No voting power at proposal snapshot');
    }

    // Check if this is a vote change (DAO Ops allows vote changes until deadline)
    const existingVote = await this.prisma.governanceVote.findUnique({
      where: {
        proposalId_voterAddress: {
          proposalId: proposal.id,
          voterAddress: voterAddress.toLowerCase(),
        },
      },
    });

    const isVoteChange = !!existingVote;

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
        votedAt: new Date(),
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

    // Record vote event
    await this.prisma.governanceEvent.create({
      data: {
        proposalId: proposal.id,
        eventType: isVoteChange ? 'VOTE_CHANGED' : 'VOTE_CAST',
        txHash: txHash?.toLowerCase(),
        blockNumber,
        eventData: {
          voter: voterAddress.toLowerCase(),
          support: support === VoteSupport.For ? 'FOR' : support === VoteSupport.Against ? 'AGAINST' : 'ABSTAIN',
          votingPower,
          reason,
          isChange: isVoteChange,
        },
      },
    });

    // Check if voting should be finalized
    await this.finalizeVotingIfEnded(proposalId);

    return {
      vote,
      isChange: isVoteChange,
      currentTotals: totals,
    };
  }

  /**
   * Execute proposal after timelock delay
   */
  async executeProposal(proposalId: string, executorAddress: Address): Promise<{
    executed: boolean;
    txHash?: string;
    error?: string;
  }> {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'QUEUED') {
      throw new Error('Proposal is not queued for execution');
    }

    // Check if timelock delay has passed
    if (!proposal.timelockEta || new Date() < proposal.timelockEta) {
      const timeRemaining = proposal.timelockEta ? 
        Math.ceil((proposal.timelockEta.getTime() - Date.now()) / 1000) : 0;
      throw new Error(`Timelock not ready. Time remaining: ${timeRemaining} seconds`);
    }

    // Check if proposal has expired (24 hour grace period after ETA)
    const graceExpiry = new Date(proposal.timelockEta.getTime() + 24 * 60 * 60 * 1000);
    if (new Date() > graceExpiry) {
      await this.prisma.governanceProposal.update({
        where: { id: proposal.id },
        data: { status: 'EXPIRED' },
      });

      await this.prisma.governanceEvent.create({
        data: {
          proposalId: proposal.id,
          eventType: 'PROPOSAL_EXPIRED',
          eventData: {
            expiredAt: new Date().toISOString(),
            executor: executorAddress.toLowerCase(),
          },
        },
      });

      throw new Error('Proposal has expired (24 hour grace period exceeded)');
    }

    try {
      // Parse execution data
      const targets = JSON.parse(proposal.targets);
      const values = JSON.parse(proposal.values);
      const calldatas = JSON.parse(proposal.calldatas);

      // Execute proposal on-chain (this would integrate with actual timelock contract)
      // For now, we'll simulate the execution and record it in the database
      
      const executionResult = await this.simulateProposalExecution(
        targets,
        values,
        calldatas,
        proposal.chainId
      );

      if (executionResult.success) {
        // Update proposal status
        await this.prisma.governanceProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'EXECUTED',
            executedAt: new Date(),
          },
        });

        // Record execution event
        await this.prisma.governanceEvent.create({
          data: {
            proposalId: proposal.id,
            eventType: 'PROPOSAL_EXECUTED',
            txHash: executionResult.txHash,
            eventData: {
              executor: executorAddress.toLowerCase(),
              executedAt: new Date().toISOString(),
              targets,
              values,
              calldatas,
            },
          },
        });

        // Refund anti-spam deposit if applicable
        if (proposal.depositPaid && !proposal.depositRefunded) {
          await this.refundAntiSpamDeposit(proposal.id);
        }

        return {
          executed: true,
          txHash: executionResult.txHash,
        };
      } else {
        // Record failed execution
        await this.prisma.governanceEvent.create({
          data: {
            proposalId: proposal.id,
            eventType: 'EXECUTION_FAILED',
            eventData: {
              executor: executorAddress.toLowerCase(),
              error: executionResult.error,
              failedAt: new Date().toISOString(),
            },
          },
        });

        return {
          executed: false,
          error: executionResult.error,
        };
      }
    } catch (error) {
      this.app.log.error({ proposalId, error }, 'Proposal execution failed');
      
      await this.prisma.governanceEvent.create({
        data: {
          proposalId: proposal.id,
          eventType: 'EXECUTION_ERROR',
          eventData: {
            executor: executorAddress.toLowerCase(),
            error: error.message,
            errorAt: new Date().toISOString(),
          },
        },
      });

      return {
        executed: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a queued proposal (emergency or invalid proposal)
   */
  async cancelQueuedProposal(
    proposalId: string, 
    cancellerAddress: Address,
    reason: string
  ): Promise<{
    cancelled: boolean;
    txHash?: string;
  }> {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'QUEUED') {
      throw new Error('Proposal is not queued');
    }

    // Check if canceller has authority (proposer or emergency guardian)
    // For now, allowing proposer or any emergency role holder to cancel
    const isProposer = proposal.proposerAddress.toLowerCase() === cancellerAddress.toLowerCase();
    
    // In a real implementation, you'd check for emergency guardian role
    const canCancel = isProposer; // || await this.hasEmergencyRole(cancellerAddress);

    if (!canCancel) {
      throw new Error('Insufficient permissions to cancel proposal');
    }

    // Update proposal status
    await this.prisma.governanceProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'CANCELED',
        cancelledAt: new Date(),
      },
    });

    // Record cancellation event
    await this.prisma.governanceEvent.create({
      data: {
        proposalId: proposal.id,
        eventType: 'PROPOSAL_CANCELLED',
        eventData: {
          canceller: cancellerAddress.toLowerCase(),
          reason,
          cancelledAt: new Date().toISOString(),
          wasQueued: true,
        },
      },
    });

    // Refund anti-spam deposit if applicable
    if (proposal.depositPaid && !proposal.depositRefunded) {
      await this.refundAntiSpamDeposit(proposal.id);
    }

    return {
      cancelled: true,
      // In real implementation, this would return actual cancellation tx hash
    };
  }

  /**
   * Simulate proposal execution (placeholder for actual blockchain execution)
   */
  private async simulateProposalExecution(
    targets: string[],
    values: string[],
    calldatas: string[],
    chainId: number
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      // This is where you'd integrate with the actual timelock contract
      // For now, we'll simulate success for most proposal types
      
      // Generate a mock transaction hash
      const mockTxHash = '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      // Simulate some execution checks
      if (targets.length === 0) {
        return {
          success: false,
          error: 'No targets specified for execution',
        };
      }

      if (targets.length !== values.length || targets.length !== calldatas.length) {
        return {
          success: false,
          error: 'Mismatched targets, values, and calldatas arrays',
        };
      }

      // Simulate successful execution
      return {
        success: true,
        txHash: mockTxHash,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund anti-spam deposit
   */
  private async refundAntiSpamDeposit(proposalId: number) {
    await this.prisma.governanceProposal.update({
      where: { id: proposalId },
      data: { depositRefunded: true },
    });

    await this.prisma.governanceEvent.create({
      data: {
        proposalId,
        eventType: 'DEPOSIT_REFUNDED',
        eventData: {
          refundedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Get proposals ready for execution
   */
  async getExecutableProposals(): Promise<any[]> {
    const now = new Date();
    
    const executableProposals = await this.prisma.governanceProposal.findMany({
      where: {
        status: 'QUEUED',
        timelockEta: {
          lte: now, // ETA has passed
        },
      },
      include: {
        proposer: {
          select: {
            address: true,
            username: true,
            ensName: true,
          },
        },
      },
      orderBy: {
        timelockEta: 'asc',
      },
    });

    // Filter out expired proposals (24 hour grace period)
    const validProposals = executableProposals.filter(proposal => {
      if (!proposal.timelockEta) return false;
      const graceExpiry = new Date(proposal.timelockEta.getTime() + 24 * 60 * 60 * 1000);
      return now <= graceExpiry;
    });

    return validProposals;
  }

  /**
   * Submit milestone evidence for Lift Forward
   */
  async submitMilestoneEvidence(
    milestoneId: number,
    submitterAddress: Address,
    evidenceData: {
      evidenceFiles: Array<{
        type: string;
        hash: string;
        ipfsCid: string;
        description?: string;
      }>;
      mrvBundle?: {
        hash: string;
        ipfsCid: string;
        methodology: string;
      };
      notes?: string;
    }
  ) {
    const milestone = await this.prisma.liftForwardMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        liftForward: {
          include: {
            proposal: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    if (milestone.status !== 'PENDING') {
      throw new Error('Milestone is not accepting evidence submissions');
    }

    // Check if deadline has passed
    if (milestone.deadline && new Date() > milestone.deadline) {
      throw new Error('Milestone submission deadline has passed');
    }

    // Verify required evidence types are provided
    const requiredTypes = JSON.parse(milestone.evidenceTypes);
    const providedTypes = evidenceData.evidenceFiles.map(f => f.type);
    const missingTypes = requiredTypes.filter(type => !providedTypes.includes(type));

    if (missingTypes.length > 0) {
      throw new Error(`Missing required evidence types: ${missingTypes.join(', ')}`);
    }

    // Upload evidence bundle to IPFS
    const evidenceBundle = {
      milestoneId,
      submittedAt: new Date().toISOString(),
      submitter: submitterAddress.toLowerCase(),
      evidence: evidenceData.evidenceFiles,
      mrvBundle: evidenceData.mrvBundle,
      notes: evidenceData.notes,
    };

    const bundleBuffer = Buffer.from(JSON.stringify(evidenceBundle, null, 2));
    const ipfsResult = await this.ipfsClient.uploadEvidenceFile(
      bundleBuffer,
      `milestone-${milestoneId}-evidence-${Date.now()}.json`,
      {
        type: 'milestone-evidence-bundle',
        milestoneId,
        submitter: submitterAddress.toLowerCase(),
      }
    );

    // Update milestone status
    await this.prisma.liftForwardMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        evidenceSubmitted: evidenceData,
        mrvBundleHash: evidenceData.mrvBundle?.hash,
        mrvBundleIpfs: evidenceData.mrvBundle?.ipfsCid,
        submittedAt: new Date(),
        challengeWindowEnd: new Date(Date.now() + milestone.liftForward.challengeWindow * 24 * 60 * 60 * 1000),
      },
    });

    // Record event
    await this.prisma.liftForwardEvent.create({
      data: {
        liftForwardId: milestone.liftForwardId,
        eventType: 'MILESTONE_EVIDENCE_SUBMITTED',
        eventData: {
          milestoneId,
          milestoneNumber: milestone.milestoneNumber,
          submitter: submitterAddress.toLowerCase(),
          evidenceBundle: ipfsResult.cid,
          challengeWindowEnd: new Date(Date.now() + milestone.liftForward.challengeWindow * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });

    return {
      milestoneId,
      status: 'SUBMITTED',
      evidenceBundleCid: ipfsResult.cid,
      challengeWindowEnd: new Date(Date.now() + milestone.liftForward.challengeWindow * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Challenge a submitted milestone
   */
  async challengeMilestone(
    milestoneId: number,
    challengerAddress: Address,
    challengeData: {
      reason: string;
      evidenceHash?: string;
      evidenceIpfs?: string;
      bondAmount: string;
    }
  ) {
    const milestone = await this.prisma.liftForwardMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        liftForward: true,
      },
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    if (milestone.status !== 'SUBMITTED') {
      throw new Error('Milestone is not in submitted state');
    }

    // Check if challenge window is still open
    if (!milestone.challengeWindowEnd || new Date() > milestone.challengeWindowEnd) {
      throw new Error('Challenge window has closed');
    }

    const user = await this.prisma.user.findUnique({
      where: { address: challengerAddress.toLowerCase() },
    });

    // Create challenge
    const challenge = await this.prisma.milestoneChallenge.create({
      data: {
        milestoneId,
        challengerAddress: challengerAddress.toLowerCase(),
        challengerUserId: user?.id,
        challengeReason: challengeData.reason,
        evidenceHash: challengeData.evidenceHash,
        evidenceIpfs: challengeData.evidenceIpfs,
        bondAmount: challengeData.bondAmount,
        bondPaid: true, // Assume bond is paid in the transaction
        status: 'PENDING',
      },
    });

    // Update milestone status
    await this.prisma.liftForwardMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'CHALLENGED',
        challengedAt: new Date(),
      },
    });

    // Record event
    await this.prisma.liftForwardEvent.create({
      data: {
        liftForwardId: milestone.liftForwardId,
        eventType: 'MILESTONE_CHALLENGED',
        eventData: {
          milestoneId,
          milestoneNumber: milestone.milestoneNumber,
          challenger: challengerAddress.toLowerCase(),
          challengeId: challenge.id,
          reason: challengeData.reason,
          bondAmount: challengeData.bondAmount,
        },
      },
    });

    return {
      challengeId: challenge.id,
      milestoneId,
      status: 'CHALLENGED',
      challengeReason: challengeData.reason,
      bondAmount: challengeData.bondAmount,
    };
  }

  /**
   * Accept milestone after challenge window or resolve challenge
   */
  async acceptMilestone(
    milestoneId: number,
    verifierAddress: Address,
    notes?: string
  ) {
    const milestone = await this.prisma.liftForwardMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        liftForward: true,
        challenges: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    // Check if milestone can be accepted
    const canAccept = milestone.status === 'SUBMITTED' || 
                     (milestone.status === 'CHALLENGED' && milestone.challenges.length === 0);

    if (!canAccept) {
      throw new Error('Milestone cannot be accepted in current state');
    }

    // If submitted, check challenge window has passed
    if (milestone.status === 'SUBMITTED') {
      if (!milestone.challengeWindowEnd || new Date() <= milestone.challengeWindowEnd) {
        throw new Error('Challenge window is still open');
      }
    }

    // Update milestone status
    await this.prisma.liftForwardMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        verifierAddress: verifierAddress.toLowerCase(),
        verifierNotes: notes,
      },
    });

    // Check if all milestones are completed
    const allMilestones = await this.prisma.liftForwardMilestone.findMany({
      where: { liftForwardId: milestone.liftForwardId },
    });

    const allAccepted = allMilestones.every(m => m.status === 'ACCEPTED');
    
    if (allAccepted) {
      await this.prisma.liftForward.update({
        where: { id: milestone.liftForwardId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // Record event
    await this.prisma.liftForwardEvent.create({
      data: {
        liftForwardId: milestone.liftForwardId,
        eventType: 'MILESTONE_ACCEPTED',
        eventData: {
          milestoneId,
          milestoneNumber: milestone.milestoneNumber,
          verifier: verifierAddress.toLowerCase(),
          notes,
          allMilestonesCompleted: allAccepted,
        },
      },
    });

    return {
      milestoneId,
      status: 'ACCEPTED',
      allMilestonesCompleted: allAccepted,
      verifier: verifierAddress.toLowerCase(),
    };
  }

  /**
   * Get Lift Forward details with milestones
   */
  async getLiftForward(liftForwardId: number) {
    const liftForward = await this.prisma.liftForward.findUnique({
      where: { id: liftForwardId },
      include: {
        proposal: {
          select: {
            proposalId: true,
            title: true,
            status: true,
          },
        },
        funder: {
          select: {
            address: true,
            username: true,
            ensName: true,
          },
        },
        milestones: {
          include: {
            challenges: {
              include: {
                challenger: {
                  select: {
                    address: true,
                    username: true,
                    ensName: true,
                  },
                },
              },
            },
          },
          orderBy: { milestoneNumber: 'asc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return liftForward;
  }

  /**
   * Get milestones requiring action
   */
  async getMilestonesRequiringAction(): Promise<{
    pendingSubmission: any[];
    pendingReview: any[];
    challengeable: any[];
  }> {
    const now = new Date();
    
    const pendingSubmission = await this.prisma.liftForwardMilestone.findMany({
      where: {
        status: 'PENDING',
        deadline: {
          gte: now,
        },
      },
      include: {
        liftForward: {
          include: {
            proposal: {
              select: { title: true, proposalId: true },
            },
          },
        },
      },
    });

    const pendingReview = await this.prisma.liftForwardMilestone.findMany({
      where: {
        status: 'SUBMITTED',
        challengeWindowEnd: {
          lte: now,
        },
      },
      include: {
        liftForward: {
          include: {
            proposal: {
              select: { title: true, proposalId: true },
            },
          },
        },
      },
    });

    const challengeable = await this.prisma.liftForwardMilestone.findMany({
      where: {
        status: 'SUBMITTED',
        challengeWindowEnd: {
          gt: now,
        },
      },
      include: {
        liftForward: {
          include: {
            proposal: {
              select: { title: true, proposalId: true },
            },
          },
        },
      },
    });

    return {
      pendingSubmission,
      pendingReview,
      challengeable,
    };
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