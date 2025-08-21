'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GovernanceParams {
  version: string
  votingPeriodDays: number
  treasuryMajorThresholdUSD: number
  proposalDepositUSDC: number
  quorum: {
    standard: number
    major: number
    emergency: number
  }
  approval: {
    standard: number
    major: number
    emergency: number
  }
  sponsorship: {
    standard: {
      pct: number
      wallets: number
      perWalletMinPct: number
    }
    major: {
      pct: number
      wallets: number
      perWalletMinPct: number
    }
    emergency: {
      pct: number
      wallets: number
    }
  }
  timelockHours: {
    standard: number
    major: number
    emergency: number
  }
}

interface GovParamTableProps {
  params: GovernanceParams
}

export function GovParamTable({ params }: GovParamTableProps) {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance Parameters</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{params.version}</Badge>
          <span className="text-sm text-muted-foreground">
            Current policy parameters
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Parameter</th>
                <th className="text-center py-2 font-medium">Standard</th>
                <th className="text-center py-2 font-medium">Major</th>
                <th className="text-center py-2 font-medium">Emergency</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b">
                <td className="py-3 font-medium">Quorum Required</td>
                <td className="text-center py-3">{formatPercentage(params.quorum.standard)}</td>
                <td className="text-center py-3">{formatPercentage(params.quorum.major)}</td>
                <td className="text-center py-3">{formatPercentage(params.quorum.emergency)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">Approval Threshold</td>
                <td className="text-center py-3">{formatPercentage(params.approval.standard)}</td>
                <td className="text-center py-3">{formatPercentage(params.approval.major)}</td>
                <td className="text-center py-3">{formatPercentage(params.approval.emergency)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">Sponsorship Required</td>
                <td className="text-center py-3">
                  <div>
                    <div>{formatPercentage(params.sponsorship.standard.pct)}</div>
                    <div className="text-xs text-muted-foreground">
                      {params.sponsorship.standard.wallets} wallets min
                    </div>
                  </div>
                </td>
                <td className="text-center py-3">
                  <div>
                    <div>{formatPercentage(params.sponsorship.major.pct)}</div>
                    <div className="text-xs text-muted-foreground">
                      {params.sponsorship.major.wallets} wallets min
                    </div>
                  </div>
                </td>
                <td className="text-center py-3">
                  <div>
                    <div>{formatPercentage(params.sponsorship.emergency.pct)}</div>
                    <div className="text-xs text-muted-foreground">
                      {params.sponsorship.emergency.wallets} wallets min
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">Timelock Period</td>
                <td className="text-center py-3">{params.timelockHours.standard}h</td>
                <td className="text-center py-3">{params.timelockHours.major}h</td>
                <td className="text-center py-3">{params.timelockHours.emergency}h</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">Voting Period:</span>
            <span>{params.votingPeriodDays} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Proposal Deposit:</span>
            <span>{params.proposalDepositUSDC} USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Treasury Major Threshold:</span>
            <span>{formatCurrency(params.treasuryMajorThresholdUSD)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}