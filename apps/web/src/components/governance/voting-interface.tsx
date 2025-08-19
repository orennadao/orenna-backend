'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useGovernanceVoting, useGovernanceUtils, VoteSupport } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { Check, X, Minus, Loader, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface VotingInterfaceProps {
  proposal: {
    id: string
    proposalId: string
    title: string
    state: number
    forVotes: string
    againstVotes: string
    abstainVotes: string
  }
  userVotingPower: string
  hasVoted?: boolean
  userVote?: {
    support: VoteSupport
    reason?: string
  }
  chainId?: number
  className?: string
}

export function VotingInterface({
  proposal,
  userVotingPower,
  hasVoted = false,
  userVote,
  chainId = 1,
  className,
}: VotingInterfaceProps) {
  const [selectedSupport, setSelectedSupport] = useState<VoteSupport | null>(null)
  const [reason, setReason] = useState('')
  const [showReason, setShowReason] = useState(false)
  
  const { address } = useAccount()
  const { castVote, isVoting } = useGovernanceVoting(chainId)
  const { formatTokenAmount, getVoteSupportLabel } = useGovernanceUtils()

  const isActive = proposal.state === 1 // Active state
  const canVote = isActive && !hasVoted && address && BigInt(userVotingPower) > 0n

  const handleVote = async () => {
    if (!selectedSupport === null || !proposal.proposalId) return

    try {
      await castVote({
        proposalId: proposal.proposalId,
        support: selectedSupport!,
        reason: reason.trim() || undefined,
      })
      
      // Reset form
      setSelectedSupport(null)
      setReason('')
      setShowReason(false)
      
      toast.success('Vote cast successfully!')
    } catch (error) {
      console.error('Failed to cast vote:', error)
      toast.error('Failed to cast vote. Please try again.')
    }
  }

  const getSupportIcon = (support: VoteSupport) => {
    switch (support) {
      case VoteSupport.For:
        return <Check className="h-4 w-4" />
      case VoteSupport.Against:
        return <X className="h-4 w-4" />
      case VoteSupport.Abstain:
        return <Minus className="h-4 w-4" />
    }
  }

  const getSupportColor = (support: VoteSupport, isSelected: boolean) => {
    const baseClasses = "border-2 transition-all duration-200"
    
    if (isSelected) {
      switch (support) {
        case VoteSupport.For:
          return `${baseClasses} border-green-500 bg-green-50 text-green-900`
        case VoteSupport.Against:
          return `${baseClasses} border-red-500 bg-red-50 text-red-900`
        case VoteSupport.Abstain:
          return `${baseClasses} border-gray-500 bg-gray-50 text-gray-900`
      }
    }
    
    return `${baseClasses} border-gray-200 hover:border-gray-300 bg-white text-gray-700`
  }

  if (!isActive) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Voting Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This proposal is not in the active voting phase.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (hasVoted && userVote) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            You Have Voted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800">
              {getSupportIcon(userVote.support)}
              <span className="ml-1">{getVoteSupportLabel(userVote.support)}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">
              with {formatTokenAmount(userVotingPower)} ORNA voting power
            </span>
          </div>
          
          {userVote.reason && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">Your reason:</h4>
              <p className="text-sm text-muted-foreground">"{userVote.reason}"</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!canVote) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Cannot Vote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {!address && "Please connect your wallet to vote."}
            {address && BigInt(userVotingPower) === 0n && "You need ORNA voting power to participate in governance."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your voting power: {formatTokenAmount(userVotingPower)} ORNA
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Vote Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Choose your vote:</Label>
          
          <div className="grid gap-3">
            {[VoteSupport.For, VoteSupport.Against, VoteSupport.Abstain].map((support) => (
              <button
                key={support}
                className={`${getSupportColor(support, selectedSupport === support)} p-4 rounded-lg text-left flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => setSelectedSupport(support)}
                disabled={isVoting}
              >
                {getSupportIcon(support)}
                <div className="flex-1">
                  <div className="font-medium">{getVoteSupportLabel(support)}</div>
                  <div className="text-xs opacity-75">
                    {support === VoteSupport.For && "Support this proposal"}
                    {support === VoteSupport.Against && "Oppose this proposal"}
                    {support === VoteSupport.Abstain && "Neither support nor oppose"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Reason */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Reason (optional)</Label>
            {!showReason && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReason(true)}
                className="text-xs"
              >
                Add reason
              </Button>
            )}
          </div>
          
          {showReason && (
            <div className="space-y-2">
              <Textarea
                placeholder="Explain your voting decision..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                className="min-h-[100px]"
                disabled={isVoting}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{reason.length}/500 characters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReason(false)
                    setReason('')
                  }}
                  className="text-xs"
                >
                  Remove reason
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Vote Button */}
        <Button
          onClick={handleVote}
          disabled={selectedSupport === null || isVoting}
          className="w-full"
          size="lg"
        >
          {isVoting ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Casting Vote...
            </>
          ) : (
            `Vote ${selectedSupport !== null ? getVoteSupportLabel(selectedSupport) : ''}`
          )}
        </Button>

        {/* Vote Summary */}
        {selectedSupport !== null && (
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <h4 className="font-medium text-blue-900 mb-2">Vote Summary</h4>
            <div className="space-y-1 text-blue-800">
              <div>Choice: <span className="font-medium">{getVoteSupportLabel(selectedSupport)}</span></div>
              <div>Voting Power: <span className="font-medium">{formatTokenAmount(userVotingPower)} ORNA</span></div>
              {reason && <div>Reason: <span className="font-medium">"{reason}"</span></div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}