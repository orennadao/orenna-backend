'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  Plus, 
  Copy, 
  ExternalLink,
  Shield,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ProfileWalletsProps {
  user: any;
}

export function ProfileWallets({ user }: ProfileWalletsProps) {
  // Mock wallet data
  const connectedWallets = [
    {
      id: '1',
      address: '0x742d35Cc4Ff26e4B8b4bbF40b9c6f26e5b8b6b91',
      label: 'Primary Wallet',
      roleTag: 'FUNDING',
      isPrimary: true,
      ens: 'alice.eth',
      chainId: 1,
      balance: '2.45 ETH'
    },
    {
      id: '2', 
      address: '0x8ba1f109551bD432803012645Hac136c9x9C29b4',
      label: 'Governance Wallet',
      roleTag: 'GOVERNANCE',
      isPrimary: false,
      chainId: 1,
      balance: '0.12 ETH'
    }
  ];

  const recentSessions = [
    { ip: '192.168.1.1', device: 'Chrome on MacOS', time: '2 minutes ago', current: true },
    { ip: '10.0.0.5', device: 'Mobile Safari', time: '2 hours ago', current: false },
    { ip: '172.16.0.1', device: 'Firefox on Windows', time: '1 day ago', current: false },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const getRoleTagColor = (role: string) => {
    switch (role) {
      case 'FUNDING': return 'bg-green-100 text-green-800 border-green-200';
      case 'GOVERNANCE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OPS': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connected Wallets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Connected Wallets
            </CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connectedWallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{wallet.label}</span>
                      {wallet.isPrimary && (
                        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                          Primary
                        </Badge>
                      )}
                      <Badge className={getRoleTagColor(wallet.roleTag)}>
                        {wallet.roleTag}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <code className="font-mono">
                        {wallet.ens || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                      </code>
                      <button
                        onClick={() => copyToClipboard(wallet.address)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Balance: {wallet.balance}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  {!wallet.isPrimary && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preferred Wallets Settings */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Preferred Wallets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Transactions
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>Primary Wallet (alice.eth)</option>
                  <option>Governance Wallet (0x8ba1...29b4)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Governance Voting
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>Governance Wallet (0x8ba1...29b4)</option>
                  <option>Primary Wallet (alice.eth)</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SIWE Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Sign-In Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSessions.map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {session.current ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {session.device}
                      {session.current && <span className="text-green-600 ml-2">(Current)</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.ip} • {session.time}
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="outline" className="w-full sm:w-auto">
              Sign Out of All Other Devices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chain Network Info */}
      <Card>
        <CardHeader>
          <CardTitle>Network Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Network
              </label>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-900">Ethereum Mainnet</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gas Settings
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option>Standard (12-15 gwei)</option>
                <option>Fast (18-22 gwei)</option>
                <option>Instant (25+ gwei)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}