'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProposalCreation } from '@/components/governance/proposal-creation'
import { useGovernance, useGovernanceUtils } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Wallet, AlertCircle } from 'lucide-react'

export default function CreateProposalPage() {
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
        
        <h1 className="text-3xl font-bold mb-2">Create Governance Proposal</h1>
        <p className="text-muted-foreground">
          Submit a proposal for the OrennaDAO community to vote on. 
          Proposals require {formatTokenAmount(proposalThreshold)} ORNA voting power to create.
        </p>
      </div>

      {/* Governance Guidelines */}
      <Card className="mb-8 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-3">Proposal Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Before Creating:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Discuss your idea in the community forum first</li>
                <li>• Ensure you have sufficient voting power ({formatTokenAmount(proposalThreshold)} ORNA)</li>
                <li>• Research similar past proposals</li>
                <li>• Consider the impact on the ecosystem</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Proposal Requirements:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Clear, descriptive title</li>
                <li>• Detailed rationale and expected outcomes</li>
                <li>• Specific implementation details</li>
                <li>• Consideration of risks and alternatives</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Types Information */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Proposal Types</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-green-700 mb-1">Ecosystem Parameters</h4>
              <p className="text-xs text-muted-foreground">
                Update ecosystem measurement thresholds and standards
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-blue-700 mb-1">Method Registry</h4>
              <p className="text-xs text-muted-foreground">
                Add or modify ecosystem measurement methods
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-purple-700 mb-1">Finance Platform</h4>
              <p className="text-xs text-muted-foreground">
                Adjust platform fees and financial parameters
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-orange-700 mb-1">Lift Token Governance</h4>
              <p className="text-xs text-muted-foreground">
                Modify lift token minting and burning parameters
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-red-700 mb-1">Protocol Upgrade</h4>
              <p className="text-xs text-muted-foreground">
                Upgrade smart contracts and core protocol functions
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-gray-700 mb-1">Standard</h4>
              <p className="text-xs text-muted-foreground">
                General governance proposals not covered by other types
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creation Form */}
      <ProposalCreation
        userVotingPower={votingPower}
        proposalThreshold={proposalThreshold}
        chainId={chainId}
        onSuccess={handleSuccess}
      />

      {/* Help Section */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Need Help?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Resources:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <Link href="/docs/governance" className="text-blue-600 hover:underline">Governance Documentation</Link></li>
                <li>• <Link href="/community/forum" className="text-blue-600 hover:underline">Community Forum</Link></li>
                <li>• <Link href="/docs/proposal-templates" className="text-blue-600 hover:underline">Proposal Templates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Support:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <Link href="/community/discord" className="text-blue-600 hover:underline">Discord Community</Link></li>
                <li>• <Link href="/support" className="text-blue-600 hover:underline">Technical Support</Link></li>
                <li>• <Link href="/governance/faq" className="text-blue-600 hover:underline">Governance FAQ</Link></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}