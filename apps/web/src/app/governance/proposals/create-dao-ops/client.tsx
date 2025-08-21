'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DAOOpsProposalForm } from '@/components/governance/dao-ops-proposal-form'
import { useGovernance, useGovernanceUtils } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Wallet, AlertCircle, FileText, Info } from 'lucide-react'

export default function CreateDAOOpsProposalClient() {
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
                <Link href="/auth?redirect=/governance/proposals/create-dao-ops">Connect Wallet</Link>
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
                <Link href="/auth?redirect=/governance/proposals/create-dao-ops">Sign In</Link>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/governance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Governance
            </Link>
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Create DAO Ops Proposal</h1>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              DAO Ops v1.0
            </Badge>
          </div>
          
          <p className="text-muted-foreground">
            Use the structured DAO Operations framework for governance proposals
          </p>
        </div>

        {/* Information Banner */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">About DAO Operations Framework</h3>
                <p className="text-sm text-blue-800 mb-4">
                  The DAO Ops framework provides a structured approach to governance with standardized 
                  proposal types, clear execution paths, and built-in risk management. Each proposal 
                  follows the A-D lifecycle: Author → Sponsor → Vote → Execute.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white/50 p-3 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-900">A. Author</div>
                    <div className="text-blue-800">Draft & Template</div>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-900">B. Sponsor</div>
                    <div className="text-blue-800">Review & Approve</div>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-900">C. Vote</div>
                    <div className="text-blue-800">7-day Window</div>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-900">D. Execute</div>
                    <div className="text-blue-800">Timelock & Deploy</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DAO Ops Proposal Form */}
        <DAOOpsProposalForm
          onSuccess={handleSuccess}
          userVotingPower={votingPower}
          proposalThreshold={proposalThreshold}
          chainId={chainId}
        />
      </div>
    </div>
  )
}