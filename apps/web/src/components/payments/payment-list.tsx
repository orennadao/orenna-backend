'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePayments } from '@/hooks/use-payments'
import { usePaymentEvents } from '@/components/providers/websocket-provider'
import type { PaymentStatus, PaymentType } from '@/types/api'

interface PaymentListProps {
  projectId?: number
  payerAddress?: string
}

export function PaymentList({ projectId, payerAddress }: PaymentListProps) {
  const [filters, setFilters] = useState({
    status: '',
    paymentType: '',
    limit: 20,
    offset: 0,
  })
  const [realtimeUpdates, setRealtimeUpdates] = useState<string[]>([])

  const { payments, total, isLoading, error, refetch } = usePayments({
    ...filters,
    status: filters.status || undefined,
    paymentType: filters.paymentType || undefined,
    payerAddress,
  })

  const paymentEvents = usePaymentEvents()

  // Memoized event handlers to prevent infinite loops
  const handlePaymentInitiated = useCallback((data: any) => {
    if (!projectId || data.projectId === projectId) {
      setRealtimeUpdates(prev => [`Payment ${data.paymentId} initiated`, ...prev].slice(0, 5))
      refetch()
    }
  }, [projectId, refetch])

  const handlePaymentConfirmed = useCallback((data: any) => {
    if (!projectId || data.projectId === projectId) {
      setRealtimeUpdates(prev => [`Payment ${data.paymentId} confirmed`, ...prev].slice(0, 5))
      refetch()
    }
  }, [projectId, refetch])

  const handlePaymentFailed = useCallback((data: any) => {
    if (!projectId || data.projectId === projectId) {
      setRealtimeUpdates(prev => [`Payment ${data.paymentId} failed`, ...prev].slice(0, 5))
      refetch()
    }
  }, [projectId, refetch])

  const handleProceedsNotified = useCallback((data: any) => {
    if (!projectId || data.projectId === projectId) {
      setRealtimeUpdates(prev => [`Proceeds notified for payment ${data.paymentId}`, ...prev].slice(0, 5))
      refetch()
    }
  }, [projectId, refetch])

  const handleProceedsConfirmed = useCallback((data: any) => {
    if (!projectId || data.projectId === projectId) {
      setRealtimeUpdates(prev => [`Proceeds confirmed for payment ${data.paymentId}`, ...prev].slice(0, 5))
      refetch()
    }
  }, [projectId, refetch])

  const handleUnitsPurchased = useCallback((data: any) => {
    if (!projectId || data.projectId === projectId) {
      setRealtimeUpdates(prev => [`Units purchased in payment ${data.paymentId}`, ...prev].slice(0, 5))
      refetch()
    }
  }, [projectId, refetch])

  // Subscribe to real-time payment events
  useEffect(() => {
    const unsubscribers = [
      paymentEvents.onPaymentInitiated(handlePaymentInitiated),
      paymentEvents.onPaymentConfirmed(handlePaymentConfirmed),
      paymentEvents.onPaymentFailed(handlePaymentFailed),
      paymentEvents.onProceedsNotified(handleProceedsNotified),
      paymentEvents.onProceedsConfirmed(handleProceedsConfirmed),
      paymentEvents.onUnitsPurchased(handleUnitsPurchased)
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [handlePaymentInitiated, handlePaymentConfirmed, handlePaymentFailed, handleProceedsNotified, handleProceedsConfirmed, handleUnitsPurchased, paymentEvents])

  // Clear realtime updates after a delay
  useEffect(() => {
    if (realtimeUpdates.length > 0) {
      const timeout = setTimeout(() => {
        setRealtimeUpdates([])
      }, 10000) // Clear after 10 seconds

      return () => clearTimeout(timeout)
    }
  }, [realtimeUpdates])

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'CONFIRMED':
      case 'DISTRIBUTED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
      case 'IN_ESCROW':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount: string, token: string) => {
    const tokenName = token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Token'
    const value = BigInt(amount) / BigInt(10 ** 18) // Assuming 18 decimals
    return `${value.toString()} ${tokenName}`
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading payments: {error}</p>
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
      {/* Real-time Updates */}
      {realtimeUpdates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">Real-time Updates</h3>
            <button
              onClick={() => setRealtimeUpdates([])}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-1">
            {realtimeUpdates.map((update, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                {update}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, offset: 0 }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_ESCROW">In Escrow</option>
              <option value="DISTRIBUTED">Distributed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              value={filters.paymentType}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentType: e.target.value, offset: 0 }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              <option value="LIFT_TOKEN_PURCHASE">Lift Token Purchase</option>
              <option value="PROJECT_FUNDING">Project Funding</option>
              <option value="REPAYMENT">Repayment</option>
              <option value="PLATFORM_FEE">Platform Fee</option>
              <option value="STEWARD_PAYMENT">Steward Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), offset: 0 }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {payments.length} of {total} payments
        </p>
        <button
          onClick={refetch}
          className="text-primary-600 hover:text-primary-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payments found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(payment.amount, payment.paymentToken)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.project?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a
                        href={`/payments/${payment.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > filters.limit && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
            disabled={filters.offset === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(total / filters.limit)}
          </span>
          
          <button
            onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
            disabled={filters.offset + filters.limit >= total}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}