'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye,
  FileText,
  Calendar,
  User,
  MapPin,
  Hash,
  Coins,
  MessageSquare,
  Download,
  ExternalLink
} from 'lucide-react';
import { useMintRequests, useUpdateMintRequest } from '@/hooks/use-mint-requests';
import { ErrorBoundary, SimpleErrorFallback } from '@/components/ui/error-boundary';
import { LoadingState, CardSkeleton, LoadingButton } from '@/components/ui/loading-states';
import { AccessDeniedEmpty, VerificationQueueEmpty } from '@/components/ui/empty-states';
import { parseApiError, getErrorMessage } from '@/lib/error-handling';
import type { MintRequest } from '@/types/api';

interface VerificationQueueProps {
  userRoles?: string[];
}

export function VerificationQueue({ userRoles = [] }: VerificationQueueProps) {
  const [selectedRequest, setSelectedRequest] = useState<MintRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { mintRequests, isLoading, error, refetch } = useMintRequests({
    status: statusFilter || undefined,
    limit: 100
  });

  const { updateMintRequest, isLoading: isUpdating } = useUpdateMintRequest();

  // Check if user has verifier permissions
  const canVerify = userRoles.includes('VERIFIER') || userRoles.includes('PLATFORM_ADMIN');

  const handleAction = (action: 'approve' | 'reject', request: MintRequest) => {
    setSelectedRequest(request);
    setPendingAction(action);
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !pendingAction) return;
    
    setActionError(null);

    try {
      await updateMintRequest(selectedRequest.id, {
        status: pendingAction === 'approve' ? 'APPROVED' : 'REJECTED',
        approvalNotes: approvalNotes || `${pendingAction === 'approve' ? 'Approved' : 'Rejected'} by verifier`
      });
      
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setPendingAction(null);
      setApprovalNotes('');
      refetch();
    } catch (err) {
      const error = parseApiError(err);
      setActionError(getErrorMessage(error));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'MINTING': return <Coins className="h-4 w-4 text-blue-600" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'MINTING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!canVerify) {
    return (
      <AccessDeniedEmpty 
        title="Verifier Access Required"
        requiredRole="VERIFIER or PLATFORM_ADMIN"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <SimpleErrorFallback 
        error={parseApiError(error)}
        resetError={refetch}
        title="Failed to load verification queue"
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('PENDING')}
            >
              Pending Review
            </Button>
            <Button
              variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('APPROVED')}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('REJECTED')}
            >
              Rejected
            </Button>
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('')}
            >
              All
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            {(mintRequests || []).length} request{(mintRequests || []).length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Request List */}
      <div className="space-y-4">
        {(mintRequests || []).length === 0 ? (
          <VerificationQueueEmpty statusFilter={statusFilter} />
        ) : (
          (mintRequests || []).map((request) => (
            <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.title || `Mint Request #${request.id.slice(0, 8)}`}
                      </h3>
                      <Badge className={`${getStatusColor(request.status)} border`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </div>
                      </Badge>
                    </div>
                    
                    {request.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {request.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Project:</span>
                    <div className="font-medium">Project #{request.projectId}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <div className="font-medium flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {request.amount} LU
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Token ID:</span>
                    <div className="font-medium font-mono">{request.tokenId}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Recipient:</span>
                    <div className="font-medium font-mono text-xs">
                      {request.recipient.slice(0, 8)}...{request.recipient.slice(-6)}
                    </div>
                  </div>
                </div>

                {/* Verification Data */}
                {request.verificationData && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Evidence Submitted
                    </h4>
                    <div className="text-sm space-y-2">
                      {Object.entries(request.verificationData).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium">
                            {typeof value === 'string' && value.startsWith('http') ? (
                              <a 
                                href={value} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                View Document <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              String(value)
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  
                  {request.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('reject', request)}
                        disabled={isUpdating}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <LoadingButton
                        size="sm"
                        onClick={() => handleAction('approve', request)}
                        isLoading={isUpdating}
                        loadingText="Approving..."
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </LoadingButton>
                    </div>
                  )}
                </div>

                {/* Approval Notes */}
                {request.approvalNotes && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-blue-900">Verifier Notes</div>
                        <div className="text-sm text-blue-800">{request.approvalNotes}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {pendingAction === 'approve' ? 'Approve' : 'Reject'} Mint Request
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRequest.title || `Request #${selectedRequest.id.slice(0, 8)}`}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {pendingAction === 'approve' ? 'Approval' : 'Rejection'} Notes
                </label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={`Provide details about your ${pendingAction === 'approve' ? 'approval' : 'rejection'}...`}
                  rows={3}
                />
              </div>

              {actionError && (
                <SimpleErrorFallback 
                  error={{ message: actionError } as any}
                  resetError={() => setActionError(null)}
                  title={`${pendingAction === 'approve' ? 'Approval' : 'Rejection'} Failed`}
                  className="mb-4"
                />
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setActionError(null);
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <LoadingButton
                  className={`flex-1 ${
                    pendingAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                  onClick={confirmAction}
                  isLoading={isUpdating}
                  loadingText={pendingAction === 'approve' ? 'Approving...' : 'Rejecting...'}
                >
                  {pendingAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </LoadingButton>
              </div>
            </div>
          </Card>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}