'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useGovernanceDelegation, useGovernanceUtils } from '@/hooks/use-governance'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { User, Users, ArrowRight, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface DelegationPanelProps {
  currentDelegate: string | null
  userAddress: string
  tokenBalance: string
  votingPower: string
  chainId?: number
  className?: string
}

export function DelegationPanel({
  currentDelegate,
  userAddress,
  tokenBalance,
  votingPower,
  chainId = 1,
  className,
}: DelegationPanelProps) {
  const [delegatee, setDelegatee] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const { address } = useAccount()
  const { delegateVotes, selfDelegate, isDelegating } = useGovernanceDelegation(chainId)
  const { formatTokenAmount } = useGovernanceUtils()

  // Check if currently self-delegated
  const isSelfDelegated = currentDelegate?.toLowerCase() === userAddress.toLowerCase()
  
  // Check if delegated to someone else
  const isDelegatedToOther = currentDelegate && !isSelfDelegated

  const handleDelegate = async () => {
    if (!delegatee.trim()) {
      toast.error('Please enter a valid address')
      return
    }

    if (!isAddress(delegatee)) {
      toast.error('Please enter a valid Ethereum address')
      return
    }

    try {
      await delegateVotes(delegatee)
      setDelegatee('')
      toast.success('Delegation updated successfully!')
    } catch (error) {
      console.error('Failed to delegate:', error)
      toast.error('Failed to update delegation. Please try again.')
    }
  }

  const handleSelfDelegate = async () => {
    try {
      await selfDelegate()
      toast.success('Now self-delegating your voting power!')
    } catch (error) {
      console.error('Failed to self-delegate:', error)
      toast.error('Failed to self-delegate. Please try again.')
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Vote Delegation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Delegate your voting power to participate in governance
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Token Balance</div>
              <div className="font-medium">{formatTokenAmount(tokenBalance)} ORNA</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Voting Power</div>
              <div className="font-medium">{formatTokenAmount(votingPower)} ORNA</div>
            </div>
          </div>

          {/* Current Delegation Status */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Current Delegation</h4>
              {currentDelegate && (
                <Badge className={isSelfDelegated ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                  {isSelfDelegated ? 'Self-Delegated' : 'Delegated'}
                </Badge>
              )}
            </div>
            
            {!currentDelegate && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Not delegated - you cannot vote yet</span>
              </div>
            )}
            
            {isSelfDelegated && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Self-delegated - you can vote directly</span>
              </div>
            )}
            
            {isDelegatedToOther && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-600">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Delegated to: {formatAddress(currentDelegate!)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your voting power is being used by this delegate
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Actions</Label>
          
          <div className="grid gap-2">
            {!isSelfDelegated && (
              <Button
                onClick={handleSelfDelegate}
                disabled={isDelegating}
                variant="default"
                className="justify-start"
              >
                {isDelegating ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                Delegate to Myself
              </Button>
            )}
            
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              className="justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Delegate to Someone Else
            </Button>
          </div>
        </div>

        {/* Advanced Delegation */}
        {showAdvanced && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="delegatee">Delegate Address</Label>
              <Input
                id="delegatee"
                placeholder="0x..."
                value={delegatee}
                onChange={(e) => setDelegatee(e.target.value)}
                disabled={isDelegating}
              />
              <p className="text-xs text-muted-foreground">
                Enter the Ethereum address you want to delegate your voting power to
              </p>
            </div>
            
            {delegatee && isAddress(delegatee) && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <h4 className="font-medium text-blue-900 mb-1">Delegation Preview</h4>
                <div className="space-y-1 text-blue-800">
                  <div className="flex items-center gap-2">
                    <span>From: {formatAddress(userAddress)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>To: {formatAddress(delegatee)}</span>
                  </div>
                  <div>Voting Power: {formatTokenAmount(tokenBalance)} ORNA</div>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleDelegate}
              disabled={!delegatee || !isAddress(delegatee) || isDelegating}
              className="w-full"
            >
              {isDelegating ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Updating Delegation...
                </>
              ) : (
                'Update Delegation'
              )}
            </Button>
          </div>
        )}

        {/* Information */}
        <div className="bg-yellow-50 p-4 rounded-lg text-sm">
          <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
          <ul className="space-y-1 text-yellow-800 text-xs">
            <li>• You must delegate your tokens to participate in governance</li>
            <li>• Delegation gives voting power, not token ownership</li>
            <li>• You can change your delegation at any time</li>
            <li>• Self-delegation allows you to vote directly</li>
            <li>• Your tokens remain in your wallet when delegated</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}