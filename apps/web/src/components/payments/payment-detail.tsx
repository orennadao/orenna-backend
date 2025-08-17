'use client'

import { usePayment } from '@/hooks/use-payments'
import type { PaymentStatus } from '@/types/api'

interface PaymentDetailProps {
  paymentId: string
}

export function PaymentDetail({ paymentId }: PaymentDetailProps) {
  const { payment, isLoading, error, refetch } = usePayment(paymentId)

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'CONFIRMED':
      case 'DISTRIBUTED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
      case 'IN_ESCROW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED':
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatAmount = (amount: string, token: string) => {
    const tokenName = token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Token'
    const value = BigInt(amount) / BigInt(10 ** 18) // Assuming 18 decimals
    return `${value.toString()} ${tokenName}`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
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
        <p className="text-red-800">Error loading payment: {error}</p>
        <button
          onClick={refetch}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-800">Payment not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-gray-600 font-mono">{payment.id}</p>
          </div>
          <div className={`px-3 py-1 rounded-full border ${getStatusColor(payment.status)}`}>
            <span className="text-sm font-medium">{payment.status}</span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="text-sm text-gray-900">{payment.paymentType.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="text-sm text-gray-900">{formatAmount(payment.amount, payment.paymentToken)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Chain ID</dt>
              <dd className="text-sm text-gray-900">{payment.chainId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">{new Date(payment.createdAt).toLocaleString()}</dd>
            </div>
            {payment.confirmedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Confirmed</dt>
                <dd className="text-sm text-gray-900">{new Date(payment.confirmedAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Addresses</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Payer</dt>
              <dd className="text-sm text-gray-900 font-mono">{formatAddress(payment.payerAddress)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Recipient</dt>
              <dd className="text-sm text-gray-900 font-mono">{formatAddress(payment.recipientAddress)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Payment Token</dt>
              <dd className="text-sm text-gray-900 font-mono">{formatAddress(payment.paymentToken)}</dd>
            </div>
            {payment.txHash && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Transaction</dt>
                <dd className="text-sm text-gray-900">
                  <a
                    href={`https://etherscan.io/tx/${payment.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 font-mono"
                  >
                    {formatAddress(payment.txHash)}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Project Information */}
      {payment.project && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project</h2>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{payment.project.name}</h3>
              <p className="text-sm text-gray-600">ID: {payment.project.id}</p>
              <p className="text-sm text-gray-600">Slug: {payment.project.slug}</p>
            </div>
            <a
              href={`/projects/${payment.project.id}`}
              className="text-primary-600 hover:text-primary-800 text-sm"
            >
              View Project
            </a>
          </div>
        </div>
      )}

      {/* Description */}
      {payment.description && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <p className="text-gray-700">{payment.description}</p>
        </div>
      )}

      {/* Payment Events */}
      {payment.events && payment.events.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Events</h2>
          <div className="space-y-4">
            {payment.events.map((event) => (
              <div key={event.id} className="border-l-4 border-primary-200 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{event.type}</h4>
                    {event.notes && (
                      <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                    )}
                    {event.amount && (
                      <p className="text-sm text-gray-600 mt-1">
                        Amount: {formatAmount(event.amount, payment.paymentToken)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                    {event.txHash && (
                      <a
                        href={`https://etherscan.io/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        View Tx
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}