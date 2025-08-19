'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useGovernanceUtils } from '@/hooks/use-governance'
import { Clock, Users, TrendingUp } from 'lucide-react'
import type { GovernanceProposal } from '@/types/api'

interface ProposalCardProps {
  proposal: GovernanceProposal
  className?: string
  showActions?: boolean
}

export function ProposalCard({ 
  proposal, 
  className, 
  showActions = true 
}: ProposalCardProps) {
  const { getProposalStateLabel, formatTokenAmount } = useGovernanceUtils()

  // Convert status string to state number for compatibility
  const getStateNumber = (status: string): number => {
    switch (status) {
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

  const stateNumber = proposal.onChain?.state ?? getStateNumber(proposal.status)

  // Calculate vote percentages
  const totalVotes = BigInt(proposal.forVotes) + BigInt(proposal.againstVotes) + BigInt(proposal.abstainVotes)
  const forPercentage = totalVotes > 0n ? (Number(BigInt(proposal.forVotes) * 100n / totalVotes)) : 0
  const againstPercentage = totalVotes > 0n ? (Number(BigInt(proposal.againstVotes) * 100n / totalVotes)) : 0
  const abstainPercentage = totalVotes > 0n ? (Number(BigInt(proposal.abstainVotes) * 100n / totalVotes)) : 0

  // Format creation date
  const createdDate = new Date(proposal.createdAt).toLocaleDateString()

  // Get state color and label
  const getStateColor = (state: number) => {
    switch (state) {
      case 0: return 'bg-yellow-100 text-yellow-800' // Pending
      case 1: return 'bg-blue-100 text-blue-800' // Active
      case 2: return 'bg-gray-100 text-gray-800' // Canceled
      case 3: return 'bg-red-100 text-red-800' // Defeated
      case 4: return 'bg-green-100 text-green-800' // Succeeded
      case 5: return 'bg-purple-100 text-purple-800' // Queued
      case 6: return 'bg-orange-100 text-orange-800' // Expired
      case 7: return 'bg-emerald-100 text-emerald-800' // Executed
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProposalTypeColor = (type: string) => {
    switch (type) {
      case 'ECOSYSTEM_PARAMETER': return 'bg-green-100 text-green-800'
      case 'METHOD_REGISTRY': return 'bg-blue-100 text-blue-800'
      case 'FINANCE_PLATFORM': return 'bg-purple-100 text-purple-800'
      case 'LIFT_TOKEN_GOVERNANCE': return 'bg-orange-100 text-orange-800'
      case 'EMERGENCY': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatProposalType = (type: string) => {
    return type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const isActive = stateNumber === 1 // Active state
  const isVotingEnded = [3, 4, 5, 6, 7].includes(stateNumber) // Defeated, Succeeded, Queued, Expired, Executed

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2 truncate">
              {proposal.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className={getStateColor(stateNumber)}>
                {getProposalStateLabel(stateNumber)}
              </Badge>
              <Badge className={getProposalTypeColor(proposal.proposalType)}>
                {formatProposalType(proposal.proposalType)}
              </Badge>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {createdDate}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {proposal.description}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Vote Summary */}
        {totalVotes > 0n && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {formatTokenAmount(totalVotes.toString())} ORNA votes cast
            </div>
            
            {/* Vote Progress Bars */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">For ({forPercentage.toFixed(1)}%)</span>
                <span className="font-medium">{formatTokenAmount(proposal.forVotes)} ORNA</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${forPercentage}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Against ({againstPercentage.toFixed(1)}%)</span>
                <span className="font-medium">{formatTokenAmount(proposal.againstVotes)} ORNA</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${againstPercentage}%` }}
                />
              </div>
              
              {abstainPercentage > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Abstain ({abstainPercentage.toFixed(1)}%)</span>
                    <span className="font-medium">{formatTokenAmount(proposal.abstainVotes)} ORNA</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${abstainPercentage}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* No votes yet */}
        {totalVotes === 0n && (
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No votes cast yet</p>
            {isActive && <p className="text-xs">Be the first to vote!</p>}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="pt-0">
          <div className="flex w-full gap-2">
            <Button 
              asChild 
              variant="outline" 
              className="flex-1"
              size="sm"
            >
              <Link href={`/governance/proposals/${proposal.proposalId}`}>
                View Details
              </Link>
            </Button>
            
            {isActive && (
              <Button 
                asChild 
                variant="default" 
                className="flex-1"
                size="sm"
              >
                <Link href={`/governance/proposals/${proposal.proposalId}/vote`}>
                  Vote Now
                </Link>
              </Button>
            )}
            
            {isVotingEnded && (
              <Button 
                variant="secondary" 
                className="flex-1"
                size="sm"
                disabled
              >
                Voting Ended
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}