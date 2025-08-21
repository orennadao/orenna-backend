'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  useVerificationStatus, 
  useVerificationMethods, 
  useSubmitVerification,
  useBatchStatus,
  type VerificationResult,
  type VerificationMethod 
} from '@orenna/api-client'
import { VerificationStatusCard } from '../../components/verification/verification-status-card'
import { VerificationMethodsList } from '../../components/verification/verification-methods-list'
import { BatchVerificationPanel } from '../../components/verification/batch-verification-panel'
import { SubmitVerificationDialog } from '../../components/verification/submit-verification-dialog'

export function VerificationPageClient() {
  const [selectedLiftTokenId, setSelectedLiftTokenId] = useState<number>(1)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showBatchPanel, setShowBatchPanel] = useState(false)

  // Fetch verification data
  const { data: verificationStatus, isLoading: statusLoading, error: statusError } = 
    useVerificationStatus(selectedLiftTokenId)
  const { data: methods, isLoading: methodsLoading } = useVerificationMethods({ active: true })

  const submitVerification = useSubmitVerification()

  const handleSubmitVerification = async (data: any) => {
    try {
      await submitVerification.mutateAsync({
        liftTokenId: selectedLiftTokenId,
        ...data,
      })
      setShowSubmitDialog(false)
    } catch (error) {
      console.error('Failed to submit verification:', error)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verification Dashboard</h1>
          <p className="text-muted-foreground">
            Manage lift token verifications and monitor VWBA compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowBatchPanel(true)}
          >
            Batch Operations
          </Button>
          <Button onClick={() => setShowSubmitDialog(true)}>
            Submit Verification
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Verifications
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              ✓
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {verificationStatus?.results?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Tokens
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              🏆
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {verificationStatus?.results?.filter(r => r.verified).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              ⏳
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {verificationStatus?.pending?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting validation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Methods
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              🔧
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {methods?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active methodologies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Lift Token</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label htmlFor="tokenId" className="text-sm font-medium">
              Lift Token ID:
            </label>
            <input
              id="tokenId"
              type="number"
              value={selectedLiftTokenId}
              onChange={(e) => setSelectedLiftTokenId(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-md w-32"
              min="1"
            />
            <span className="text-sm text-muted-foreground">
              Change to view different token's verification status
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Status */}
        <div className="space-y-6">
          <VerificationStatusCard
            liftTokenId={selectedLiftTokenId}
            verificationStatus={verificationStatus}
            isLoading={statusLoading}
            error={statusError}
          />
        </div>

        {/* Available Methods */}
        <div className="space-y-6">
          <VerificationMethodsList
            methods={methods}
            isLoading={methodsLoading}
            onSelectMethod={(method) => {
              setShowSubmitDialog(true)
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verification Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading verification history...
            </div>
          ) : verificationStatus?.results?.length ? (
            <div className="space-y-4">
              {verificationStatus.results
                .sort((a, b) => new Date(b.verificationDate).getTime() - new Date(a.verificationDate).getTime())
                .slice(0, 5)
                .map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        result.verified ? 'bg-green-500' : 
                        result.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{result.verificationMethod?.name || result.methodId}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.verificationDate).toLocaleDateString()} • 
                          Validator: {result.validatorName || result.validatorAddress?.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        result.verified ? 'text-green-600' : 
                        result.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.status}
                      </p>
                      {result.confidenceScore && (
                        <p className="text-xs text-muted-foreground">
                          {(result.confidenceScore * 100).toFixed(1)}% confidence
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No verification activity found for this token
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SubmitVerificationDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        methods={methods || []}
        onSubmit={handleSubmitVerification}
        isSubmitting={submitVerification.isPending}
      />

      <BatchVerificationPanel
        open={showBatchPanel}
        onOpenChange={setShowBatchPanel}
      />
    </div>
  )
}