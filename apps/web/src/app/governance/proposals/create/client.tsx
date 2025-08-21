'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProposalCreation } from '@/components/governance/proposal-creation'
import { useGovernance, useGovernanceUtils } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Wallet, AlertCircle } from 'lucide-react'

export default function CreateProposalClient() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // SSG protection - show loading state during server-side rendering
  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="h-10 w-32 bg-muted rounded mb-4 animate-pulse" />
            <div className="h-9 w-80 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return <CreateProposalContent />
}

function CreateProposalContent() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { user } = useAuth()
  const { votingPower, isReady, chainId } = useGovernance()
  const { formatTokenAmount } = useGovernanceUtils()

  // Mock proposal threshold - in real implementation, this would come from the governor contract
  const proposalThreshold = '100000000000000000000' // 100 ORNA

  const handleSuccess = () => {
    router.push('/governance')
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to create governance proposals
              </p>
              <Button asChild>
                <Link href="/auth?redirect=/governance/proposals/create">Connect Wallet</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please authenticate to create governance proposals
              </p>
              <Button asChild>
                <Link href="/auth?redirect=/governance/proposals/create">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const hasVotingPower = BigInt(votingPower || '0') >= BigInt(proposalThreshold)

  if (!hasVotingPower) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2">Insufficient Voting Power</h2>
              <p className="text-muted-foreground mb-4">
                You need at least {formatTokenAmount(proposalThreshold)} ORNA tokens to create proposals.
                Your current voting power: {formatTokenAmount(votingPower)} ORNA.
              </p>
              <div className="space-y-2">
                <Button asChild variant="outline">
                  <Link href="/governance">Return to Governance</Link>
                </Button>
                <Button asChild>
                  <Link href="/marketplace">Get ORNA Tokens</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/governance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Governance
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create Governance Proposal</h1>
          <p className="text-muted-foreground mt-2">
            Submit a new proposal for community voting
          </p>
        </div>

        {/* Proposal Creation Form */}
        <ProposalCreation
          onSuccess={handleSuccess}
          userVotingPower={votingPower}
          proposalThreshold={proposalThreshold}
          chainId={chainId}
        />
      </div>
    </div>
  )
}