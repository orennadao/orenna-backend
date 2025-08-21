'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/api'

// Contract ABIs (simplified for key functions)
const GOVERNANCE_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function getVotes(address account) view returns (uint256)',
  'function delegates(address account) view returns (address)',
  'function delegate(address delegatee)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
] as const

const GOVERNOR_ABI = [
  'function name() view returns (string)',
  'function votingDelay() view returns (uint256)',
  'function votingPeriod() view returns (uint256)',
  'function proposalThreshold() view returns (uint256)',
  'function quorum(uint256 blockNumber) view returns (uint256)',
  'function state(uint256 proposalId) view returns (uint8)',
  'function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)',
  'function hasVoted(uint256 proposalId, address account) view returns (bool)',
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
  'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)',
] as const

// Contract addresses (should come from environment or config)
const CONTRACT_ADDRESSES = {
  1: { // Mainnet
    governanceToken: process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS_MAINNET as `0x${string}`,
    governor: process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS_MAINNET as `0x${string}`,
    timelock: process.env.NEXT_PUBLIC_TIMELOCK_ADDRESS_MAINNET as `0x${string}`,
  },
  11155111: { // Sepolia
    governanceToken: process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS_SEPOLIA as `0x${string}`,
    governor: process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS_SEPOLIA as `0x${string}`,
    timelock: process.env.NEXT_PUBLIC_TIMELOCK_ADDRESS_SEPOLIA as `0x${string}`,
  },
  137: { // Polygon
    governanceToken: process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS_POLYGON as `0x${string}`,
    governor: process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS_POLYGON as `0x${string}`,
    timelock: process.env.NEXT_PUBLIC_TIMELOCK_ADDRESS_POLYGON as `0x${string}`,
  },
} as const

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

export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export interface GovernanceToken {
  address: string
  name: string
  symbol: string
  decimals: number
  balance: string
  votingPower: string
  delegate: string
  lastSyncAt?: string
}

export interface GovernanceProposal {
  id: string
  proposalId: string
  title: string
  description: string
  proposalType: string
  state: ProposalState
  stateName: string
  forVotes: string
  againstVotes: string
  abstainVotes: string
  startBlock?: string
  endBlock?: string
  executionETA?: string
  proposer: string
  createdAt: string
  onChain?: {
    state: number
    stateName: string
    votes: {
      against: string
      for: string
      abstain: string
    }
    deadline: string
    snapshot: string
  }
}

export interface GovernanceVote {
  proposalId: string
  support: VoteSupport
  votingPower: string
  reason?: string
  txHash?: string
  blockNumber?: number
  votedAt: string
}

interface GovernanceContextValue {
  // Token information
  token: GovernanceToken | null
  tokenLoading: boolean
  tokenError: Error | null
  
  // Proposals
  proposals: GovernanceProposal[]
  proposalsLoading: boolean
  proposalsError: Error | null
  
  // Current user voting info
  votingPower: string
  hasVotingPower: boolean
  delegate: string | null
  
  // Contract interaction functions
  delegateVotes: (delegatee: string) => Promise<void>
  createProposal: (proposal: CreateProposalParams) => Promise<void>
  castVote: (proposalId: string, support: VoteSupport, reason?: string) => Promise<void>
  
  // Data fetching functions
  refreshToken: () => Promise<void>
  refreshProposals: () => Promise<void>
  getProposal: (proposalId: string) => Promise<GovernanceProposal | null>
  
  // Loading states
  isDelegating: boolean
  isCreatingProposal: boolean
  isVoting: boolean
  
  // Configuration
  chainId: number
  contracts: {
    governanceToken: string
    governor: string
    timelock: string
  } | null
}

interface CreateProposalParams {
  title: string
  description: string
  proposalType: string
  targets: string[]
  values: string[]
  calldatas: string[]
  ecosystemData?: any
  methodRegistryData?: any
  financeData?: any
  liftTokenData?: any
}

const GovernanceContext = createContext<GovernanceContextValue | undefined>(undefined)

interface GovernanceProviderProps {
  children: ReactNode
  chainId?: number
}

export function GovernanceProvider({ children, chainId = 1 }: GovernanceProviderProps) {
  // Add client-side check for SSG safety
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // SSG fallback - return minimal provider during server-side rendering
  if (!isClient) {
    const fallbackValue: GovernanceContextValue = {
      token: null,
      tokenLoading: false,
      tokenError: null,
      proposals: [],
      proposalsLoading: false,
      proposalsError: null,
      votingPower: '0',
      hasVotingPower: false,
      delegate: null,
      delegateVotes: async () => {},
      createProposal: async () => {},
      castVote: async () => {},
      refreshToken: async () => {},
      refreshProposals: async () => {},
      getProposal: async () => null,
      isDelegating: false,
      isCreatingProposal: false,
      isVoting: false,
      chainId: 1,
      contracts: null
    }
    
    return (
      <GovernanceContext.Provider value={fallbackValue}>
        {children}
      </GovernanceContext.Provider>
    )
  }

  // Client-side implementation
  return <GovernanceProviderClient chainId={chainId}>{children}</GovernanceProviderClient>
}

function GovernanceProviderClient({ children, chainId = 1 }: GovernanceProviderProps) {
  const { address, isConnected } = useAccount()
  const { user } = useAuth()
  
  // State
  const [token, setToken] = useState<GovernanceToken | null>(null)
  const [proposals, setProposals] = useState<GovernanceProposal[]>([])
  const [tokenLoading, setTokenLoading] = useState(false)
  const [proposalsLoading, setProposalsLoading] = useState(false)
  const [tokenError, setTokenError] = useState<Error | null>(null)
  const [proposalsError, setProposalsError] = useState<Error | null>(null)
  const [isDelegating, setIsDelegating] = useState(false)
  const [isCreatingProposal, setIsCreatingProposal] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  // Get contract addresses for current chain
  const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || null

  // Contract reads
  const { data: tokenBalance } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.governanceToken,
    },
  })

  const { data: votingPower } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.governanceToken,
    },
  })

  const { data: delegate } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'delegates',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.governanceToken,
    },
  })

  const { data: tokenName } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'name',
    query: {
      enabled: !!contracts?.governanceToken,
    },
  })

  const { data: tokenSymbol } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!contracts?.governanceToken,
    },
  })

  const { data: tokenDecimals } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!contracts?.governanceToken,
    },
  })

  // Contract writes
  const { writeContractAsync: delegateWrite } = useWriteContract()

  const { writeContractAsync: createProposalWrite } = useWriteContract()

  const { writeContractAsync: castVoteWrite } = useWriteContract()

  // Fetch token information from API
  const refreshToken = async () => {
    if (!user || !address) return

    setTokenLoading(true)
    setTokenError(null)

    try {
      const response = await api.governance.getToken({ chainId })
      setToken(response.data)
    } catch (error) {
      setTokenError(error instanceof Error ? error : new Error('Failed to fetch token'))
    } finally {
      setTokenLoading(false)
    }
  }

  // Fetch proposals from API
  const refreshProposals = async () => {
    if (!user) return

    setProposalsLoading(true)
    setProposalsError(null)

    try {
      const response = await api.governance.getProposals({ chainId, limit: 50 })
      setProposals(response.data.proposals)
    } catch (error) {
      setProposalsError(error instanceof Error ? error : new Error('Failed to fetch proposals'))
    } finally {
      setProposalsLoading(false)
    }
  }

  // Get specific proposal
  const getProposal = async (proposalId: string): Promise<GovernanceProposal | null> => {
    if (!user) return null

    try {
      const response = await api.governance.getProposal(proposalId)
      return response.data
    } catch (error) {
      console.error('Failed to fetch proposal:', error)
      return null
    }
  }

  // Delegate voting power
  const delegateVotes = async (delegatee: string) => {
    if (!delegateWrite || !address) return

    setIsDelegating(true)
    try {
      const tx = await delegateWrite({
        address: contracts?.governanceToken!,
        abi: GOVERNANCE_TOKEN_ABI,
        functionName: 'delegate',
        args: [delegatee as `0x${string}`],
      })

      // Record delegation in backend
      await api.governance.recordDelegation({
        delegatee,
        chainId,
      })

      // Refresh token data
      await refreshToken()
    } catch (error) {
      console.error('Failed to delegate votes:', error)
      throw error
    } finally {
      setIsDelegating(false)
    }
  }

  // Create proposal
  const createProposal = async (proposal: CreateProposalParams) => {
    if (!createProposalWrite || !address) return

    setIsCreatingProposal(true)
    try {
      // First create proposal in backend to get proposal data
      const response = await api.governance.createProposal(proposal)
      const { onChainData } = response.data

      // Submit to blockchain
      const tx = await createProposalWrite({
        address: contracts?.governor!,
        abi: GOVERNOR_ABI,
        functionName: 'propose',
        args: [
          onChainData.targets,
          onChainData.values,
          onChainData.calldatas,
          onChainData.description,
        ],
      })

      // Refresh proposals
      await refreshProposals()
    } catch (error) {
      console.error('Failed to create proposal:', error)
      throw error
    } finally {
      setIsCreatingProposal(false)
    }
  }

  // Cast vote
  const castVote = async (proposalId: string, support: VoteSupport, reason?: string) => {
    if (!castVoteWrite || !address) return

    setIsVoting(true)
    try {
      const tx = await castVoteWrite({
        address: contracts?.governor!,
        abi: GOVERNOR_ABI,
        functionName: 'castVoteWithReason',
        args: [BigInt(proposalId), support, reason || ''],
      })

      // Record vote in backend
      await api.governance.recordVote(proposalId, {
        support,
        reason,
      })

      // Refresh proposals to update vote counts
      await refreshProposals()
    } catch (error) {
      console.error('Failed to cast vote:', error)
      throw error
    } finally {
      setIsVoting(false)
    }
  }

  // Update token state from contract reads
  useEffect(() => {
    if (contracts?.governanceToken && tokenName && tokenSymbol && tokenDecimals !== undefined) {
      setToken(prev => ({
        ...prev,
        address: contracts.governanceToken,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        balance: tokenBalance?.toString() || '0',
        votingPower: votingPower?.toString() || '0',
        delegate: delegate?.toString() || '',
      }))
    }
  }, [contracts, tokenName, tokenSymbol, tokenDecimals, tokenBalance, votingPower, delegate])

  // Initial data fetch
  useEffect(() => {
    if (user && isConnected) {
      refreshToken()
      refreshProposals()
    }
  }, [user, isConnected, chainId])

  const contextValue: GovernanceContextValue = {
    // Token information
    token,
    tokenLoading,
    tokenError,
    
    // Proposals
    proposals,
    proposalsLoading,
    proposalsError,
    
    // Current user voting info
    votingPower: votingPower?.toString() || '0',
    hasVotingPower: (votingPower && votingPower > 0n) || false,
    delegate: delegate?.toString() || null,
    
    // Contract interaction functions
    delegateVotes,
    createProposal,
    castVote,
    
    // Data fetching functions
    refreshToken,
    refreshProposals,
    getProposal,
    
    // Loading states
    isDelegating,
    isCreatingProposal,
    isVoting,
    
    // Configuration
    chainId,
    contracts,
  }

  return (
    <GovernanceContext.Provider value={contextValue}>
      {children}
    </GovernanceContext.Provider>
  )
}

export function useGovernance() {
  const context = useContext(GovernanceContext)
  if (context === undefined) {
    // Return a fallback during SSG/SSR to prevent errors
    if (typeof window === 'undefined') {
      return {
        token: null,
        tokenLoading: false,
        tokenError: null,
        proposals: [],
        proposalsLoading: false,
        proposalsError: null,
        votingPower: '0',
        hasVotingPower: false,
        delegate: null,
        delegateVotes: async () => {},
        createProposal: async () => {},
        castVote: async () => {},
        refreshToken: async () => {},
        refreshProposals: async () => {},
        getProposal: async () => null,
        isDelegating: false,
        isCreatingProposal: false,
        isVoting: false,
        chainId: 1,
        contracts: null
      };
    }
    throw new Error('useGovernance must be used within a GovernanceProvider')
  }
  return context
}