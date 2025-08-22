'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { TermsRequiredWrapper } from "@/components/auth/terms-required-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  TrendingUp, 
  Coins, 
  Vote,
  ArrowRight,
  Plus,
  DollarSign,
  Activity,
  Calendar,
  User
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <MainLayout title="Dashboard" description="Your Orenna DAO dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout title="Dashboard" description="Your Orenna DAO dashboard">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Orenna DAO</h1>
            <p className="text-gray-600 mb-6">
              Connect your wallet to access your personalized dashboard and start participating in the regenerative economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/auth">Connect Wallet</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Mock data for authenticated dashboard
  const dashboardStats = {
    totalInvested: 1250,
    activeProjects: 3,
    liftTokens: 89,
    carbonRetired: 12.5
  };

  const recentActivity = [
    {
      id: 1,
      type: 'investment',
      title: 'Funded California Watershed Restoration',
      amount: '$500',
      date: '2 days ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'governance',
      title: 'Voted on Proposal #12: Update Verification Standards',
      date: '1 week ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'tokens',
      title: 'Received 25 Lift Tokens',
      date: '2 weeks ago',
      status: 'completed'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'investment': return <DollarSign className="w-4 h-4" />;
      case 'governance': return <Vote className="w-4 h-4" />;
      case 'tokens': return <Coins className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'investment': return 'text-green-600 bg-green-100';
      case 'governance': return 'text-purple-600 bg-purple-100';
      case 'tokens': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <MainLayout
      title="Dashboard"
      description="Welcome back to Orenna DAO"
    >
      <TermsRequiredWrapper
        onTermsDeclined={() => {
          window.location.href = '/';
        }}
      >
        <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.ensName || user?.address?.slice(0, 6) + '...' + user?.address?.slice(-4) || 'Member'}
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening in your regenerative journey
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Last sign-in: Just now</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboardStats.totalInvested}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeProjects}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lift Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.liftTokens}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Carbon Retired</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.carbonRetired}t</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth/profile?tab=overview">
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {activity.amount && (
                              <span className="text-sm font-medium text-green-600">{activity.amount}</span>
                            )}
                            <span className="text-sm text-gray-500">{activity.date}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-600 mb-6">
                      Start participating in the Orenna ecosystem to see your activity here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/projects/create">
                    <Leaf className="w-4 h-4 mr-3" />
                    Propose Project
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/marketplace/forwards">
                    <TrendingUp className="w-4 h-4 mr-3" />
                    Browse Forwards
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/mint-requests/create">
                    <Plus className="w-4 h-4 mr-3" />
                    Submit Mint Request
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/lift-tokens">
                    <Coins className="w-4 h-4 mr-3" />
                    My Tokens
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/governance">
                    <Vote className="w-4 h-4 mr-3" />
                    Governance
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Portfolio Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-purple-600" />
                  Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Value</span>
                    <span className="font-medium text-gray-900">$1,340</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lift Tokens</span>
                    <span className="font-medium text-gray-900">89 LT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Carbon Forwards</span>
                    <span className="font-medium text-gray-900">25 tons</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link href="/auth/profile?tab=participation">
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </TermsRequiredWrapper>
    </MainLayout>
  );
}