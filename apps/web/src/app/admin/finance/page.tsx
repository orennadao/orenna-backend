'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types for admin finance interface
interface Contract {
  id: number;
  projectId: number;
  projectName: string;
  vendorName: string;
  totalAmount: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'COMPLETED';
  createdAt: string;
  approvals: number;
  requiredApprovals: number;
}

interface PaymentRun {
  id: string;
  batchName: string;
  totalAmount: string;
  paymentCount: number;
  status: 'DRAFT' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  scheduledDate?: string;
}

interface PendingApproval {
  id: string;
  type: 'CONTRACT' | 'INVOICE' | 'CHANGE_ORDER';
  title: string;
  amount: string;
  submittedBy: string;
  submittedAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function AdminFinance() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [paymentRuns, setPaymentRuns] = useState<PaymentRun[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'payments' | 'approvals'>('overview');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Mock data for admin interface
        const mockContracts: Contract[] = [
          {
            id: 1,
            projectId: 101,
            projectName: 'Water Restoration Project Alpha',
            vendorName: 'Acme Environmental Services',
            totalAmount: '150000',
            status: 'PENDING_APPROVAL',
            createdAt: '2024-08-15T10:00:00Z',
            approvals: 1,
            requiredApprovals: 2
          },
          {
            id: 2,
            projectId: 102,
            projectName: 'Carbon Sequestration Initiative',
            vendorName: 'GreenTech Solutions',
            totalAmount: '300000',
            status: 'APPROVED',
            createdAt: '2024-08-10T14:30:00Z',
            approvals: 2,
            requiredApprovals: 2
          }
        ];

        const mockPaymentRuns: PaymentRun[] = [
          {
            id: 'PR-001',
            batchName: 'Q3 2024 Weekly Payment Run',
            totalAmount: '85000',
            paymentCount: 5,
            status: 'READY',
            createdAt: '2024-08-16T09:00:00Z',
            scheduledDate: '2024-08-17T15:00:00Z'
          },
          {
            id: 'PR-002',
            batchName: 'Emergency Payment Batch',
            totalAmount: '25000',
            paymentCount: 2,
            status: 'PROCESSING',
            createdAt: '2024-08-16T11:30:00Z'
          }
        ];

        const mockPendingApprovals: PendingApproval[] = [
          {
            id: 'APP-001',
            type: 'CONTRACT',
            title: 'Water Restoration Project Alpha Contract',
            amount: '150000',
            submittedBy: 'John Smith',
            submittedAt: '2024-08-15T10:00:00Z',
            priority: 'HIGH'
          },
          {
            id: 'APP-002',
            type: 'INVOICE',
            title: 'Monthly Water Quality Testing Invoice',
            amount: '35000',
            submittedBy: 'Sarah Johnson',
            submittedAt: '2024-08-16T08:30:00Z',
            priority: 'MEDIUM'
          },
          {
            id: 'APP-003',
            type: 'CHANGE_ORDER',
            title: 'Additional Equipment for Project Beta',
            amount: '12000',
            submittedBy: 'Mike Davis',
            submittedAt: '2024-08-16T14:00:00Z',
            priority: 'LOW'
          }
        ];

        setContracts(mockContracts);
        setPaymentRuns(mockPaymentRuns);
        setPendingApprovals(mockPendingApprovals);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
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
      case 'COMPLETED':
      case 'EXECUTED':
        return 'bg-green-100 text-green-800';
      case 'PENDING_APPROVAL':
      case 'READY':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalPendingApprovals = pendingApprovals.length;
  const totalContractValue = contracts.reduce((sum, contract) => sum + parseInt(contract.totalAmount), 0);
  const totalPaymentValue = paymentRuns.reduce((sum, run) => sum + parseInt(run.totalAmount), 0);
  const activePaymentRuns = paymentRuns.filter(run => run.status === 'READY' || run.status === 'PROCESSING').length;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Finance Administration</h1>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Create Contract
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            New Payment Run
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-orange-600">{totalPendingApprovals}</p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-sm">⏳</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contract Value</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalContractValue.toString())}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">📄</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payment Queue Value</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaymentValue.toString())}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">💰</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Payment Runs</p>
              <p className="text-2xl font-bold text-purple-600">{activePaymentRuns}</p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm">🔄</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'contracts', label: 'Contracts' },
            { id: 'payments', label: 'Payment Runs' },
            { id: 'approvals', label: 'Pending Approvals' }
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
                  <p className="font-medium">Contract #1 submitted for approval</p>
                  <p className="text-sm text-gray-600">Water Restoration Project Alpha</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Payment Run PR-002 started processing</p>
                  <p className="text-sm text-gray-600">Emergency Payment Batch</p>
                </div>
                <span className="text-sm text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Invoice approved for payment</p>
                  <p className="text-sm text-gray-600">Monthly Water Quality Testing</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Alerts & Notifications</h2>
            <div className="space-y-4">
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="font-medium text-red-800">High Priority Approval Required</div>
                <div className="text-sm text-red-600">Contract for Water Restoration Project Alpha awaiting approval</div>
              </div>
              <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="font-medium text-yellow-800">Payment Run Ready</div>
                <div className="text-sm text-yellow-600">Q3 2024 Weekly Payment Run is ready for execution</div>
              </div>
              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                <div className="font-medium text-blue-800">Vendor Document Expiring</div>
                <div className="text-sm text-blue-600">Insurance certificate for GreenTech Solutions expires in 30 days</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Contract Management</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Create New Contract
            </button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Contract ID</th>
                    <th className="text-left p-4 font-medium">Project</th>
                    <th className="text-left p-4 font-medium">Vendor</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Approvals</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b">
                      <td className="p-4 font-mono">CNT-{contract.id.toString().padStart(3, '0')}</td>
                      <td className="p-4">{contract.projectName}</td>
                      <td className="p-4">{contract.vendorName}</td>
                      <td className="p-4 font-medium">{formatCurrency(contract.totalAmount)}</td>
                      <td className="p-4">
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {contract.approvals}/{contract.requiredApprovals}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            View
                          </button>
                          {contract.status === 'PENDING_APPROVAL' && (
                            <button className="text-green-600 hover:text-green-800 text-sm">
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'payments' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Payment Run Management</h2>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Create Payment Run
            </button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Run ID</th>
                    <th className="text-left p-4 font-medium">Batch Name</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Payments</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Scheduled</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRuns.map((run) => (
                    <tr key={run.id} className="border-b">
                      <td className="p-4 font-mono">{run.id}</td>
                      <td className="p-4">{run.batchName}</td>
                      <td className="p-4 font-medium">{formatCurrency(run.totalAmount)}</td>
                      <td className="p-4">{run.paymentCount}</td>
                      <td className="p-4">
                        <Badge className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {run.scheduledDate ? new Date(run.scheduledDate).toLocaleString() : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            View
                          </button>
                          {run.status === 'READY' && (
                            <button className="text-green-600 hover:text-green-800 text-sm">
                              Execute
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Pending Approvals</h2>
          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <Card key={approval.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={getPriorityColor(approval.priority)}>
                        {approval.priority}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        {approval.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-medium">{approval.title}</h3>
                    <p className="text-gray-600">
                      Amount: {formatCurrency(approval.amount)} • 
                      Submitted by {approval.submittedBy} • 
                      {new Date(approval.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      Reject
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Approve
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}