'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VotingInterface } from '@/components/governance/voting-interface'
import { useGovernance, useGovernanceUtils } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/use-auth'
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ExternalLink, 
  Copy,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileText,
  Loader
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProposalDetailPage() {
  const params = useParams()
  const proposalId = params.id as string
  
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { address, isConnected } = useAccount()
  const { user } = useAuth()
  const { 
    votingPower, 
    hasVotingPower, 
    getProposal,
    chainId 
  } = useGovernance()
  const { 
    formatTokenAmount, 
    getProposalStateLabel,
    getVoteSupportLabel 
  } = useGovernanceUtils()

  // Load proposal data
  useEffect(() => {
    const loadProposal = async () => {
      if (!proposalId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const proposalData = await getProposal(proposalId)
        if (proposalData) {
          setProposal(proposalData)
        } else {
          setError('Proposal not found')
        }
      } catch (err) {
        console.error('Failed to load proposal:', err)
        setError('Failed to load proposal')
      } finally {
        setLoading(false)
      }
    }

    loadProposal()
  }, [proposalId, getProposal])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

  const formatProposalType = (type: string) => {
    return type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading proposal...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2">{error || 'Proposal Not Found'}</h2>
              <p className="text-muted-foreground mb-4">
                The requested proposal could not be loaded.
              </p>
              <Button asChild>
                <Link href="/governance">Back to Governance</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate vote percentages
  const totalVotes = BigInt(proposal.forVotes) + BigInt(proposal.againstVotes) + BigInt(proposal.abstainVotes)
  const forPercentage = totalVotes > 0n ? Number(BigInt(proposal.forVotes) * 100n / totalVotes) : 0
  const againstPercentage = totalVotes > 0n ? Number(BigInt(proposal.againstVotes) * 100n / totalVotes) : 0
  const abstainPercentage = totalVotes > 0n ? Number(BigInt(proposal.abstainVotes) * 100n / totalVotes) : 0

  const isActive = proposal.state === 1

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/governance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Governance
            </Link>
          </Button>
        </div>

        {/* Proposal Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={getStateColor(proposal.state)}>
                    {getProposalStateLabel(proposal.state)}
                  </Badge>
                  <Badge variant="outline">
                    {formatProposalType(proposal.proposalType)}
                  </Badge>
                </div>
                <CardTitle className="text-2xl mb-2">{proposal.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Proposal #{proposal.proposalId}</span>
                  <span>•</span>
                  <span>Created {formatDate(proposal.createdAt)}</span>
                  <span>•</span>
                  <span>By {proposal.proposer.slice(0, 8)}...</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(proposal.proposalId)}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Vote Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Voting Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {totalVotes > 0n ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {forPercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">For</div>
                    <div className="text-xs font-medium">
                      {formatTokenAmount(proposal.forVotes)} ORNA
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {againstPercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Against</div>
                    <div className="text-xs font-medium">
                      {formatTokenAmount(proposal.againstVotes)} ORNA
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {abstainPercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Abstain</div>
                    <div className="text-xs font-medium">
                      {formatTokenAmount(proposal.abstainVotes)} ORNA
                    </div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">For</span>
                      <span>{formatTokenAmount(proposal.forVotes)} ORNA</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${forPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-700">Against</span>
                      <span>{formatTokenAmount(proposal.againstVotes)} ORNA</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-red-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${againstPercentage}%` }}
                      />
                    </div>
                  </div>

                  {abstainPercentage > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Abstain</span>
                        <span>{formatTokenAmount(proposal.abstainVotes)} ORNA</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gray-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${abstainPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {formatTokenAmount(totalVotes.toString())} ORNA total votes
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No Votes Yet</h3>
                <p className="text-muted-foreground">
                  {isActive ? "Be the first to vote on this proposal!" : "Voting has not started or no votes were cast."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voting Interface */}
        {isConnected && user && isActive && (
          <VotingInterface
            proposal={proposal}
            userVotingPower={votingPower}
            chainId={chainId}
          />
        )}

        {/* Proposal Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{proposal.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Proposal Information</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proposal ID:</span>
                    <span className="font-mono">{proposal.proposalId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{formatProposalType(proposal.proposalType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proposer:</span>
                    <span className="font-mono">{proposal.proposer}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Timing</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(proposal.createdAt)}</span>
                  </div>
                  {proposal.startBlock && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Block:</span>
                      <span className="font-mono">{proposal.startBlock}</span>
                    </div>
                  )}
                  {proposal.endBlock && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Block:</span>
                      <span className="font-mono">{proposal.endBlock}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* On-chain data */}
            {proposal.onChain && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">On-Chain Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">State:</span>
                    <span className="ml-2">{proposal.onChain.stateName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Snapshot Block:</span>
                    <span className="ml-2 font-mono">{proposal.onChain.snapshot}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline Block:</span>
                    <span className="ml-2 font-mono">{proposal.onChain.deadline}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Links */}
        <Card>
          <CardHeader>
            <CardTitle>Related Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/governance" className="flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  All Proposals
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/governance/proposals/create" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Create Proposal
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://etherscan.io/address/${proposal.proposer}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Proposer
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}