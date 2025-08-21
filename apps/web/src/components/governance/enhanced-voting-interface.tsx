'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useGovernanceVoting, useGovernanceUtils, VoteSupport, useGovernanceToken } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { 
  Check, 
  X, 
  Minus, 
  Loader, 
  AlertCircle, 
  Users, 
  Clock, 
  TrendingUp,
  Info,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Calendar,
  Target,
  AlertTriangle,
  Vote
} from 'lucide-react'
import { toast } from 'sonner'

interface EnhancedVotingInterfaceProps {
  proposal: {
    id: string
    proposalId: string
    title: string
    description: string
    proposalType: string
    state: number
    forVotes: string
    againstVotes: string
    abstainVotes: string
    startBlock?: string
    endBlock?: string
    quorum?: string
    quorumRequired?: string
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
  userVotingPower: string
  hasVoted?: boolean
  userVote?: {
    support: VoteSupport
    reason?: string
  }
  chainId?: number
  className?: string
}

export function EnhancedVotingInterface({
  proposal,
  userVotingPower,
  hasVoted = false,
  userVote,
  chainId = 1,
  className,
}: EnhancedVotingInterfaceProps) {
  const [selectedSupport, setSelectedSupport] = useState<VoteSupport | null>(null)
  const [reason, setReason] = useState('')
  const [showReason, setShowReason] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  
  const { address } = useAccount()
  const { castVote, isVoting, hasVoted: checkHasVoted } = useGovernanceVoting(chainId)
  const { formatTokenAmount, getVoteSupportLabel, getProposalStateLabel } = useGovernanceUtils()
  const { votingPower, delegate, tokenInfo } = useGovernanceToken(chainId)

  const isActive = proposal.state === 1 // Active state
  const canVote = isActive && !hasVoted && address && BigInt(userVotingPower) > 0n
  const isDelegated = delegate && delegate.toLowerCase() !== address?.toLowerCase()

  // Calculate vote totals
  const forVotes = BigInt(proposal.onChain?.votes.for || proposal.forVotes || '0')
  const againstVotes = BigInt(proposal.onChain?.votes.against || proposal.againstVotes || '0')
  const abstainVotes = BigInt(proposal.onChain?.votes.abstain || proposal.abstainVotes || '0')
  const totalVotes = forVotes + againstVotes + abstainVotes

  // Calculate percentages
  const forPercentage = totalVotes > 0n ? Number((forVotes * 100n) / totalVotes) : 0
  const againstPercentage = totalVotes > 0n ? Number((againstVotes * 100n) / totalVotes) : 0
  const abstainPercentage = totalVotes > 0n ? Number((abstainVotes * 100n) / totalVotes) : 0

  // Mock quorum calculation (in real implementation, this would come from the contract)
  const quorumRequired = BigInt(proposal.quorumRequired || '1000000000000000000000') // 1000 ORNA
  const quorumReached = totalVotes >= quorumRequired
  const quorumPercentage = Number((totalVotes * 100n) / quorumRequired)

  // Determine approval requirements based on proposal type
  const getApprovalRequirement = () => {
    switch (proposal.proposalType) {
      case 'MAJOR':
        return { threshold: 66.7, label: '≥66.7% approval required' }
      case 'EMERGENCY':
        return { threshold: 60, label: '≥60% approval required' }
      default:
        return { threshold: 50.1, label: '>50% approval required' }
    }
  }

  const approvalReq = getApprovalRequirement()
  const currentApproval = totalVotes > 0n ? Number((forVotes * 100n) / (forVotes + againstVotes)) : 0
  const approvalMet = currentApproval >= approvalReq.threshold

  // Calculate time remaining
  useEffect(() => {
    if (!proposal.onChain?.deadline) return

    const updateTimeRemaining = () => {
      const deadline = new Date(proposal.onChain!.deadline)
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Voting ended')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      } else {
        setTimeRemaining(`${minutes}m remaining`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [proposal.onChain?.deadline])

  const handleVote = async () => {
    if (selectedSupport === null || !proposal.proposalId) return

    try {
      await castVote({
        proposalId: proposal.proposalId,
        support: selectedSupport,
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

  const getGovernanceParameters = () => {
    switch (proposal.proposalType) {
      case 'MAJOR':
        return { quorum: '15%', timelock: '72h', approval: '≥66.7%' }
      case 'EMERGENCY':
        return { quorum: '5%', timelock: '12-24h', approval: '≥60%' }
      default:
        return { quorum: '8%', timelock: '48h', approval: '>50%' }
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Voting Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Voting Status
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {getProposalStateLabel(proposal.state)}
            </Badge>
          </CardTitle>
          {timeRemaining && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {timeRemaining}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quorum Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Quorum Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatTokenAmount(totalVotes.toString())} / {formatTokenAmount(quorumRequired.toString())} ORNA
                </span>
                {quorumReached ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>
            
            <Progress 
              value={Math.min(quorumPercentage, 100)} 
              className="h-3"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{quorumPercentage.toFixed(1)}% of required quorum</span>
              <span className={quorumReached ? 'text-green-600' : 'text-orange-600'}>
                {quorumReached ? 'Quorum reached' : 'Quorum needed'}
              </span>
            </div>
          </div>

          <Separator />

          {/* Vote Distribution */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Vote Distribution
            </h4>
            
            <div className="space-y-3">
              {/* For Votes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">For</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatTokenAmount(forVotes.toString())} ORNA</span>
                  <span className="text-xs text-muted-foreground">({forPercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <Progress value={forPercentage} className="h-2" />

              {/* Against Votes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Against</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatTokenAmount(againstVotes.toString())} ORNA</span>
                  <span className="text-xs text-muted-foreground">({againstPercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <Progress value={againstPercentage} className="h-2" />

              {/* Abstain Votes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Abstain</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatTokenAmount(abstainVotes.toString())} ORNA</span>
                  <span className="text-xs text-muted-foreground">({abstainPercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <Progress value={abstainPercentage} className="h-2" />
            </div>

            {/* Approval Status */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Approval Status</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{currentApproval.toFixed(1)}%</span>
                  {approvalMet ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {approvalReq.label} • Currently {approvalMet ? 'passing' : 'failing'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Governance Parameters */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              DAO Ops Parameters
            </h4>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              {(() => {
                const params = getGovernanceParameters()
                return (
                  <>
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{params.quorum}</div>
                      <div className="text-xs text-muted-foreground">Quorum</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">{params.approval}</div>
                      <div className="text-xs text-muted-foreground">Approval</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-orange-600">{params.timelock}</div>
                      <div className="text-xs text-muted-foreground">Timelock</div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delegation Info */}
      {isDelegated && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Voting Power Delegated</h4>
                <p className="text-sm text-blue-800 mb-2">
                  You have delegated your voting power to {delegate}. They can vote on your behalf.
                </p>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                  Manage Delegation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Interface */}
      {!isActive ? (
        <Card>
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
      ) : hasVoted && userVote ? (
        <Card className="border-green-200 bg-green-50">
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
              <div className="bg-white p-3 rounded-md border">
                <h4 className="text-sm font-medium mb-1">Your reason:</h4>
                <p className="text-sm text-muted-foreground">"{userVote.reason}"</p>
              </div>
            )}

            <div className="bg-green-100 p-3 rounded-lg text-sm text-green-800">
              <p className="font-medium mb-1">Vote recorded successfully</p>
              <p>Your vote has been submitted to the blockchain and counted in the totals above.</p>
            </div>
          </CardContent>
        </Card>
      ) : !canVote ? (
        <Card>
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
              {address && isDelegated && "Your voting power is delegated. The delegate can vote on your behalf."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
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
      )}
    </div>
  )
}