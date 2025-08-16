'use client'

import { useState, useEffect } from 'react'
import { useIndexerStatus } from '@/hooks/use-indexer'
import { useIndexerEvents } from '@/components/providers/websocket-provider'

export function IndexerStatus() {
  const { status, isLoading, error, refetch } = useIndexerStatus()
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([])
  const indexerEvents = useIndexerEvents()

  // Subscribe to real-time indexer events
  useEffect(() => {
    const unsubscribers = [
      indexerEvents.onEventIndexed((data) => {
        setRealtimeEvents(prev => [`New ${data.eventName} event indexed on chain ${data.chainId}`, ...prev].slice(0, 5))
        refetch()
      }),
      indexerEvents.onEventProcessed((data) => {
        setRealtimeEvents(prev => [`${data.eventName} event processed on chain ${data.chainId}`, ...prev].slice(0, 5))
        refetch()
      }),
      indexerEvents.onEventError((data) => {
        setRealtimeEvents(prev => [`Error processing ${data.eventName} on chain ${data.chainId}: ${data.error?.slice(0, 50)}...`, ...prev].slice(0, 5))
        refetch()
      }),
      indexerEvents.onProceedsReceived((data) => {
        setRealtimeEvents(prev => [`Proceeds received event detected`, ...prev].slice(0, 5))
        refetch()
      }),
      indexerEvents.onUnitsSold((data) => {
        setRealtimeEvents(prev => [`Units sold event detected`, ...prev].slice(0, 5))
        refetch()
      })
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [refetch, indexerEvents])

  // Clear realtime events after a delay
  useEffect(() => {
    if (realtimeEvents.length > 0) {
      const timeout = setTimeout(() => {
        setRealtimeEvents([])
      }, 15000) // Clear after 15 seconds

      return () => clearTimeout(timeout)
    }
  }, [realtimeEvents])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading indexer status: {error}</p>
        <button
          onClick={refetch}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Real-time Events */}
      {realtimeEvents.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">Real-time Indexer Events</h3>
            <button
              onClick={() => setRealtimeEvents([])}
              className="text-green-600 hover:text-green-800 text-xs"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-1">
            {realtimeEvents.map((event, index) => (
              <li key={index} className="text-sm text-green-700 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                {event}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Indexer Status</h2>
          <button
            onClick={refetch}
            className="text-primary-600 hover:text-primary-800 text-sm"
          >
            Refresh
          </button>
        </div>

        {status.length === 0 ? (
          <p className="text-gray-500">No indexers configured</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {status.map((indexer) => (
              <div
                key={indexer.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {indexer.indexerType}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Chain {indexer.chainId}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        indexer.isActive ? 'bg-green-400' : 'bg-red-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        indexer.isActive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {indexer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Contract:</span>
                    <span className="text-gray-900 font-mono">
                      {indexer.contractAddress.slice(0, 6)}...{indexer.contractAddress.slice(-4)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Block:</span>
                    <span className="text-gray-900">
                      #{indexer.lastBlockNumber.toLocaleString()}
                    </span>
                  </div>

                  {indexer.lastSyncAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Sync:</span>
                      <span className="text-gray-900">
                        {new Date(indexer.lastSyncAt).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {indexer.errorCount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Errors:</span>
                      <span className="text-red-600">
                        {indexer.errorCount}
                      </span>
                    </div>
                  )}

                  {indexer.lastError && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600 truncate" title={indexer.lastError}>
                        {indexer.lastError}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Indexers</h3>
          <p className="text-2xl font-bold text-gray-900">{status.length}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active</h3>
          <p className="text-2xl font-bold text-green-600">
            {status.filter(s => s.isActive).length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">With Errors</h3>
          <p className="text-2xl font-bold text-red-600">
            {status.filter(s => s.errorCount > 0).length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Block</h3>
          <p className="text-2xl font-bold text-gray-900">
            {status.length > 0 
              ? Math.round(status.reduce((sum, s) => sum + s.lastBlockNumber, 0) / status.length).toLocaleString()
              : '0'
            }
          </p>
        </div>
      </div>
    </div>
  )
}