'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useAuth } from './use-auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// Contract ABIs (same as in governance provider but available as hook)
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

// Contract addresses (should come from environment)
const getContractAddresses = (chainId: number) => {
  const addresses = {
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

  return addresses[chainId as keyof typeof addresses] || null
}

export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export interface GovernanceConfig {
  chainId: number
  contracts: {
    governanceToken: string
    governor: string
    timelock: string
  } | null
}

// Hook for governance token information
export function useGovernanceToken(chainId: number = 1) {
  const { address } = useAccount()
  const { user } = useAuth()
  const contracts = getContractAddresses(chainId)

  // Contract reads
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.governanceToken,
    },
  })

  const { data: votingPower, refetch: refetchVotingPower } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.governanceToken,
    },
  })

  const { data: delegate, refetch: refetchDelegate } = useReadContract({
    address: contracts?.governanceToken,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: 'delegates',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.governanceToken,
    },
  })

  const { data: tokenInfo } = useQuery({
    queryKey: ['governance', 'token', chainId, address],
    queryFn: () => api.governance.getToken({ chainId }),
    enabled: !!user && !!address,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const refresh = useCallback(async () => {
    await Promise.all([
      refetchBalance(),
      refetchVotingPower(),
      refetchDelegate(),
    ])
  }, [refetchBalance, refetchVotingPower, refetchDelegate])

  return {
    balance: balance?.toString() || '0',
    votingPower: votingPower?.toString() || '0',
    delegate: delegate?.toString() || '',
    hasVotingPower: votingPower ? votingPower > 0n : false,
    tokenInfo: tokenInfo?.data || null,
    contracts,
    refresh,
  }
}

// Hook for proposal operations
export function useGovernanceProposals(chainId: number = 1) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch proposals
  const {
    data: proposalsData,
    isLoading: proposalsLoading,
    error: proposalsError,
    refetch: refetchProposals,
  } = useQuery({
    queryKey: ['governance', 'proposals', chainId],
    queryFn: () => api.governance.getProposals({ chainId, limit: 50 }),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  })

  // Get specific proposal
  const getProposal = useCallback(async (proposalId: string) => {
    try {
      const response = await api.governance.getProposal(proposalId)
      return response.data
    } catch (error) {
      console.error('Failed to fetch proposal:', error)
      throw error
    }
  }, [])

  // Create proposal mutation
  const createProposal = useMutation({
    mutationFn: async (proposal: {
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
    }) => {
      return api.governance.createProposal({
        ...proposal,
        chainId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance', 'proposals'] })
      toast.success('Proposal prepared successfully')
    },
    onError: (error) => {
      console.error('Failed to create proposal:', error)
      toast.error('Failed to create proposal')
    },
  })

  return {
    proposals: proposalsData?.data?.proposals || [],
    total: proposalsData?.data?.total || 0,
    proposalsLoading,
    proposalsError,
    getProposal,
    createProposal: createProposal.mutate,
    isCreatingProposal: createProposal.isPending,
    refetchProposals,
  }
}

// Hook for voting operations
export function useGovernanceVoting(chainId: number = 1) {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const contracts = getContractAddresses(chainId)

  // Contract write for voting
  const { writeContractAsync: castVoteWrite } = useWriteContract()

  // Check if user has voted on a proposal
  const hasVoted = useCallback(async (proposalId: string) => {
    if (!contracts?.governor || !address) return false

    try {
      // Use readContract directly instead of useContractRead inside callback
      const { readContract } = await import('viem/actions')
      const client = await import('viem').then(m => m.createPublicClient({
        chain: import('viem/chains').then(c => c.mainnet),
        transport: import('viem').then(m => m.http())
      }))
      
      const data = await readContract(await client, {
        address: contracts.governor,
        abi: GOVERNOR_ABI,
        functionName: 'hasVoted',
        args: [BigInt(proposalId), address],
      })
      return data || false
    } catch (error) {
      console.error('Failed to check vote status:', error)
      return false
    }
  }, [contracts, address])

  // Vote on proposal
  const castVote = useMutation({
    mutationFn: async ({
      proposalId,
      support,
      reason,
    }: {
      proposalId: string
      support: VoteSupport
      reason?: string
    }) => {
      if (!castVoteWrite) throw new Error('Contract write not available')

      // Submit to blockchain
      const tx = await castVoteWrite({
        address: contracts?.governor!,
        abi: GOVERNOR_ABI,
        functionName: 'castVoteWithReason',
        args: [BigInt(proposalId), support, reason || ''],
      })

      // Record in backend
      await api.governance.recordVote(proposalId, {
        support,
        reason,
      })

      return tx
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance', 'proposals'] })
      toast.success('Vote cast successfully')
    },
    onError: (error) => {
      console.error('Failed to cast vote:', error)
      toast.error('Failed to cast vote')
    },
  })

  return {
    castVote: castVote.mutate,
    isVoting: castVote.isPending,
    hasVoted,
  }
}

// Hook for delegation operations
export function useGovernanceDelegation(chainId: number = 1) {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const contracts = getContractAddresses(chainId)

  // Contract write for delegation
  const { writeContractAsync: delegateWrite } = useWriteContract()

  // Delegate votes
  const delegateVotes = useMutation({
    mutationFn: async (delegatee: string) => {
      if (!delegateWrite) throw new Error('Contract write not available')

      // Submit to blockchain
      const tx = await delegateWrite({
        address: contracts?.governanceToken!,
        abi: GOVERNANCE_TOKEN_ABI,
        functionName: 'delegate',
        args: [delegatee as `0x${string}`],
      })

      // Record in backend
      await api.governance.recordDelegation({
        delegatee,
        chainId,
      })

      return tx
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance', 'token'] })
      toast.success('Delegation updated successfully')
    },
    onError: (error) => {
      console.error('Failed to delegate:', error)
      toast.error('Failed to update delegation')
    },
  })

  // Self-delegate (delegate to own address)
  const selfDelegate = useCallback(() => {
    if (address) {
      delegateVotes.mutate(address)
    }
  }, [address, delegateVotes])

  return {
    delegateVotes: delegateVotes.mutate,
    selfDelegate,
    isDelegating: delegateVotes.isPending,
  }
}

// Hook for governance parameters
export function useGovernanceParameters(category?: string) {
  const { user } = useAuth()

  const {
    data: parametersData,
    isLoading: parametersLoading,
    error: parametersError,
  } = useQuery({
    queryKey: ['governance', 'parameters', category],
    queryFn: () => api.governance.getParameters({ category }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    parameters: parametersData?.data || [],
    parametersLoading,
    parametersError,
  }
}

// Hook for governance metrics
export function useGovernanceMetrics(
  periodStart: Date,
  periodEnd: Date,
  chainId: number = 1
) {
  const { user } = useAuth()

  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: [
      'governance',
      'metrics',
      chainId,
      periodStart.toISOString(),
      periodEnd.toISOString(),
    ],
    queryFn: () =>
      api.governance.getMetrics({
        chainId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      }),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    metrics: metricsData?.data || null,
    metricsLoading,
    metricsError,
  }
}

// Main governance hook that combines everything
export function useGovernance(chainId: number = 1) {
  const tokenHook = useGovernanceToken(chainId)
  const proposalsHook = useGovernanceProposals(chainId)
  const votingHook = useGovernanceVoting(chainId)
  const delegationHook = useGovernanceDelegation(chainId)

  return {
    // Token information
    ...tokenHook,
    
    // Proposals
    ...proposalsHook,
    
    // Voting
    ...votingHook,
    
    // Delegation
    ...delegationHook,
    
    // Configuration
    chainId,
    isReady: !!tokenHook.contracts,
  }
}

// Utility hook for formatting governance values
export function useGovernanceUtils() {
  const formatTokenAmount = useCallback((amount: string | bigint, decimals: number = 18) => {
    try {
      const value = typeof amount === 'string' ? BigInt(amount) : amount
      return formatEther(value)
    } catch {
      return '0'
    }
  }, [])

  const parseTokenAmount = useCallback((amount: string) => {
    try {
      return parseEther(amount).toString()
    } catch {
      return '0'
    }
  }, [])

  const formatVotingPower = useCallback((votingPower: string) => {
    const formatted = formatTokenAmount(votingPower)
    return `${parseFloat(formatted).toLocaleString()} ORNA`
  }, [formatTokenAmount])

  const getProposalStateLabel = useCallback((state: number) => {
    const states = [
      'Pending',
      'Active',
      'Canceled',
      'Defeated',
      'Succeeded',
      'Queued',
      'Expired',
      'Executed',
    ]
    return states[state] || 'Unknown'
  }, [])

  const getVoteSupportLabel = useCallback((support: VoteSupport) => {
    switch (support) {
      case VoteSupport.Against:
        return 'Against'
      case VoteSupport.For:
        return 'For'
      case VoteSupport.Abstain:
        return 'Abstain'
      default:
        return 'Unknown'
    }
  }, [])

  return {
    formatTokenAmount,
    parseTokenAmount,
    formatVotingPower,
    getProposalStateLabel,
    getVoteSupportLabel,
  }
}