'use client';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@orenna/ui';
import { type VerificationStatus } from '@orenna/api-client';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface VerificationStatusCardProps {
  liftTokenId: number;
  verificationStatus?: VerificationStatus;
  isLoading: boolean;
  error: any;
}

export function VerificationStatusCard({ 
  liftTokenId, 
  verificationStatus, 
  isLoading, 
  error 
}: VerificationStatusCardProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Verification Status - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Failed to load verification status: {error.message}
          </p>
          <Button variant="outline" size="sm" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Verification Status - Token #{liftTokenId}</span>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        ) : verificationStatus ? (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
              {verificationStatus.verified ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">Verified</p>
                    <p className="text-sm text-muted-foreground">
                      This lift token has been successfully verified
                    </p>
                  </div>
                </>
              ) : verificationStatus.pending.length > 0 ? (
                <>
                  <Clock className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-700">Pending Review</p>
                    <p className="text-sm text-muted-foreground">
                      {verificationStatus.pending.length} verification(s) pending
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Not Verified</p>
                    <p className="text-sm text-muted-foreground">
                      No successful verifications found
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Verification Results */}
            {verificationStatus.results.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Verification History</h4>
                <div className="space-y-3">
                  {verificationStatus.results.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.status === 'VERIFIED' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {result.status === 'PENDING' && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          {result.status === 'IN_REVIEW' && (
                            <RefreshCw className="h-4 w-4 text-blue-500" />
                          )}
                          {result.status === 'REJECTED' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {result.verificationMethod?.name || result.methodId}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          result.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                          result.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          result.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Submitted: {new Date(result.verificationDate).toLocaleDateString()}
                        </p>
                        <p>
                          Validator: {result.validatorName || `${result.validatorAddress.slice(0, 8)}...`}
                        </p>
                        {result.confidenceScore && (
                          <p>
                            Confidence: {(result.confidenceScore * 100).toFixed(1)}%
                          </p>
                        )}
                        {result.evidenceFiles && result.evidenceFiles.length > 0 && (
                          <p>
                            Evidence: {result.evidenceFiles.length} file(s)
                          </p>
                        )}
                        {result.notes && (
                          <p className="mt-2 text-xs">
                            Notes: {result.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Verifications */}
            {verificationStatus.pending.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Pending Verifications</h4>
                <div className="space-y-3">
                  {verificationStatus.pending.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">
                          {result.verificationMethod?.name || result.methodId}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted {new Date(result.verificationDate).toLocaleDateString()} • 
                        Processing...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              {!verificationStatus.verified && (
                <Button size="sm">
                  Submit New Verification
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No verification data available</p>
            <p className="text-sm">Check that the lift token ID is correct</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}