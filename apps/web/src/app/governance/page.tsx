'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ProposalCard } from '@/components/governance/proposal-card'
import { DelegationPanel } from '@/components/governance/delegation-panel'
import { useGovernance, useGovernanceUtils } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/use-auth'
import type { GovernanceProposal } from '@/types/api'
import { 
  Vote, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  Wallet,
  AlertCircle,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Settings,
  FileText,
  Shield,
  AlertTriangle,
  DollarSign,
  Calendar,
  ExternalLink
} from 'lucide-react'

const PROPOSAL_STATUSES = [
  { value: '', label: 'All Proposals', icon: Filter },
  { value: 'PENDING', label: 'Pending', icon: Clock },
  { value: 'ACTIVE', label: 'Active', icon: Vote },
  { value: 'SUCCEEDED', label: 'Succeeded', icon: CheckCircle2 },
  { value: 'DEFEATED', label: 'Defeated', icon: XCircle },
  { value: 'QUEUED', label: 'Queued', icon: Hourglass },
  { value: 'EXECUTED', label: 'Executed', icon: CheckCircle2 },
]

const PROPOSAL_TYPES = [
  { value: '', label: 'All Types', icon: Filter },
  { value: 'STANDARD', label: 'Standard', icon: FileText },
  { value: 'ECOSYSTEM_PARAMETER', label: 'Ecosystem', icon: Settings },
  { value: 'METHOD_REGISTRY', label: 'Method Registry', icon: Shield },
  { value: 'PROTOCOL_UPGRADE', label: 'Protocol Upgrade', icon: AlertTriangle },
  { value: 'TREASURY_ALLOCATION', label: 'Treasury', icon: DollarSign },
  { value: 'LIFT_TOKEN_GOVERNANCE', label: 'Lift Forward', icon: TrendingUp },
  { value: 'FINANCE_PLATFORM', label: 'Finance', icon: BarChart3 },
  { value: 'FEE_ADJUSTMENT', label: 'Fee Adjustment', icon: Settings },
  { value: 'EMERGENCY', label: 'Emergency', icon: AlertTriangle },
]

export default function GovernancePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showDelegation, setShowDelegation] = useState(false)

  const { address, isConnected } = useAccount()
  const { user } = useAuth()
  const {
    // Token information
    balance,
    votingPower,
    delegate,
    hasVotingPower,
    tokenInfo,
    contracts,
    
    // Proposals
    proposals,
    proposalsLoading,
    proposalsError,
    
    // Configuration
    chainId,
    isReady,
  } = useGovernance()

  const { formatTokenAmount } = useGovernanceUtils()

  // Helper function to get state number from status
  const getStateNumber = (proposal: GovernanceProposal): number => {
    if (proposal.onChain?.state !== undefined) return proposal.onChain.state
    switch (proposal.status) {
      case 'PENDING': return 0
      case 'ACTIVE': return 1
      case 'CANCELLED': return 2
      case 'DEFEATED': return 3
      case 'SUCCEEDED': return 4
      case 'QUEUED': return 5
      case 'EXPIRED': return 6
      case 'EXECUTED': return 7
      default: return 0
    }
  }

  // Filter proposals
  const filteredProposals = proposals.filter((proposal: GovernanceProposal) => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || getStateNumber(proposal).toString() === statusFilter
    const matchesType = !typeFilter || proposal.proposalType === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate stats
  const activeProposals = proposals.filter((p: GovernanceProposal) => getStateNumber(p) === 1).length
  const totalProposals = proposals.length
  const myVotingPower = formatTokenAmount(votingPower)

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardContent className="pt-6">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to participate in governance
              </p>
              <Link href="/auth?redirect=/governance">
                <Button>Connect Wallet</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardContent className="pt-6">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please authenticate to access governance features
              </p>
              <Link href="/auth?redirect=/governance">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">OrennaDAO Governance</h1>
        <p className="text-muted-foreground">
          Participate in decentralized decision-making for ecosystem measurement standards and platform parameters
        </p>
      </div>

      {/* DAO Ops Status Banner */}
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">DAO Ops Implementation Status</h3>
                <p className="text-sm text-green-800">Backend governance system is production-ready. Frontend features are being implemented.</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">v1.0 Ready</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Voting Power</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myVotingPower}</div>
            <p className="text-xs text-muted-foreground">ORNA tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProposals}</div>
            <p className="text-xs text-muted-foreground">7-day voting window</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProposals}</div>
            <p className="text-xs text-muted-foreground">All proposal types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delegation Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {delegate ? (delegate.toLowerCase() === address?.toLowerCase() ? 'Self' : 'Delegated') : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {delegate ? 'Can participate' : 'Setup required'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DAO Ops Playbooks */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            DAO Operations Playbooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" size="sm" className="h-auto p-4">
              <Link href="/governance/playbooks/author" className="flex flex-col items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-xs font-medium">Author Proposal (A)</span>
                <span className="text-xs text-muted-foreground">A.1-A.9 Template</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-auto p-4">
              <Link href="/governance/playbooks/sponsorship" className="flex flex-col items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-xs font-medium">Sponsorship (B)</span>
                <span className="text-xs text-muted-foreground">Anti-spam & Approval</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-auto p-4">
              <Link href="/governance/playbooks/voting" className="flex flex-col items-center gap-2">
                <Vote className="h-5 w-5" />
                <span className="text-xs font-medium">Voting Ops (C)</span>
                <span className="text-xs text-muted-foreground">7-day Window</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-auto p-4">
              <Link href="/governance/playbooks/execution" className="flex flex-col items-center gap-2">
                <Settings className="h-5 w-5" />
                <span className="text-xs font-medium">Execution (D)</span>
                <span className="text-xs text-muted-foreground">Timelock & Implementation</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Button asChild size="lg" className="h-auto p-6">
          <Link href="/governance/proposals/create-dao-ops" className="flex flex-col items-center gap-2">
            <Plus className="h-6 w-6" />
            <span className="font-medium">Create Proposal</span>
            <span className="text-xs opacity-75">Use DAO Ops template</span>
          </Link>
        </Button>

        <Button 
          variant="outline" 
          size="lg" 
          className="h-auto p-6"
          onClick={() => setShowDelegation(!showDelegation)}
        >
          <div className="flex flex-col items-center gap-2">
            <Users className="h-6 w-6" />
            <span className="font-medium">Manage Delegation</span>
            <span className="text-xs opacity-75">Required for voting</span>
          </div>
        </Button>

        <Button asChild variant="outline" size="lg" className="h-auto p-6">
          <Link href="/governance/lift-forward" className="flex flex-col items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <span className="font-medium">Lift Forward</span>
            <span className="text-xs opacity-75">Escrow & milestones</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="h-auto p-6">
          <Link href="/governance/analytics" className="flex flex-col items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span className="font-medium">Analytics</span>
            <span className="text-xs opacity-75">Metrics & reporting</span>
          </Link>
        </Button>
      </div>

      {/* Delegation Panel */}
      {showDelegation && address && (
        <div className="mb-8">
          <DelegationPanel
            currentDelegate={delegate}
            userAddress={address}
            tokenBalance={balance}
            votingPower={votingPower}
            chainId={chainId}
          />
        </div>
      )}

      {/* Voting Power Warning */}
      {!hasVotingPower && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900 mb-1">No Voting Power</h3>
                <p className="text-sm text-orange-800 mb-3">
                  You need to delegate your tokens to participate in governance. 
                  You can delegate to yourself to vote directly, or to another address.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => setShowDelegation(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Set Up Delegation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposals Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-2xl font-semibold">Proposals</h2>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {PROPOSAL_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {PROPOSAL_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Proposals List */}
        {proposalsLoading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : proposalsError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load proposals: {proposalsError.message}</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredProposals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Proposals Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter || typeFilter 
                  ? "Try adjusting your search filters"
                  : "No governance proposals have been created yet"
                }
              </p>
              {(!searchQuery && !statusFilter && !typeFilter) && (
                <Button asChild>
                  <Link href="/governance/proposals/create">Create First Proposal</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredProposals.map((proposal) => (
              <ProposalCard 
                key={proposal.id} 
                proposal={proposal}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}