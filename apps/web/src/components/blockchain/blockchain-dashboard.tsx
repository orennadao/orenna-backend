'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from '@/lib/api'

export function BlockchainDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressInput, setAddressInput] = useState('')
  const [balanceResult, setBalanceResult] = useState<any>(null)

  useEffect(() => {
    if (user?.address) {
      fetchTokenInfo()
    }
  }, [user?.address])

  const fetchTokenInfo = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.governance.getToken()
      setTokenInfo(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token info')
    } finally {
      setIsLoading(false)
    }
  }

  const checkBalance = async () => {
    if (!addressInput) return
    
    setIsLoading(true)
    setError(null)
    try {
      // This would be implemented with the blockchain service
      // For now, showing placeholder
      setBalanceResult({
        address: addressInput,
        ornaBalance: '1,234.56',
        votingPower: '1,234.56',
        delegatedTo: null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check balance')
    } finally {
      setIsLoading(false)
    }
  }

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet'
      case 11155111: return 'Sepolia Testnet'
      case 137: return 'Polygon'
      case 31337: return 'Local Network'
      default: return `Chain ${chainId}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Blockchain Tools</h1>
        <p className="text-gray-600 mt-2">
          View ORNA token information, balances, and voting power
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'token-info', label: 'ORNA Token' },
            { id: 'balance-checker', label: 'Balance Checker' },
            { id: 'governance', label: 'Governance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={fetchTokenInfo} className="mt-2" size="sm" variant="outline">
            Retry
          </Button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Network */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Current Network</span>
                <div className="font-medium">
                  {user?.chainId ? getNetworkName(user.chainId) : 'Not connected'}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Chain ID</span>
                <div className="font-medium">{user?.chainId || 'N/A'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Connected Address</span>
                <div className="font-medium font-mono text-sm">
                  {user?.address || 'Not connected'}
                </div>
              </div>
            </div>
          </Card>

          {/* User Token Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your ORNA Tokens</h3>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : tokenInfo ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Balance</span>
                  <div className="text-2xl font-bold text-gray-900">
                    {tokenInfo.balance || '0'} ORNA
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Voting Power</span>
                  <div className="font-medium">
                    {tokenInfo.votingPower || '0'} ORNA
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Delegated To</span>
                  <div className="font-medium font-mono text-sm">
                    {tokenInfo.delegatedTo || 'Self'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2">Connect your wallet to view token information</p>
                <Button onClick={fetchTokenInfo} size="sm">
                  Load Token Info
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'token-info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ORNA Token Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Token Name</span>
                <div className="font-medium">Orenna Governance Token</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Symbol</span>
                <div className="font-medium">ORNA</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Supply</span>
                <div className="font-medium">1,000,000,000 ORNA</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Contract Address</span>
                <div className="font-medium font-mono text-sm">
                  {tokenInfo?.contractAddress || 'Loading...'}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Utility</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Governance Voting</div>
                  <div className="text-sm text-gray-600">
                    Vote on proposals to upgrade the protocol
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Platform Fees</div>
                  <div className="text-sm text-gray-600">
                    Pay reduced fees for platform services
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Staking Rewards</div>
                  <div className="text-sm text-gray-600">
                    Earn rewards by participating in governance
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'balance-checker' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Check Any Address</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ethereum Address
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0x..."
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={checkBalance}
                  disabled={!addressInput || isLoading}
                >
                  {isLoading ? 'Checking...' : 'Check Balance'}
                </Button>
              </div>
            </div>

            {balanceResult && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Balance Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">ORNA Balance</span>
                    <div className="text-lg font-semibold">
                      {balanceResult.ornaBalance} ORNA
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Voting Power</span>
                    <div className="text-lg font-semibold">
                      {balanceResult.votingPower} ORNA
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Delegation Status</span>
                    <div className="text-sm">
                      {balanceResult.delegatedTo ? (
                        <span>Delegated to {balanceResult.delegatedTo}</span>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Self-delegated</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'governance' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Governance Participation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Your Voting Power</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {tokenInfo?.votingPower || '0'} ORNA
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Current voting power for governance proposals
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Delegation</h4>
                <div className="text-lg">
                  {tokenInfo?.delegatedTo ? (
                    <span className="text-gray-600">
                      Delegated to {tokenInfo.delegatedTo}
                    </span>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">Self-delegated</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  Change Delegation
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <span className="font-medium">View Proposals</span>
                <span className="text-sm text-gray-600">See active proposals</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <span className="font-medium">Create Proposal</span>
                <span className="text-sm text-gray-600">Submit new proposal</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <span className="font-medium">Delegate Votes</span>
                <span className="text-sm text-gray-600">Delegate to someone</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}