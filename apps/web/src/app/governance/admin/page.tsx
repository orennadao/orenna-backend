'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useGovernanceParameters } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/use-auth'
import { 
  Settings, 
  Shield, 
  DollarSign, 
  Clock, 
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  RotateCcw,
  Eye,
  TrendingUp,
  Target,
  FileText,
  Calendar,
  Wallet,
  Lock,
  Unlock,
  AlertCircle,
  Activity,
  BarChart3
} from 'lucide-react'

interface ParameterSection {
  id: string
  title: string
  description: string
  icon: any
  parameters: Parameter[]
}

interface Parameter {
  key: string
  label: string
  description: string
  currentValue: string | number
  proposedValue?: string | number
  type: 'number' | 'percentage' | 'duration' | 'address' | 'boolean'
  unit?: string
  min?: number
  max?: number
  requiresProposal: boolean
  lastUpdated?: string
  category: string
}

export default function GovernanceAdminPage() {
  const [activeSection, setActiveSection] = useState('voting')
  const [editingParameter, setEditingParameter] = useState<string | null>(null)
  const [parameterValues, setParameterValues] = useState<{[key: string]: string | number}>({})
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  
  const { address, isConnected } = useAccount()
  const { user } = useAuth()
  const { parameters, parametersLoading } = useGovernanceParameters()

  // Mock admin access check (in real implementation, this would check admin roles)
  useEffect(() => {
    // For now, assume admin access if connected and authenticated
    setHasAdminAccess(!!(isConnected && user && address))
  }, [isConnected, user, address])

  // Mock governance parameters with DAO Ops values
  const governanceParameters: ParameterSection[] = [
    {
      id: 'voting',
      title: 'Voting Parameters',
      description: 'Core voting mechanics and requirements',
      icon: Clock,
      parameters: [
        {
          key: 'voting_period',
          label: 'Voting Period',
          description: 'Duration of voting window for all proposals',
          currentValue: 7,
          type: 'duration',
          unit: 'days',
          min: 3,
          max: 14,
          requiresProposal: true,
          category: 'voting',
          lastUpdated: '2024-01-15'
        },
        {
          key: 'standard_quorum',
          label: 'Standard Quorum',
          description: 'Minimum participation for standard proposals',
          currentValue: 8,
          type: 'percentage',
          unit: '%',
          min: 5,
          max: 25,
          requiresProposal: true,
          category: 'voting'
        },
        {
          key: 'major_quorum',
          label: 'Major Quorum',
          description: 'Minimum participation for major proposals',
          currentValue: 15,
          type: 'percentage',
          unit: '%',
          min: 10,
          max: 30,
          requiresProposal: true,
          category: 'voting'
        },
        {
          key: 'emergency_quorum',
          label: 'Emergency Quorum',
          description: 'Minimum participation for emergency proposals',
          currentValue: 5,
          type: 'percentage',
          unit: '%',
          min: 3,
          max: 15,
          requiresProposal: true,
          category: 'voting'
        }
      ]
    },
    {
      id: 'approval',
      title: 'Approval Thresholds',
      description: 'Minimum approval percentages for different proposal types',
      icon: Target,
      parameters: [
        {
          key: 'standard_approval',
          label: 'Standard Approval',
          description: 'Approval threshold for standard proposals',
          currentValue: 50.1,
          type: 'percentage',
          unit: '%',
          min: 50,
          max: 75,
          requiresProposal: true,
          category: 'approval'
        },
        {
          key: 'major_approval',
          label: 'Major Approval',
          description: 'Approval threshold for major proposals',
          currentValue: 66.7,
          type: 'percentage',
          unit: '%',
          min: 60,
          max: 80,
          requiresProposal: true,
          category: 'approval'
        },
        {
          key: 'emergency_approval',
          label: 'Emergency Approval',
          description: 'Approval threshold for emergency proposals',
          currentValue: 60,
          type: 'percentage',
          unit: '%',
          min: 55,
          max: 75,
          requiresProposal: true,
          category: 'approval'
        }
      ]
    },
    {
      id: 'timelock',
      title: 'Timelock Settings',
      description: 'Execution delays for different proposal types',
      icon: Shield,
      parameters: [
        {
          key: 'standard_timelock',
          label: 'Standard Timelock',
          description: 'Execution delay for standard proposals',
          currentValue: 48,
          type: 'duration',
          unit: 'hours',
          min: 24,
          max: 168,
          requiresProposal: true,
          category: 'timelock'
        },
        {
          key: 'major_timelock',
          label: 'Major Timelock',
          description: 'Execution delay for major proposals',
          currentValue: 72,
          type: 'duration',
          unit: 'hours',
          min: 48,
          max: 240,
          requiresProposal: true,
          category: 'timelock'
        },
        {
          key: 'emergency_timelock_min',
          label: 'Emergency Timelock (Min)',
          description: 'Minimum execution delay for emergency proposals',
          currentValue: 12,
          type: 'duration',
          unit: 'hours',
          min: 6,
          max: 48,
          requiresProposal: true,
          category: 'timelock'
        },
        {
          key: 'emergency_timelock_max',
          label: 'Emergency Timelock (Max)',
          description: 'Maximum execution delay for emergency proposals',
          currentValue: 24,
          type: 'duration',
          unit: 'hours',
          min: 12,
          max: 72,
          requiresProposal: true,
          category: 'timelock'
        }
      ]
    },
    {
      id: 'sponsorship',
      title: 'Sponsorship Requirements',
      description: 'Requirements for proposal sponsorship and anti-spam measures',
      icon: Users,
      parameters: [
        {
          key: 'standard_sponsorship_percentage',
          label: 'Standard Sponsorship (%)',
          description: 'Percentage of total supply required for standard proposal sponsorship',
          currentValue: 0.20,
          type: 'percentage',
          unit: '%',
          min: 0.1,
          max: 1.0,
          requiresProposal: true,
          category: 'sponsorship'
        },
        {
          key: 'standard_sponsorship_wallets',
          label: 'Standard Sponsorship (Wallets)',
          description: 'Alternative: number of wallets required for sponsorship',
          currentValue: 5,
          type: 'number',
          unit: 'wallets',
          min: 3,
          max: 20,
          requiresProposal: true,
          category: 'sponsorship'
        },
        {
          key: 'major_sponsorship_percentage',
          label: 'Major Sponsorship (%)',
          description: 'Percentage of total supply required for major proposal sponsorship',
          currentValue: 0.50,
          type: 'percentage',
          unit: '%',
          min: 0.3,
          max: 2.0,
          requiresProposal: true,
          category: 'sponsorship'
        },
        {
          key: 'anti_spam_deposit',
          label: 'Anti-spam Deposit',
          description: 'Required deposit amount to prevent spam proposals',
          currentValue: 250,
          type: 'number',
          unit: 'USDC',
          min: 100,
          max: 1000,
          requiresProposal: true,
          category: 'sponsorship'
        }
      ]
    },
    {
      id: 'lift_forward',
      title: 'Lift Forward Parameters',
      description: 'Escrow and milestone parameters for Lift Forward contracts',
      icon: TrendingUp,
      parameters: [
        {
          key: 'default_challenge_window',
          label: 'Default Challenge Window',
          description: 'Default challenge period for milestone acceptance',
          currentValue: 14,
          type: 'duration',
          unit: 'days',
          min: 7,
          max: 30,
          requiresProposal: true,
          category: 'lift_forward'
        },
        {
          key: 'dispute_resolution_window',
          label: 'Dispute Resolution Window',
          description: 'Time allowed for dispute resolution panels to decide',
          currentValue: 7,
          type: 'duration',
          unit: 'days',
          min: 3,
          max: 14,
          requiresProposal: true,
          category: 'lift_forward'
        },
        {
          key: 'appeal_window',
          label: 'Appeal Window',
          description: 'Time allowed for appeals with new evidence',
          currentValue: 7,
          type: 'duration',
          unit: 'days',
          min: 3,
          max: 14,
          requiresProposal: true,
          category: 'lift_forward'
        },
        {
          key: 'challenge_bond',
          label: 'Challenge Bond',
          description: 'Required bond for challenging milestone acceptance',
          currentValue: 100,
          type: 'number',
          unit: 'USDC',
          min: 50,
          max: 500,
          requiresProposal: true,
          category: 'lift_forward'
        }
      ]
    }
  ]

  const currentSection = governanceParameters.find(s => s.id === activeSection)

  const handleEditParameter = (paramKey: string) => {
    const param = currentSection?.parameters.find(p => p.key === paramKey)
    if (param) {
      setEditingParameter(paramKey)
      setParameterValues({
        ...parameterValues,
        [paramKey]: param.currentValue
      })
    }
  }

  const handleSaveParameter = (paramKey: string) => {
    // In real implementation, this would create a governance proposal
    console.log('Creating proposal to update parameter:', paramKey, 'to:', parameterValues[paramKey])
    setEditingParameter(null)
    // Mock success
    alert(`Parameter update proposal created for ${paramKey}`)
  }

  const handleCancelEdit = (paramKey: string) => {
    setEditingParameter(null)
    const param = currentSection?.parameters.find(p => p.key === paramKey)
    if (param) {
      setParameterValues({
        ...parameterValues,
        [paramKey]: param.currentValue
      })
    }
  }

  const formatValue = (param: Parameter, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    
    switch (param.type) {
      case 'percentage':
        return `${numValue}${param.unit || '%'}`
      case 'duration':
        return `${numValue} ${param.unit || 'days'}`
      case 'number':
        return `${numValue} ${param.unit || ''}`
      default:
        return value.toString()
    }
  }

  const getParameterStatus = (param: Parameter) => {
    if (param.proposedValue !== undefined) {
      return 'pending'
    }
    return 'active'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardContent className="pt-6">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-4">
                  Please connect your wallet to access governance administration
                </p>
                <Button asChild>
                  <Link href="/auth">Connect Wallet</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!hasAdminAccess) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardContent className="pt-6">
                <Lock className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                <p className="text-muted-foreground mb-4">
                  You don't have permission to access governance administration features.
                </p>
                <Button asChild variant="outline">
                  <Link href="/governance">Return to Governance</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Governance Administration</h1>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                DAO Ops v1.0
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Manage governance parameters and system settings. Parameter changes require governance proposals.
            </p>
          </div>

          {/* Access Status */}
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Unlock className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Admin Access Granted</h3>
                  <p className="text-sm text-green-800">
                    You have administrative access to governance settings. Changes require community approval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Navigation Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Parameter Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {governanceParameters.map((section) => {
                    const Icon = section.icon
                    const isActive = activeSection === section.id
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{section.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {section.parameters.length} parameters
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Proposals</span>
                    <Badge variant="outline">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Changes</span>
                    <Badge variant="outline">1</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Update</span>
                    <span className="text-xs text-muted-foreground">2 days ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {currentSection && (
                <>
                  {/* Section Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <currentSection.icon className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle>{currentSection.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {currentSection.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Parameters List */}
                  <div className="space-y-4">
                    {currentSection.parameters.map((param) => {
                      const isEditing = editingParameter === param.key
                      const status = getParameterStatus(param)
                      
                      return (
                        <Card key={param.key} className="relative">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold">{param.label}</h3>
                                  <Badge className={getStatusColor(status)}>
                                    {status}
                                  </Badge>
                                  {param.requiresProposal && (
                                    <Badge variant="outline" className="text-xs">
                                      Requires Proposal
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {param.description}
                                </p>
                              </div>
                              
                              {!isEditing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditParameter(param.key)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            {isEditing ? (
                              <div className="space-y-4">
                                <div>
                                  <Label>New Value</Label>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Input
                                      type="number"
                                      value={parameterValues[param.key] || ''}
                                      onChange={(e) => setParameterValues({
                                        ...parameterValues,
                                        [param.key]: e.target.value
                                      })}
                                      min={param.min}
                                      max={param.max}
                                      step={param.type === 'percentage' ? 0.1 : 1}
                                      className="flex-1"
                                    />
                                    {param.unit && (
                                      <span className="text-sm text-muted-foreground">
                                        {param.unit}
                                      </span>
                                    )}
                                  </div>
                                  {param.min !== undefined && param.max !== undefined && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Range: {param.min} - {param.max} {param.unit}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveParameter(param.key)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Create Proposal
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelEdit(param.key)}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                                
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                      <p className="font-medium mb-1">Governance Proposal Required</p>
                                      <p>
                                        This change will create a governance proposal that requires community voting.
                                        The change will only take effect if the proposal passes.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <Label className="text-sm font-medium">Current Value</Label>
                                  <div className="text-2xl font-bold text-blue-600 mt-1">
                                    {formatValue(param, param.currentValue)}
                                  </div>
                                </div>
                                
                                {param.proposedValue !== undefined && (
                                  <div>
                                    <Label className="text-sm font-medium">Proposed Value</Label>
                                    <div className="text-2xl font-bold text-orange-600 mt-1">
                                      {formatValue(param, param.proposedValue)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Pending governance vote
                                    </p>
                                  </div>
                                )}
                                
                                {param.lastUpdated && (
                                  <div>
                                    <Label className="text-sm font-medium">Last Updated</Label>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {new Date(param.lastUpdated).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}