'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Calendar,
  User,
  MapPin,
  Hash,
  Coins,
  ExternalLink,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react';
import type { MintRequest } from '@/types/api';

interface MintRequestDetailProps {
  request: MintRequest;
  userRoles?: string[];
  onBack?: () => void;
  onApprove?: (notes: string) => Promise<void>;
  onReject?: (notes: string) => Promise<void>;
  isUpdating?: boolean;
}

export function MintRequestDetail({ 
  request, 
  userRoles = [], 
  onBack, 
  onApprove, 
  onReject,
  isUpdating = false 
}: MintRequestDetailProps) {
  const [notes, setNotes] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const canVerify = userRoles.includes('VERIFIER') || userRoles.includes('PLATFORM_ADMIN');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'APPROVED': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'MINTING': return <Coins className="h-5 w-5 text-blue-600" />;
      case 'COMPLETED': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAILED': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
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

  const handleAction = (action: 'approve' | 'reject') => {
    setActionType(action);
    setShowApprovalForm(true);
    setNotes('');
  };

  const submitAction = async () => {
    if (!actionType) return;
    
    try {
      if (actionType === 'approve') {
        await onApprove?.(notes || 'Approved by verifier');
      } else {
        await onReject?.(notes || 'Rejected by verifier');
      }
      setShowApprovalForm(false);
      setActionType(null);
      setNotes('');
    } catch (error) {
      // Error handled by parent component
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {request.title || `Mint Request #${request.id.slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${getStatusColor(request.status)} border`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(request.status)}
                  {request.status}
                </div>
              </Badge>
              <span className="text-sm text-gray-500">
                Created {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canVerify && request.status === 'PENDING' && !showApprovalForm && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleAction('reject')}
              disabled={isUpdating}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleAction('approve')}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {request.description && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{request.description}</p>
            </Card>
          )}

          {/* Verification Data */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evidence & Documentation
            </h2>
            
            {request.verificationData ? (
              <div className="space-y-4">
                {Object.entries(request.verificationData).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="text-sm text-gray-900 max-w-md text-right">
                        {typeof value === 'string' && (value.startsWith('http') || value.startsWith('/')) ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={value} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View Document
                            </a>
                            <Button variant="outline" size="sm" asChild>
                              <a href={value} download>
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        ) : Array.isArray(value) ? (
                          <ul className="space-y-1">
                            {value.map((item, idx) => (
                              <li key={idx} className="text-gray-700">{String(item)}</li>
                            ))}
                          </ul>
                        ) : typeof value === 'object' ? (
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-gray-700">{String(value)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {request.verificationHash && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Verification Hash:</span>
                      <code className="text-xs bg-white px-2 py-1 rounded border">
                        {request.verificationHash}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No verification data submitted</p>
              </div>
            )}
          </Card>

          {/* Approval Notes */}
          {request.approvalNotes && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Verifier Notes
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-900">{request.approvalNotes}</p>
                {request.reviewedBy && (
                  <div className="mt-2 text-sm text-blue-700">
                    Reviewed by: {request.reviewedBy.slice(0, 8)}...{request.reviewedBy.slice(-6)}
                  </div>
                )}
                {request.reviewedAt && (
                  <div className="text-sm text-blue-700">
                    {new Date(request.reviewedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Request Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Project:</span>
                <span className="font-medium">#{request.projectId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token ID:</span>
                <span className="font-mono">{request.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {request.amount} LU
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-600">Recipient:</span>
                <code className="text-xs bg-gray-100 p-2 rounded break-all">
                  {request.recipient}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span>{new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          {/* Blockchain Info */}
          {(request.txHash || request.blockNumber) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Blockchain</h3>
              <div className="space-y-3 text-sm">
                {request.txHash && (
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600">Transaction:</span>
                    <code className="text-xs bg-gray-100 p-2 rounded break-all">
                      {request.txHash}
                    </code>
                  </div>
                )}
                {request.blockNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Block:</span>
                    <span className="font-mono">{request.blockNumber}</span>
                  </div>
                )}
                {request.executedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Executed:</span>
                    <span>{new Date(request.executedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Approval Form */}
      {showApprovalForm && (
        <Card className="p-6 border-2 border-blue-200 bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">
            {actionType === 'approve' ? 'Approve' : 'Reject'} Mint Request
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'approve' ? 'Approval' : 'Rejection'} Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Provide details about your ${actionType}...`}
                rows={4}
                className="bg-white"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowApprovalForm(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={submitAction}
                disabled={isUpdating}
                className={
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }
              >
                {isUpdating ? 'Processing...' : 
                  actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'
                }
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}