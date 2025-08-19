'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

// Types for vendor portal data
interface VendorStatus {
  id: number;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  kycStatus: 'COMPLETED' | 'PENDING' | 'REQUIRED';
  complianceScore: number;
  documentsExpiring: number;
}

interface Invoice {
  id: string;
  contractId: number;
  amount: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  submittedAt?: string;
  description: string;
}

interface Document {
  id: string;
  type: string;
  name: string;
  uploadedAt: string;
  expiresAt?: string;
  verified: boolean;
}

export default function VendorPortal() {
  const [vendor, setVendor] = useState<VendorStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'documents' | 'compliance'>('overview');

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        // Mock data for now - would come from vendor API endpoints
        const mockVendor: VendorStatus = {
          id: 1,
          name: 'Acme Environmental Services',
          status: 'APPROVED',
          kycStatus: 'COMPLETED',
          complianceScore: 92,
          documentsExpiring: 2
        };

        const mockInvoices: Invoice[] = [
          {
            id: 'INV-001',
            contractId: 1,
            amount: '25000',
            status: 'APPROVED',
            submittedAt: '2024-08-15T10:00:00Z',
            description: 'Water quality monitoring services - Q3 2024'
          },
          {
            id: 'INV-002',
            contractId: 1,
            amount: '15000',
            status: 'SUBMITTED',
            submittedAt: '2024-08-16T14:30:00Z',
            description: 'Additional testing equipment rental'
          }
        ];

        const mockDocuments: Document[] = [
          {
            id: 'DOC-001',
            type: 'Insurance Certificate',
            name: 'General Liability Insurance 2024',
            uploadedAt: '2024-01-15T09:00:00Z',
            expiresAt: '2024-12-31T23:59:59Z',
            verified: true
          },
          {
            id: 'DOC-002',
            type: 'Tax Form',
            name: 'W-9 Form',
            uploadedAt: '2024-01-10T10:30:00Z',
            verified: true
          },
          {
            id: 'DOC-003',
            type: 'Certification',
            name: 'Environmental Testing Certification',
            uploadedAt: '2024-02-01T11:00:00Z',
            expiresAt: '2024-11-30T23:59:59Z',
            verified: false
          }
        ];

        setVendor(mockVendor);
        setInvoices(mockInvoices);
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  const formatCurrency = (cents: string) => {
    const amount = parseInt(cents) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendor Portal</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Welcome,</span>
          <span className="font-medium">{vendor?.name}</span>
          <Badge className={getStatusColor(vendor?.status || '')}>
            {vendor?.status}
          </Badge>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">KYC Status</p>
              <p className="text-lg font-semibold">
                <Badge className={getStatusColor(vendor?.kycStatus || '')}>
                  {vendor?.kycStatus}
                </Badge>
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">🛡️</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-green-600">
                {vendor?.complianceScore}%
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">✅</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documents Expiring</p>
              <p className="text-2xl font-bold text-orange-600">
                {vendor?.documentsExpiring}
              </p>
            </div>
            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600">⚠️</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {vendor?.documentsExpiring && vendor.documentsExpiring > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <div className="flex items-center">
            <span className="text-orange-600 mr-2">⚠️</span>
            <div>
              <p className="font-medium text-orange-800">Action Required</p>
              <p className="text-sm text-orange-700">
                You have {vendor.documentsExpiring} document(s) expiring soon. Please review and update them.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'invoices', label: 'Invoices' },
            { id: 'documents', label: 'Documents' },
            { id: 'compliance', label: 'Compliance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Invoice INV-002 Submitted</p>
                  <p className="text-sm text-gray-600">August 16, 2024</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">SUBMITTED</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Invoice INV-001 Approved</p>
                  <p className="text-sm text-gray-600">August 15, 2024</p>
                </div>
                <Badge className="bg-green-100 text-green-800">APPROVED</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Document Verification Completed</p>
                  <p className="text-sm text-gray-600">August 10, 2024</p>
                </div>
                <Badge className="bg-green-100 text-green-800">VERIFIED</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <button className="w-full p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-left">
                <div className="font-medium text-blue-600">Submit New Invoice</div>
                <div className="text-sm text-gray-600">Create and submit a new invoice for approval</div>
              </button>
              <button className="w-full p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left">
                <div className="font-medium text-green-600">Upload Document</div>
                <div className="text-sm text-gray-600">Upload compliance or certification documents</div>
              </button>
              <button className="w-full p-4 border border-purple-200 rounded-lg hover:bg-purple-50 text-left">
                <div className="font-medium text-purple-600">Update Profile</div>
                <div className="text-sm text-gray-600">Update your vendor profile and contact information</div>
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Invoices</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              New Invoice
            </button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Invoice ID</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Submitted</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b">
                      <td className="p-4 font-mono">{invoice.id}</td>
                      <td className="p-4">{invoice.description}</td>
                      <td className="p-4 font-medium">{formatCurrency(invoice.amount)}</td>
                      <td className="p-4">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {invoice.submittedAt ? new Date(invoice.submittedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Documents</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Upload Document
            </button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Document Type</th>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Uploaded</th>
                    <th className="text-left p-4 font-medium">Expires</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b">
                      <td className="p-4 font-medium">{doc.type}</td>
                      <td className="p-4">{doc.name}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : 'No expiry'}
                      </td>
                      <td className="p-4">
                        <Badge className={doc.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {doc.verified ? 'VERIFIED' : 'PENDING'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">
                          View
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 text-sm">
                          Replace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Compliance Center</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Compliance Checklist</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>KYC Documentation</span>
                  <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Insurance Certificate</span>
                  <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax Forms (W-9)</span>
                  <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Certifications</span>
                  <Badge className="bg-yellow-100 text-yellow-800">⚠ Pending Verification</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Safety Training</span>
                  <Badge className="bg-red-100 text-red-800">✗ Required</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Upcoming Renewals</h3>
              <div className="space-y-4">
                <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="font-medium text-orange-800">Insurance Certificate</div>
                  <div className="text-sm text-orange-600">Expires December 31, 2024</div>
                  <div className="text-xs text-orange-500">135 days remaining</div>
                </div>
                <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="font-medium text-orange-800">Environmental Certification</div>
                  <div className="text-sm text-orange-600">Expires November 30, 2024</div>
                  <div className="text-xs text-orange-500">104 days remaining</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}