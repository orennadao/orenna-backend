'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Vote, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Search,
  Calendar,
  TrendingUp,
  Award,
  UserPlus,
  Settings
} from 'lucide-react';

interface ProfileGovernanceProps {
  user: any;
}

export function ProfileGovernance({ user }: ProfileGovernanceProps) {
  const [delegateAddress, setDelegateAddress] = useState('');

  // Mock governance data
  const governanceStats = {
    votingPower: 1250,
    proposalsVoted: 8,
    proposalsCreated: 2,
    delegatedTo: null,
    delegateCount: 0
  };

  const votingHistory = [
    {
      id: 12,
      title: 'Update Verification Standards for Water Conservation Projects',
      vote: 'for',
      date: '1 week ago',
      status: 'passed',
      yourVote: 'For',
      description: 'Proposal to enhance verification requirements for water conservation initiatives.'
    },
    {
      id: 11,
      title: 'Increase Funding Pool for Community-Led Projects',
      vote: 'for',
      date: '2 weeks ago',
      status: 'passed',
      yourVote: 'For',
      description: 'Allocate additional resources to support grassroots environmental projects.'
    },
    {
      id: 10,
      title: 'Modify Token Retirement Fee Structure',
      vote: 'against',
      date: '3 weeks ago',
      status: 'failed',
      yourVote: 'Against',
      description: 'Proposed changes to the fee structure for token retirement processes.'
    },
    {
      id: 9,
      title: 'Partnership with Regional Carbon Markets',
      vote: 'abstain',
      date: '1 month ago',
      status: 'passed',
      yourVote: 'Abstain',
      description: 'Establish formal partnerships with existing regional carbon trading systems.'
    }
  ];

  const activeProposals = [
    {
      id: 13,
      title: 'Implement Quadratic Voting for Future Proposals',
      description: 'Transition from simple majority voting to quadratic voting to better represent community preferences.',
      endDate: '3 days',
      votesFor: 1250,
      votesAgainst: 480,
      status: 'active',
      hasVoted: false
    },
    {
      id: 14,
      title: 'Create Biodiversity Impact Tracking Standard',
      description: 'Establish standardized metrics for measuring and reporting biodiversity impact across all projects.',
      endDate: '1 week',
      votesFor: 890,
      votesAgainst: 320,
      status: 'active',
      hasVoted: false
    }
  ];

  const getVoteColor = (vote: string) => {
    switch (vote.toLowerCase()) {
      case 'for': return 'bg-green-100 text-green-800 border-green-200';
      case 'against': return 'bg-red-100 text-red-800 border-red-200';
      case 'abstain': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVoteIcon = (vote: string) => {
    switch (vote.toLowerCase()) {
      case 'for': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'against': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Vote className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Governance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5 text-purple-600" />
            Governance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{governanceStats.votingPower}</div>
              <div className="text-sm text-gray-600">Voting Power</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Vote className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{governanceStats.proposalsVoted}</div>
              <div className="text-sm text-gray-600">Proposals Voted</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{governanceStats.proposalsCreated}</div>
              <div className="text-sm text-gray-600">Proposals Created</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{governanceStats.delegateCount}</div>
              <div className="text-sm text-gray-600">Delegates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delegation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Delegation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Current Delegation Status</h4>
                {governanceStats.delegatedTo ? (
                  <p className="text-sm text-blue-800">
                    You have delegated your voting power to {governanceStats.delegatedTo}
                  </p>
                ) : (
                  <p className="text-sm text-blue-800">
                    You are currently managing your own voting power ({governanceStats.votingPower} votes)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delegate Voting Power
            </label>
            <div className="flex gap-3">
              <Input 
                placeholder="Enter delegate address (0x...)"
                value={delegateAddress}
                onChange={(e) => setDelegateAddress(e.target.value)}
                className="flex-1"
              />
              <Button>
                Delegate
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Delegate your voting power to another address while retaining token ownership.
            </p>
          </div>

          {governanceStats.delegatedTo && (
            <Button variant="outline" className="w-full sm:w-auto">
              Revoke Delegation
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Proposals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Active Proposals
            </CardTitle>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeProposals.map((proposal) => (
              <div key={proposal.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">Proposal #{proposal.id}</h3>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{proposal.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-medium">
                      For: {proposal.votesFor}
                    </span>
                    <span className="text-red-600 font-medium">
                      Against: {proposal.votesAgainst}
                    </span>
                    <span className="text-gray-500">
                      Ends in {proposal.endDate}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%` 
                    }}
                  />
                </div>

                {!proposal.hasVoted ? (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Vote For
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                      Vote Against
                    </Button>
                    <Button size="sm" variant="outline">
                      Abstain
                    </Button>
                  </div>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Already Voted
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voting History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Voting History
            </CardTitle>
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4 mr-2" />
              Search History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {votingHistory.map((vote) => (
              <div key={vote.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {getVoteIcon(vote.yourVote)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">Proposal #{vote.id}</h4>
                      <Badge className={getVoteColor(vote.yourVote)}>
                        {vote.yourVote}
                      </Badge>
                      <Badge className={getStatusColor(vote.status)}>
                        {vote.status}
                      </Badge>
                    </div>
                    <h5 className="font-medium text-gray-900 mb-1">{vote.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">{vote.description}</p>
                    <span className="text-sm text-gray-500">{vote.date}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button variant="outline" className="w-full sm:w-auto">
              View Complete History
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Governance Participation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Participation Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications for New Proposals</h4>
                <p className="text-sm text-gray-600">Get notified when new proposals are created</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Voting Deadline Reminders</h4>
                <p className="text-sm text-gray-600">Remind me before voting periods end</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Public Voting History</h4>
                <p className="text-sm text-gray-600">Make your votes visible to other DAO members</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}