'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  TrendingUp, 
  Award, 
  ArrowRight,
  Calendar,
  DollarSign,
  Activity,
  ExternalLink,
  Wallet,
  Settings,
  Bell
} from 'lucide-react';

interface ProfileOverviewProps {
  user: any;
}

export function ProfileOverview({ user }: ProfileOverviewProps) {
  // Mock activity data - in real app this would come from API
  const recentActivity = [
    {
      id: 1,
      type: 'funded',
      description: 'Funded California Watershed Restoration',
      amount: '$500',
      date: '2 days ago',
      url: '/projects/1'
    },
    {
      id: 2,
      type: 'voted',
      description: 'Voted on Proposal #12: Update Verification Standards',
      date: '1 week ago',
      url: '/governance/proposals/12'
    },
    {
      id: 3,
      type: 'retired',
      description: 'Retired 10 Lift Tokens for Forest Carbon Project',
      date: '2 weeks ago',
      url: '/lift-tokens'
    },
    {
      id: 4,
      type: 'connected',
      description: 'Connected new wallet',
      date: '3 weeks ago',
      url: '#'
    },
    {
      id: 5,
      type: 'joined',
      description: 'Joined Orenna DAO',
      date: '1 month ago',
      url: '#'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'funded': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'voted': return <Award className="w-4 h-4 text-purple-600" />;
      case 'retired': return <Leaf className="w-4 h-4 text-blue-600" />;
      case 'connected': return <Wallet className="w-4 h-4 text-orange-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'funded': return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Funded</Badge>;
      case 'voted': return <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">Voted</Badge>;
      case 'retired': return <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">Retired</Badge>;
      case 'connected': return <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">Connected</Badge>;
      default: return <Badge variant="outline">Activity</Badge>;
    }
  };

  // Mock impact data
  const impactMetrics = [
    { label: 'Acres Restored', value: '12.5', unit: 'acres', progress: 65, color: 'green' },
    { label: 'Projects Funded', value: '3', unit: 'projects', progress: 30, color: 'blue' },
    { label: 'Tokens Retired', value: '150', unit: 'LU', progress: 45, color: 'purple' },
    { label: 'CO₂ Sequestered', value: '45.2', unit: 'tons', progress: 80, color: 'orange' },
  ];

  const getProgressColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Impact Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            Impact Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {impactMetrics.map((metric, index) => (
              <div key={index} className="space-y-2 lg:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs lg:text-sm font-medium text-gray-600 truncate pr-1">{metric.label}</span>
                  <span className="text-xs lg:text-sm text-gray-500 flex-shrink-0">{metric.progress}%</span>
                </div>
                <div className="space-y-1 lg:space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg lg:text-2xl font-bold text-gray-900">{metric.value}</span>
                    <span className="text-xs lg:text-sm text-gray-500">{metric.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 lg:h-2">
                    <div 
                      className={`h-1.5 lg:h-2 rounded-full transition-all duration-300 ${getProgressColor(metric.color)}`}
                      style={{ width: `${metric.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button variant="outline" className="w-full sm:w-auto">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Detailed Impact Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityBadge(activity.type)}
                      <span className="text-sm text-gray-500">{activity.date}</span>
                    </div>
                    <p className="text-sm text-gray-900 mb-1">{activity.description}</p>
                    {activity.amount && (
                      <p className="text-sm font-medium text-green-600">{activity.amount}</p>
                    )}
                  </div>
                  {activity.url !== '#' && (
                    <a 
                      href={activity.url}
                      className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full sm:w-auto">
                  View All Activity
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-6">
                Start participating in the Orenna ecosystem to see your activity here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <a href="/projects">Explore Projects</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/governance">Join Governance</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <Button variant="outline" className="h-auto p-3 lg:p-4 justify-start" asChild>
              <a href="#wallets" className="flex flex-col items-start gap-2">
                <Wallet className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-sm lg:text-base">Connect Wallet</div>
                  <div className="text-xs lg:text-sm text-gray-500">Add or manage wallets</div>
                </div>
              </a>
            </Button>
            
            <Button variant="outline" className="h-auto p-3 lg:p-4 justify-start" asChild>
              <a href="#identity" className="flex flex-col items-start gap-2">
                <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-sm lg:text-base">Edit Identity</div>
                  <div className="text-xs lg:text-sm text-gray-500">Update profile info</div>
                </div>
              </a>
            </Button>
            
            <Button variant="outline" className="h-auto p-3 lg:p-4 justify-start" asChild>
              <a href="#notifications" className="flex flex-col items-start gap-2">
                <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-sm lg:text-base">Notifications</div>
                  <div className="text-xs lg:text-sm text-gray-500">Manage preferences</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}