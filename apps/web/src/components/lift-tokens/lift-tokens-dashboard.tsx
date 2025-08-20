'use client'

import { useState } from 'react'
import { useLiftTokens } from '@/hooks/use-lift-tokens'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ErrorBoundary, SimpleErrorFallback } from '@/components/ui/error-boundary'
import { LoadingState, CardSkeleton } from '@/components/ui/loading-states'
import { NoLiftTokensEmpty } from '@/components/ui/empty-states'
import { parseApiError } from '@/lib/error-handling'
import Link from 'next/link'
import type { LiftToken } from '@/types/api'

export function LiftTokensDashboard() {
  const [filters, setFilters] = useState({
    status: '',
    projectId: undefined as number | undefined,
    limit: 50,
    offset: 0
  })

  const { liftTokens, total, isLoading, error, refetch } = useLiftTokens(filters)

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }))
  }

  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({ ...prev, offset: newOffset }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ISSUED': return 'bg-green-100 text-green-800'
      case 'CREATED': return 'bg-blue-100 text-blue-800'
      case 'RETIRED': return 'bg-gray-100 text-gray-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (error) {
    return (
      <SimpleErrorFallback 
        error={parseApiError(error)}
        resetError={refetch}
        title="Failed to load lift tokens"
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header removed - now handled by MainLayout */}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CREATED">Created</option>
              <option value="ISSUED">Issued</option>
              <option value="RETIRED">Retired</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project ID
            </label>
            <Input
              type="number"
              placeholder="Enter project ID"
              value={filters.projectId || ''}
              onChange={(e) => handleFilterChange('projectId', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Results per page
            </label>
            <Select
              value={filters.limit.toString()}
              onValueChange={(value) => handleFilterChange('limit', Number(value))}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={refetch} variant="outline" className="w-full">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-600">Total Tokens</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {liftTokens.filter(t => t.status === 'ISSUED').length}
          </div>
          <div className="text-sm text-gray-600">Issued</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {liftTokens.filter(t => t.status === 'CREATED').length}
          </div>
          <div className="text-sm text-gray-600">Created</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-600">
            {liftTokens.filter(t => t.status === 'RETIRED').length}
          </div>
          <div className="text-sm text-gray-600">Retired</div>
        </Card>
      </div>

      {/* Lift Tokens List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingState title="Loading lift tokens..." />
        ) : liftTokens.length === 0 ? (
          <NoLiftTokensEmpty />
        ) : (
          liftTokens.map((token: LiftToken) => (
            <Card key={token.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link 
                    href={`/lift-tokens/${token.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                  >
                    Lift Token #{token.tokenId || token.id}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(token.status)}>
                      {token.status}
                    </Badge>
                    {token.project && (
                      <Link 
                        href={`/projects/${token.project.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {token.project.name}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {token.quantity && (
                    <div className="text-lg font-semibold text-gray-900">
                      {token.quantity} {token.unit || 'LU'}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Created: {new Date(token.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Token ID:</span>
                  <div className="font-medium">{token.tokenId || 'Not set'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Chain:</span>
                  <div className="font-medium">{token.chainId || 'Not set'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Issued:</span>
                  <div className="font-medium">
                    {token.issuedAt ? new Date(token.issuedAt).toLocaleDateString() : 'Not issued'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">External ID:</span>
                  <div className="font-medium">{token.externalId || 'None'}</div>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Link href={`/lift-tokens/${token.id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
                {token.status === 'ISSUED' && (
                  <Button variant="outline" size="sm">Retire Token</Button>
                )}
                {token.status === 'ISSUED' && (
                  <Button variant="outline" size="sm">Transfer</Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > filters.limit && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, total)} of {total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.offset === 0}
              onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.offset + filters.limit >= total}
              onClick={() => handlePageChange(filters.offset + filters.limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  )
}