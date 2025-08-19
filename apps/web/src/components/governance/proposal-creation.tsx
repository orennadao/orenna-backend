'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useGovernanceProposals, useGovernanceUtils } from '@/hooks/use-governance'
import { Plus, Trash2, Loader, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface ProposalAction {
  target: string
  value: string
  calldata: string
}

interface ProposalCreationProps {
  userVotingPower: string
  proposalThreshold: string
  chainId?: number
  className?: string
  onSuccess?: () => void
}

const PROPOSAL_TYPES = [
  { value: 'STANDARD', label: 'Standard Proposal', description: 'General governance proposal' },
  { value: 'ECOSYSTEM_PARAMETER', label: 'Ecosystem Parameters', description: 'Update ecosystem measurement parameters' },
  { value: 'METHOD_REGISTRY', label: 'Method Registry', description: 'Update measurement methods' },
  { value: 'FINANCE_PLATFORM', label: 'Finance Platform', description: 'Update platform finance settings' },
  { value: 'LIFT_TOKEN_GOVERNANCE', label: 'Lift Token Governance', description: 'Lift token minting/burning parameters' },
  { value: 'FEE_ADJUSTMENT', label: 'Fee Adjustment', description: 'Platform fee adjustments' },
  { value: 'PROTOCOL_UPGRADE', label: 'Protocol Upgrade', description: 'Protocol or contract upgrades' },
  { value: 'TREASURY_ALLOCATION', label: 'Treasury Allocation', description: 'Treasury fund allocation' },
]

export function ProposalCreation({
  userVotingPower,
  proposalThreshold,
  chainId = 1,
  className,
  onSuccess,
}: ProposalCreationProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [proposalType, setProposalType] = useState('')
  const [actions, setActions] = useState<ProposalAction[]>([{ target: '', value: '0', calldata: '0x' }])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [ecosystemData, setEcosystemData] = useState('')
  const [methodData, setMethodData] = useState('')
  const [financeData, setFinanceData] = useState('')
  const [liftTokenData, setLiftTokenData] = useState('')

  const { createProposal, isCreatingProposal } = useGovernanceProposals(chainId)
  const { formatTokenAmount, parseTokenAmount } = useGovernanceUtils()

  const hasRequiredVotingPower = BigInt(userVotingPower) >= BigInt(proposalThreshold)
  const canCreateProposal = hasRequiredVotingPower && title.trim() && description.trim() && proposalType

  const addAction = () => {
    setActions([...actions, { target: '', value: '0', calldata: '0x' }])
  }

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index))
    }
  }

  const updateAction = (index: number, field: keyof ProposalAction, value: string) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], [field]: value }
    setActions(newActions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canCreateProposal) {
      toast.error('Please fill in all required fields and ensure you have sufficient voting power')
      return
    }

    try {
      const parsedEcosystemData = ecosystemData ? JSON.parse(ecosystemData) : undefined
      const parsedMethodData = methodData ? JSON.parse(methodData) : undefined
      const parsedFinanceData = financeData ? JSON.parse(financeData) : undefined
      const parsedLiftTokenData = liftTokenData ? JSON.parse(liftTokenData) : undefined

      await createProposal({
        title: title.trim(),
        description: description.trim(),
        proposalType,
        targets: actions.map(a => a.target),
        values: actions.map(a => a.value),
        calldatas: actions.map(a => a.calldata),
        ecosystemData: parsedEcosystemData,
        methodRegistryData: parsedMethodData,
        financeData: parsedFinanceData,
        liftTokenData: parsedLiftTokenData,
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setProposalType('')
      setActions([{ target: '', value: '0', calldata: '0x' }])
      setEcosystemData('')
      setMethodData('')
      setFinanceData('')
      setLiftTokenData('')
      
      toast.success('Proposal created successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create proposal:', error)
      toast.error('Failed to create proposal. Please try again.')
    }
  }

  const getProposalTypeDescription = (type: string) => {
    return PROPOSAL_TYPES.find(t => t.value === type)?.description || ''
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create Governance Proposal
        </CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Your voting power: {formatTokenAmount(userVotingPower)} ORNA
          </span>
          <span className="text-muted-foreground">
            Required: {formatTokenAmount(proposalThreshold)} ORNA
          </span>
          {!hasRequiredVotingPower && (
            <Badge className="bg-red-100 text-red-800">
              Insufficient voting power
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasRequiredVotingPower && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-900">Insufficient Voting Power</p>
              <p className="text-red-700">
                You need at least {formatTokenAmount(proposalThreshold)} ORNA voting power to create proposals.
                Consider delegating tokens to yourself or acquiring more ORNA tokens.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title *</Label>
              <Input
                id="title"
                placeholder="Brief descriptive title for your proposal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={isCreatingProposal}
              />
              <div className="text-xs text-muted-foreground">
                {title.length}/200 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of your proposal, including rationale and expected outcomes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                className="min-h-[120px]"
                disabled={isCreatingProposal}
              />
              <div className="text-xs text-muted-foreground">
                {description.length}/5000 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposalType">Proposal Type *</Label>
              <select
                id="proposalType"
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                disabled={isCreatingProposal}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select proposal type</option>
                {PROPOSAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {proposalType && (
                <p className="text-xs text-muted-foreground">
                  {getProposalTypeDescription(proposalType)}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Proposal Actions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAction}
                disabled={isCreatingProposal}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Action
              </Button>
            </div>

            {actions.map((action, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Action {index + 1}</h4>
                  {actions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                      disabled={isCreatingProposal}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Target Contract Address</Label>
                    <Input
                      placeholder="0x..."
                      value={action.target}
                      onChange={(e) => updateAction(index, 'target', e.target.value)}
                      disabled={isCreatingProposal}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">ETH Value (usually 0)</Label>
                    <Input
                      placeholder="0"
                      value={action.value}
                      onChange={(e) => updateAction(index, 'value', e.target.value)}
                      disabled={isCreatingProposal}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Encoded Function Call</Label>
                    <Textarea
                      placeholder="0x..."
                      value={action.calldata}
                      onChange={(e) => updateAction(index, 'calldata', e.target.value)}
                      className="min-h-[60px] font-mono text-xs"
                      disabled={isCreatingProposal}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>

            {showAdvanced && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Add type-specific metadata for your proposal (JSON format)
                </p>
                
                {proposalType === 'ECOSYSTEM_PARAMETER' && (
                  <div className="space-y-2">
                    <Label>Ecosystem Parameter Data</Label>
                    <Textarea
                      placeholder='{"parameter": "water_quality", "newThreshold": 85, "rationale": "..."}'
                      value={ecosystemData}
                      onChange={(e) => setEcosystemData(e.target.value)}
                      className="font-mono text-xs"
                      disabled={isCreatingProposal}
                    />
                  </div>
                )}

                {proposalType === 'METHOD_REGISTRY' && (
                  <div className="space-y-2">
                    <Label>Method Registry Data</Label>
                    <Textarea
                      placeholder='{"methodId": "...", "newCriteria": {...}, "rationale": "..."}'
                      value={methodData}
                      onChange={(e) => setMethodData(e.target.value)}
                      className="font-mono text-xs"
                      disabled={isCreatingProposal}
                    />
                  </div>
                )}

                {proposalType === 'FINANCE_PLATFORM' && (
                  <div className="space-y-2">
                    <Label>Finance Platform Data</Label>
                    <Textarea
                      placeholder='{"parameter": "approval_threshold", "newValue": 10000, "rationale": "..."}'
                      value={financeData}
                      onChange={(e) => setFinanceData(e.target.value)}
                      className="font-mono text-xs"
                      disabled={isCreatingProposal}
                    />
                  </div>
                )}

                {proposalType === 'LIFT_TOKEN_GOVERNANCE' && (
                  <div className="space-y-2">
                    <Label>Lift Token Data</Label>
                    <Textarea
                      placeholder='{"parameter": "minting_fee", "newValue": 250, "rationale": "..."}'
                      value={liftTokenData}
                      onChange={(e) => setLiftTokenData(e.target.value)}
                      className="font-mono text-xs"
                      disabled={isCreatingProposal}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!canCreateProposal || isCreatingProposal}
            size="lg"
            className="w-full"
          >
            {isCreatingProposal ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Creating Proposal...
              </>
            ) : (
              'Create Proposal'
            )}
          </Button>

          {canCreateProposal && (
            <div className="bg-green-50 p-4 rounded-lg text-sm">
              <h4 className="font-medium text-green-900 mb-2">Ready to Create</h4>
              <p className="text-green-800">
                Your proposal will be submitted to the blockchain and enter the voting delay period.
                After the delay, token holders will be able to vote on your proposal.
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}