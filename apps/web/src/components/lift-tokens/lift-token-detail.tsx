'use client'

import { useState } from 'react'
import { useLiftToken } from '@/hooks/use-lift-tokens'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface LiftTokenDetailProps {
  liftTokenId: number
}

export function LiftTokenDetail({ liftTokenId }: LiftTokenDetailProps) {
  const { liftToken, isLoading, error, refetch } = useLiftToken(liftTokenId)
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ISSUED': return 'bg-green-100 text-green-800'
      case 'CREATED': return 'bg-blue-100 text-blue-800'
      case 'RETIRED': return 'bg-gray-100 text-gray-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading lift token...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading lift token: {error}</p>
        <Button onClick={refetch} className="mt-2">Retry</Button>
      </div>
    )
  }

  if (!liftToken) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Lift token not found</p>
        <Link href="/lift-tokens">
          <Button className="mt-2">Back to Lift Tokens</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/lift-tokens">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lift Tokens
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Lift Token #{liftToken.tokenId || liftToken.id}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(liftToken.status)}>
              {liftToken.status}
            </Badge>
            {liftToken.project && (
              <Link 
                href={`/projects/${liftToken.project.id}`}
                className="text-blue-600 hover:underline"
              >
                {liftToken.project.name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {liftToken.status === 'CREATED' && (
            <Button>Issue Token</Button>
          )}
          {liftToken.status === 'ISSUED' && (
            <Button variant="outline">Retire Token</Button>
          )}
          <Button variant="outline">Verify</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'events', label: 'Events' },
            { id: 'verification', label: 'Verification' },
            { id: 'blockchain', label: 'Blockchain' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Token ID</span>
                  <div className="font-medium">{liftToken.tokenId || 'Not set'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">External ID</span>
                  <div className="font-medium">{liftToken.externalId || 'None'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Quantity</span>
                  <div className="font-medium">
                    {liftToken.quantity ? `${liftToken.quantity} ${liftToken.unit || 'LU'}` : 'Not set'}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="font-medium">
                    <Badge className={getStatusColor(liftToken.status)}>
                      {liftToken.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Created</span>
                  <div className="font-medium">
                    {new Date(liftToken.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Updated</span>
                  <div className="font-medium">
                    {new Date(liftToken.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {liftToken.issuedAt && (
                <div>
                  <span className="text-sm text-gray-600">Issued At</span>
                  <div className="font-medium">
                    {new Date(liftToken.issuedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {liftToken.retiredAt && (
                <div>
                  <span className="text-sm text-gray-600">Retired At</span>
                  <div className="font-medium">
                    {new Date(liftToken.retiredAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Blockchain Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Chain ID</span>
                <div className="font-medium">{liftToken.chainId || 'Not set'}</div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Contract Address</span>
                <div className="font-medium font-mono text-sm">
                  {liftToken.contractAddress || 'Not set'}
                </div>
              </div>

              {liftToken.project && (
                <div>
                  <span className="text-sm text-gray-600">Project</span>
                  <div className="font-medium">
                    <Link 
                      href={`/projects/${liftToken.project.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {liftToken.project.name}
                    </Link>
                  </div>
                </div>
              )}

              {liftToken.mintRequestId && (
                <div>
                  <span className="text-sm text-gray-600">Mint Request</span>
                  <div className="font-medium">
                    <Link 
                      href={`/mint-requests/${liftToken.mintRequestId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {liftToken.mintRequestId}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event History</h3>
          {liftToken.events && liftToken.events.length > 0 ? (
            <div className="space-y-4">
              {liftToken.events.map((event) => (
                <div key={event.id} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{event.type}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(event.eventAt).toLocaleString()}
                      </div>
                      {event.txHash && (
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          Tx: {event.txHash}
                        </div>
                      )}
                    </div>
                    {event.blockNumber && (
                      <div className="text-sm text-gray-500">
                        Block: {event.blockNumber}
                      </div>
                    )}
                  </div>
                  {event.payload && (
                    <div className="mt-2 text-sm text-gray-600">
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No events recorded</p>
          )}
        </Card>
      )}

      {activeTab === 'verification' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Verification features coming soon</p>
            <Button variant="outline">Submit for Verification</Button>
          </div>
        </Card>
      )}

      {activeTab === 'blockchain' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Data</h3>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Blockchain integration coming soon</p>
            <Button variant="outline">Sync from Blockchain</Button>
          </div>
        </Card>
      )}
    </div>
  )
}