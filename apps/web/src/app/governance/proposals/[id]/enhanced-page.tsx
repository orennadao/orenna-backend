'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { EnhancedVotingInterface } from '@/components/governance/enhanced-voting-interface'
import { useGovernance, useGovernanceUtils } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/use-auth'
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  ExternalLink,
  Target,
  DollarSign,
  Settings,
  Shield,
  AlertTriangle,
  Info,
  Wallet,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react'

export default function EnhancedProposalDetailPage() {
  const params = useParams()
  const proposalId = params.id as string
  
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { address, isConnected } = useAccount()
  const { user } = useAuth()
  const { getProposal, votingPower, chainId } = useGovernance()
  const { formatTokenAmount, getProposalStateLabel } = useGovernanceUtils()

  useEffect(() => {
    const fetchProposal = async () => {
      if (!proposalId) return
      
      try {
        setLoading(true)
        const proposalData = await getProposal(proposalId)
        setProposal(proposalData)
      } catch (err) {
        console.error('Failed to fetch proposal:', err)
        setError('Failed to load proposal details')
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [proposalId, getProposal])

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !proposal) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardContent className="pt-6">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-semibold mb-2">Proposal Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  {error || 'The requested proposal could not be found.'}
                </p>
                <Button asChild>
                  <Link href="/governance">Return to Governance</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  const getProposalTypeIcon = (type: string) => {
    switch (type) {
      case 'MAJOR':
        return AlertTriangle
      case 'EMERGENCY':
        return Shield
      case 'ECOSYSTEM_PARAMETER':
        return Settings
      case 'TREASURY_ALLOCATION':
        return DollarSign
      case 'LIFT_TOKEN_GOVERNANCE':
        return Target
      default:
        return FileText
    }
  }

  const getProposalTypeColor = (type: string) => {
    switch (type) {
      case 'MAJOR':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'ECOSYSTEM_PARAMETER':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'TREASURY_ALLOCATION':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'LIFT_TOKEN_GOVERNANCE':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const ProposalTypeIcon = getProposalTypeIcon(proposal.proposalType)

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <ProposalTypeIcon className="h-6 w-6 text-muted-foreground" />
                  <h1 className="text-3xl font-bold">{proposal.title}</h1>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge className={getProposalTypeColor(proposal.proposalType)}>
                    {proposal.proposalType.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">
                    {getProposalStateLabel(proposal.state)}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>by {proposal.proposer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View on Chain
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  IPFS Metadata
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Proposal Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Proposal Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap">{proposal.description}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Timeline */}
              {proposal.ecosystemData?.timeline && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Implementation Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm">
                      {proposal.ecosystemData.timeline}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Budget Information */}
              {proposal.ecosystemData?.budget && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Budget & Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Amount</Label>
                        <div className="text-2xl font-bold text-green-600">
                          ${proposal.ecosystemData.budget.amount} USD
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Disbursement</Label>
                        <div className="text-sm text-muted-foreground">
                          {proposal.ecosystemData.budget.disbursementRules || 'On milestone completion'}
                        </div>
                      </div>
                    </div>
                    
                    {proposal.ecosystemData.budget.usage && (
                      <div>
                        <Label className="text-sm font-medium">Usage Breakdown</Label>
                        <div className="text-sm whitespace-pre-wrap mt-2">
                          {proposal.ecosystemData.budget.usage}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Lift Forward Details */}
              {proposal.ecosystemData?.liftForward && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Lift Forward Escrow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Template</Label>
                        <div className="font-medium">
                          {proposal.ecosystemData.liftForward.template}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Challenge Window</Label>
                        <div className="font-medium">
                          {proposal.ecosystemData.liftForward.challengeWindows} days
                        </div>
                      </div>
                    </div>
                    
                    {proposal.ecosystemData.liftForward.milestones && (
                      <div>
                        <Label className="text-sm font-medium">Milestones</Label>
                        <div className="text-sm whitespace-pre-wrap mt-2">
                          {proposal.ecosystemData.liftForward.milestones}
                        </div>
                      </div>
                    )}
                    
                    {proposal.ecosystemData.liftForward.verifierSet && (
                      <div>
                        <Label className="text-sm font-medium">Verifier Requirements</Label>
                        <div className="text-sm whitespace-pre-wrap mt-2">
                          {proposal.ecosystemData.liftForward.verifierSet}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Legal Information */}
              {proposal.ecosystemData?.legal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Legal & Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Legal Impact Summary</Label>
                      <div className="text-sm mt-2">
                        {proposal.ecosystemData.legal.summary}
                      </div>
                    </div>
                    
                    {proposal.ecosystemData.legal.counselMemo && (
                      <div>
                        <Label className="text-sm font-medium">Counsel Memo</Label>
                        <Button variant="outline" size="sm" className="mt-2">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Legal Memo
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Voting Sidebar */}
            <div className="lg:col-span-1">
              {!isConnected ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Connect to Vote</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your wallet to participate in governance
                    </p>
                    <Button asChild>
                      <Link href="/auth">Connect Wallet</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : !user ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Sign In Required</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please authenticate to vote on proposals
                    </p>
                    <Button asChild>
                      <Link href="/auth">Sign In</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <EnhancedVotingInterface
                  proposal={proposal}
                  userVotingPower={votingPower}
                  chainId={chainId}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}