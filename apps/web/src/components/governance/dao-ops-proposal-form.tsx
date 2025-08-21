'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useGovernanceProposals, useGovernanceUtils } from '@/hooks/use-governance'
import { 
  FileText, 
  Info, 
  Target, 
  DollarSign, 
  Calendar, 
  Scale, 
  Settings, 
  Clock, 
  Edit,
  AlertTriangle,
  CheckCircle,
  Loader
} from 'lucide-react'
import { toast } from 'sonner'

interface ProposalSection {
  id: string
  title: string
  description: string
  required: boolean
  content: string
}

interface DAOOpsProposalFormProps {
  userVotingPower: string
  proposalThreshold: string
  chainId?: number
  onSuccess?: () => void
}

const PROPOSAL_TYPES = [
  { value: 'STANDARD', label: 'Standard', timelock: '48h', quorum: '8%', approval: '>50%' },
  { value: 'MAJOR', label: 'Major', timelock: '72h', quorum: '15%', approval: '≥66.7%' },
  { value: 'EMERGENCY', label: 'Emergency', timelock: '12-24h', quorum: '5%', approval: '≥60%' },
]

const LIFT_FORWARD_TEMPLATES = [
  { value: 'CONSERVATION', label: 'Conservation Project', milestones: 4 },
  { value: 'RESTORATION', label: 'Ecosystem Restoration', milestones: 5 },
  { value: 'MONITORING', label: 'Long-term Monitoring', milestones: 3 },
  { value: 'RESEARCH', label: 'Research Initiative', milestones: 4 },
]

export function DAOOpsProposalForm({
  userVotingPower,
  proposalThreshold,
  chainId = 1,
  onSuccess,
}: DAOOpsProposalFormProps) {
  // A.1 Cover
  const [title, setTitle] = useState('')
  const [proposalType, setProposalType] = useState('')
  const [abstract, setAbstract] = useState('')
  const [links, setLinks] = useState({ repo: '', docs: '', projectNFT: '' })

  // A.2 Rationale & Goals
  const [rationale, setRationale] = useState('')
  const [intendedOutcomes, setIntendedOutcomes] = useState('')
  const [successMetrics, setSuccessMetrics] = useState('')

  // A.3 Scope of Change
  const [policyCodeTouched, setPolicyCodeTouched] = useState('')
  const [backwardCompatibility, setBackwardCompatibility] = useState('')
  const [risksAndMitigations, setRisksAndMitigations] = useState('')

  // A.4 Budget & Resources
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetUsage, setBudgetUsage] = useState('')
  const [disbursementRules, setDisbursementRules] = useState('')

  // A.5 Implementation Plan
  const [executors, setExecutors] = useState('')
  const [timeline, setTimeline] = useState('')
  const [testingAudit, setTestingAudit] = useState('')

  // A.6 Legal & Compliance (Major only)
  const [legalSummary, setLegalSummary] = useState('')
  const [counselMemo, setCounselMemo] = useState('')

  // A.7 Project-Specific
  const [projectNFTId, setProjectNFTId] = useState('')
  const [liftForwardTemplate, setLiftForwardTemplate] = useState('')
  const [liftForwardMilestones, setLiftForwardMilestones] = useState('')
  const [verifierSet, setVerifierSet] = useState('')
  const [challengeWindows, setChallengeWindows] = useState('14')
  const [sensitiveDataHandling, setSensitiveDataHandling] = useState('')

  // A.8 Voting & Parameters (autofilled)
  const [customQuorum, setCustomQuorum] = useState('')
  const [customApproval, setCustomApproval] = useState('')
  const [customTimelock, setCustomTimelock] = useState('')
  
  // A.9 Changelog
  const [changelog, setChangelog] = useState('v1.0: Initial proposal')

  const [currentStep, setCurrentStep] = useState(1)
  const { createProposal, isCreatingProposal } = useGovernanceProposals(chainId)
  const { formatTokenAmount } = useGovernanceUtils()

  const hasRequiredVotingPower = BigInt(userVotingPower) >= BigInt(proposalThreshold)
  const selectedType = PROPOSAL_TYPES.find(t => t.value === proposalType)
  const isMajorProposal = proposalType === 'MAJOR'
  const isProjectSpecific = projectNFTId || liftForwardTemplate

  const sections = [
    { id: 'cover', title: 'A.1 Cover', icon: FileText, required: true },
    { id: 'rationale', title: 'A.2 Rationale & Goals', icon: Target, required: true },
    { id: 'scope', title: 'A.3 Scope of Change', icon: Settings, required: true },
    { id: 'budget', title: 'A.4 Budget & Resources', icon: DollarSign, required: false },
    { id: 'implementation', title: 'A.5 Implementation Plan', icon: Calendar, required: true },
    { id: 'legal', title: 'A.6 Legal & Compliance', icon: Scale, required: isMajorProposal },
    { id: 'project', title: 'A.7 Project-Specific', icon: Info, required: false },
    { id: 'voting', title: 'A.8 Voting & Parameters', icon: Clock, required: true },
    { id: 'changelog', title: 'A.9 Changelog', icon: Edit, required: true },
  ]

  const validateSection = (sectionId: string): boolean => {
    switch (sectionId) {
      case 'cover':
        return !!(title && proposalType && abstract && abstract.length <= 150)
      case 'rationale':
        return !!(rationale && intendedOutcomes)
      case 'scope':
        return !!(policyCodeTouched && risksAndMitigations)
      case 'implementation':
        return !!(executors && timeline)
      case 'legal':
        return !isMajorProposal || !!(legalSummary)
      case 'voting':
        return true // Auto-filled
      case 'changelog':
        return !!changelog
      default:
        return true
    }
  }

  const canProceed = (step: number): boolean => {
    const section = sections[step - 1]
    return !section.required || validateSection(section.id)
  }

  const handleSubmit = async () => {
    if (!hasRequiredVotingPower) {
      toast.error('Insufficient voting power')
      return
    }

    // Validate all required sections
    const invalidSections = sections
      .filter(s => s.required && !validateSection(s.id))
      .map(s => s.title)

    if (invalidSections.length > 0) {
      toast.error(`Please complete: ${invalidSections.join(', ')}`)
      return
    }

    try {
      // Compile the full DAO Ops template into description
      const daoOpsDescription = `
# ${title}

**Type:** ${proposalType}
**Abstract:** ${abstract}

## A.2 Rationale & Goals
**Why now?** ${rationale}
**Intended outcomes & success metrics:** ${intendedOutcomes}
${successMetrics ? `**Success Metrics:** ${successMetrics}` : ''}

## A.3 Scope of Change
**Policy/Code touched:** ${policyCodeTouched}
**Backward compatibility:** ${backwardCompatibility}
**Risks & mitigations:** ${risksAndMitigations}

${budgetAmount ? `## A.4 Budget & Resources
**Amount:** $${budgetAmount} USD
**Usage:** ${budgetUsage}
**Disbursement rules:** ${disbursementRules}` : ''}

## A.5 Implementation Plan
**Who executes:** ${executors}
**Timeline:** ${timeline}
**Testing/Audit:** ${testingAudit}

${isMajorProposal ? `## A.6 Legal & Compliance
**Plain-English summary:** ${legalSummary}
${counselMemo ? `**Counsel memo:** ${counselMemo}` : ''}` : ''}

${isProjectSpecific ? `## A.7 Project-Specific
${projectNFTId ? `**Project NFT:** ${projectNFTId}` : ''}
${liftForwardTemplate ? `**Lift Forward template:** ${liftForwardTemplate}` : ''}
${liftForwardMilestones ? `**Milestones:** ${liftForwardMilestones}` : ''}
${verifierSet ? `**Verifier set:** ${verifierSet}` : ''}
**Challenge windows:** ${challengeWindows} days
${sensitiveDataHandling ? `**Sensitive data handling:** ${sensitiveDataHandling}` : ''}` : ''}

## A.8 Voting & Parameters
**Quorum:** ${selectedType?.quorum} | **Approval:** ${selectedType?.approval} | **Timelock:** ${selectedType?.timelock}
**Voting period:** 7 days (fixed)

## A.9 Changelog
${changelog}

---
*Generated using DAO Ops Playbook Template A (Author a Proposal)*
      `.trim()

      const proposalData = {
        title,
        description: daoOpsDescription,
        proposalType,
        targets: ['0x0000000000000000000000000000000000000000'], // Placeholder
        values: ['0'],
        calldatas: ['0x'],
        ecosystemData: {
          rationale,
          intendedOutcomes,
          successMetrics,
          timeline,
          budget: budgetAmount ? {
            amount: budgetAmount,
            usage: budgetUsage,
            disbursementRules,
          } : undefined,
          liftForward: liftForwardTemplate ? {
            template: liftForwardTemplate,
            milestones: liftForwardMilestones,
            verifierSet,
            challengeWindows: parseInt(challengeWindows),
          } : undefined,
          legal: isMajorProposal ? {
            summary: legalSummary,
            counselMemo,
          } : undefined,
          links,
          projectNFT: projectNFTId,
        },
      }

      await createProposal(proposalData)
      toast.success('DAO Ops proposal created successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create proposal:', error)
      toast.error('Failed to create proposal. Please try again.')
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // A.1 Cover
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Clear, action-oriented title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="proposalType">Type *</Label>
              <select
                id="proposalType"
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select proposal type</option>
                {PROPOSAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} (Quorum: {type.quorum}, Timelock: {type.timelock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="abstract">Abstract (≤150 words) *</Label>
              <Textarea
                id="abstract"
                placeholder="One-paragraph summary of the change"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                maxLength={750} // Roughly 150 words
                className="min-h-[100px]"
              />
              <div className="text-xs text-muted-foreground">
                {abstract.length}/750 characters (~{Math.ceil(abstract.split(' ').length)} words)
              </div>
            </div>

            <div>
              <Label>Links</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Repo PR URL"
                  value={links.repo}
                  onChange={(e) => setLinks({...links, repo: e.target.value})}
                />
                <Input
                  placeholder="Design doc URL"
                  value={links.docs}
                  onChange={(e) => setLinks({...links, docs: e.target.value})}
                />
                <Input
                  placeholder="Project NFT ID"
                  value={links.projectNFT}
                  onChange={(e) => setLinks({...links, projectNFT: e.target.value})}
                />
              </div>
            </div>
          </div>
        )

      case 2: // A.2 Rationale & Goals
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rationale">Why now? *</Label>
              <Textarea
                id="rationale"
                placeholder="What user/ecology/operational need does this address?"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="intendedOutcomes">Intended outcomes & success metrics *</Label>
              <Textarea
                id="intendedOutcomes"
                placeholder="Quantified where possible"
                value={intendedOutcomes}
                onChange={(e) => setIntendedOutcomes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="successMetrics">Success Metrics (optional)</Label>
              <Textarea
                id="successMetrics"
                placeholder="Specific measurable outcomes"
                value={successMetrics}
                onChange={(e) => setSuccessMetrics(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )

      case 3: // A.3 Scope of Change
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="policyCodeTouched">Policy/Code touched *</Label>
              <Textarea
                id="policyCodeTouched"
                placeholder="Contracts, params, docs that will be modified"
                value={policyCodeTouched}
                onChange={(e) => setPolicyCodeTouched(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="backwardCompatibility">Backward compatibility</Label>
              <Textarea
                id="backwardCompatibility"
                placeholder="Migration steps, deprecation plan"
                value={backwardCompatibility}
                onChange={(e) => setBackwardCompatibility(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="risksAndMitigations">Risks & mitigations *</Label>
              <Textarea
                id="risksAndMitigations"
                placeholder="Reference Governance Risks & Safeguards"
                value={risksAndMitigations}
                onChange={(e) => setRisksAndMitigations(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )

      case 4: // A.4 Budget & Resources
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Optional section. Include if your proposal requires funding or resources.
              </p>
            </div>

            <div>
              <Label htmlFor="budgetAmount">Amount (USD equivalent)</Label>
              <Input
                id="budgetAmount"
                type="number"
                placeholder="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="budgetUsage">Usage (line-items)</Label>
              <Textarea
                id="budgetUsage"
                placeholder="Break down how funds will be used"
                value={budgetUsage}
                onChange={(e) => setBudgetUsage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="disbursementRules">Disbursement rules</Label>
              <Textarea
                id="disbursementRules"
                placeholder="Tranche schedule, deliverables, clawback conditions"
                value={disbursementRules}
                onChange={(e) => setDisbursementRules(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )

      case 5: // A.5 Implementation Plan
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="executors">Who executes *</Label>
              <Textarea
                id="executors"
                placeholder="Roles (e.g., Treasury Signers, Executor, Verifier)"
                value={executors}
                onChange={(e) => setExecutors(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="timeline">Timeline *</Label>
              <Textarea
                id="timeline"
                placeholder="Milestones with dates"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="testingAudit">Testing/Audit</Label>
              <Textarea
                id="testingAudit"
                placeholder="Audit status, test coverage, rollout gates"
                value={testingAudit}
                onChange={(e) => setTestingAudit(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )

      case 6: // A.6 Legal & Compliance (Major only)
        return (
          <div className="space-y-4">
            {isMajorProposal ? (
              <>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-800">
                    Required for Major proposals that may have legal implications.
                  </p>
                </div>

                <div>
                  <Label htmlFor="legalSummary">Plain-English summary of legal impact *</Label>
                  <Textarea
                    id="legalSummary"
                    placeholder="Describe potential legal implications in simple terms"
                    value={legalSummary}
                    onChange={(e) => setLegalSummary(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="counselMemo">Counsel memo link</Label>
                  <Input
                    id="counselMemo"
                    placeholder="URL to legal counsel memo (if available)"
                    value={counselMemo}
                    onChange={(e) => setCounselMemo(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  Legal & Compliance section is only required for Major proposals.
                </p>
              </div>
            )}
          </div>
        )

      case 7: // A.7 Project-Specific
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Include if your proposal is specific to a project or involves Lift Forward.
              </p>
            </div>

            <div>
              <Label htmlFor="projectNFTId">Project NFT Token ID</Label>
              <Input
                id="projectNFTId"
                placeholder="Token ID + IPFS metadata link"
                value={projectNFTId}
                onChange={(e) => setProjectNFTId(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="liftForwardTemplate">Lift Forward Template</Label>
              <select
                id="liftForwardTemplate"
                value={liftForwardTemplate}
                onChange={(e) => setLiftForwardTemplate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select template (if applicable)</option>
                {LIFT_FORWARD_TEMPLATES.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label} ({template.milestones} milestones)
                  </option>
                ))}
              </select>
            </div>

            {liftForwardTemplate && (
              <>
                <div>
                  <Label htmlFor="liftForwardMilestones">Milestones</Label>
                  <Textarea
                    id="liftForwardMilestones"
                    placeholder="M1 design, M2 mobilization, M3 implementation, M4 MRV acceptance..."
                    value={liftForwardMilestones}
                    onChange={(e) => setLiftForwardMilestones(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="verifierSet">Verifier(s) and evidence requirements</Label>
                  <Textarea
                    id="verifierSet"
                    placeholder="Specify verifiers and evidence requirements"
                    value={verifierSet}
                    onChange={(e) => setVerifierSet(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="challengeWindows">Challenge windows (days)</Label>
                  <Input
                    id="challengeWindows"
                    type="number"
                    placeholder="14"
                    value={challengeWindows}
                    onChange={(e) => setChallengeWindows(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="sensitiveDataHandling">Sensitive data handling</Label>
              <Textarea
                id="sensitiveDataHandling"
                placeholder="Redaction plan per policy"
                value={sensitiveDataHandling}
                onChange={(e) => setSensitiveDataHandling(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )

      case 8: // A.8 Voting & Parameters
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                These parameters are automatically filled based on your proposal type.
              </p>
            </div>

            {selectedType && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Quorum</h4>
                  <p className="text-2xl font-bold text-blue-600">{selectedType.quorum}</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Approval</h4>
                  <p className="text-2xl font-bold text-green-600">{selectedType.approval}</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Timelock</h4>
                  <p className="text-2xl font-bold text-orange-600">{selectedType.timelock}</p>
                </Card>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Fixed Parameters</h4>
              <div className="text-sm space-y-1">
                <p><strong>Voting period:</strong> 7 days (fixed)</p>
                <p><strong>Sponsorship required:</strong> Yes (varies by type)</p>
                <p><strong>Anti-spam deposit:</strong> $250 USDC</p>
              </div>
            </div>
          </div>
        )

      case 9: // A.9 Changelog
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="changelog">Changelog *</Label>
              <Textarea
                id="changelog"
                placeholder="v1.0: Initial proposal&#10;v1.1: Updated timeline based on feedback"
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Track changes between proposal versions
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-yellow-900">Review Summary</h4>
              <div className="text-sm text-yellow-800 space-y-2">
                <p><strong>Title:</strong> {title || 'Not set'}</p>
                <p><strong>Type:</strong> {proposalType || 'Not selected'}</p>
                <p><strong>Has Budget:</strong> {budgetAmount ? `$${budgetAmount}` : 'No'}</p>
                <p><strong>Project-Specific:</strong> {isProjectSpecific ? 'Yes' : 'No'}</p>
                <p><strong>Legal Review Required:</strong> {isMajorProposal ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Invalid step</div>
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          DAO Ops Proposal Template (A.1-A.9)
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
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Progress</h3>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {sections.length}
            </span>
          </div>
          <div className="grid grid-cols-9 gap-2">
            {sections.map((section, index) => {
              const stepNumber = index + 1
              const isCompleted = stepNumber < currentStep || validateSection(section.id)
              const isCurrent = stepNumber === currentStep
              const Icon = section.icon
              
              return (
                <div
                  key={section.id}
                  className={`p-2 rounded-lg text-center border transition-colors ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50'
                      : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : section.required
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 bg-gray-25'
                  }`}
                >
                  <Icon className={`h-4 w-4 mx-auto mb-1 ${
                    isCurrent
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`} />
                  <div className="text-xs font-medium">{section.title.split(' ')[0]}</div>
                  {section.required && (
                    <div className="text-xs text-red-500">*</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">{sections[currentStep - 1]?.title}</h2>
            {sections[currentStep - 1]?.required && (
              <Badge variant="outline" className="text-red-600 border-red-300">Required</Badge>
            )}
          </div>
          
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {validateSection(sections[currentStep - 1]?.id) ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : sections[currentStep - 1]?.required ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <div className="h-5 w-5" />
            )}
          </div>

          {currentStep < sections.length ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={sections[currentStep - 1]?.required && !canProceed(currentStep)}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!hasRequiredVotingPower || isCreatingProposal}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingProposal ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Submit Proposal'
              )}
            </Button>
          )}
        </div>

        {/* Validation Summary */}
        {currentStep === sections.length && (
          <div className="mt-6 p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Validation Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center gap-2">
                  {validateSection(section.id) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={section.required ? 'font-medium' : ''}>
                    {section.title}
                  </span>
                  {section.required && !validateSection(section.id) && (
                    <span className="text-red-600 text-xs">(Required)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}