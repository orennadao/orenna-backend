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

export default function CreateDAOOpsProposalPage() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/governance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Governance
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold">Create DAO Ops Proposal</h1>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Template A.1-A.9
          </Badge>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Use the comprehensive DAO Operations template to create a well-structured governance proposal.
          This template ensures all necessary information is captured for effective community review.
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>
            Proposals require {formatTokenAmount(proposalThreshold)} ORNA voting power to create
          </span>
        </div>
      </div>

      {/* DAO Ops Guidelines */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">DAO Operations Playbook A</h3>
              <p className="text-sm text-blue-800 mb-3">
                This template implements the official DAO Ops Playbook for authoring proposals (A.1-A.9).
                It ensures comprehensive documentation of rationale, implementation plans, and governance requirements.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
                <div>
                  <h4 className="font-medium mb-1">Standard Proposals:</h4>
                  <ul className="space-y-0.5">
                    <li>• 8% quorum, >50% approval</li>
                    <li>• 48h timelock</li>
                    <li>• Routine governance matters</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Major Proposals:</h4>
                  <ul className="space-y-0.5">
                    <li>• 15% quorum, ≥66.7% approval</li>
                    <li>• 72h timelock</li>
                    <li>• Significant ecosystem changes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Emergency Proposals:</h4>
                  <ul className="space-y-0.5">
                    <li>• 5% quorum, ≥60% approval</li>
                    <li>• 12-24h timelock</li>
                    <li>• Urgent security/compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Sections Overview */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Template Sections</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-medium">Required Sections</span>
              </div>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• A.1 Cover (Title, Type, Abstract)</li>
                <li>• A.2 Rationale & Goals</li>
                <li>• A.3 Scope of Change</li>
                <li>• A.5 Implementation Plan</li>
                <li>• A.8 Voting & Parameters</li>
                <li>• A.9 Changelog</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Optional Sections</span>
              </div>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• A.4 Budget & Resources</li>
                <li>• A.7 Project-Specific</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-medium">Conditional Sections</span>
              </div>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• A.6 Legal & Compliance (Major only)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Form */}
      <DAOOpsProposalForm
        userVotingPower={votingPower}
        proposalThreshold={proposalThreshold}
        chainId={chainId}
        onSuccess={handleSuccess}
      />

      {/* Help Resources */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Resources & Support</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Documentation:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <Link href="/governance/playbooks" className="text-blue-600 hover:underline">Complete DAO Ops Playbooks</Link></li>
                <li>• <Link href="/governance/framework" className="text-blue-600 hover:underline">Governance Framework</Link></li>
                <li>• <Link href="/governance/templates" className="text-blue-600 hover:underline">Proposal Templates & Examples</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Community:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <Link href="/community/forum" className="text-blue-600 hover:underline">Discussion Forum</Link></li>
                <li>• <Link href="/community/discord" className="text-blue-600 hover:underline">Discord Support</Link></li>
                <li>• <Link href="/governance/faq" className="text-blue-600 hover:underline">Governance FAQ</Link></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}