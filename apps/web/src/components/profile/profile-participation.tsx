'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  TrendingUp, 
  Coins, 
  Calendar,
  ExternalLink,
  ArrowRight,
  Filter,
  Search,
  Eye,
  Download
} from 'lucide-react';

interface ProfileParticipationProps {
  user: any;
}

export function ProfileParticipation({ user }: ProfileParticipationProps) {
  const [activeFilter, setActiveFilter] = useState('all');

  // Mock participation data
  const projectParticipation = [
    {
      id: 1,
      name: 'California Watershed Restoration',
      type: 'project',
      role: 'Funder',
      amount: '$500',
      date: '2 days ago',
      status: 'active',
      impact: '2.5 acres restored'
    },
    {
      id: 2,
      name: 'Oregon Forest Carbon Sequestration',
      type: 'project',
      role: 'Funder',
      amount: '$750',
      date: '1 week ago', 
      status: 'completed',
      impact: '5.2 tons CO₂ sequestered'
    },
    {
      id: 3,
      name: 'Texas Grassland Restoration',
      type: 'project',
      role: 'Validator',
      amount: null,
      date: '2 weeks ago',
      status: 'active',
      impact: 'Verification complete'
    }
  ];

  const liftTokenActivity = [
    {
      id: 1,
      action: 'Purchased',
      amount: '50 LU',
      project: 'California Watershed Restoration',
      date: '2 days ago',
      price: '$10.00/LU'
    },
    {
      id: 2,
      action: 'Retired',
      amount: '10 LU',
      project: 'Forest Carbon Project',
      date: '2 weeks ago',
      price: '$10.00/LU'
    },
    {
      id: 3,
      action: 'Purchased',
      amount: '75 LU',
      project: 'Oregon Forest Carbon',
      date: '1 month ago',
      price: '$12.50/LU'
    }
  ];

  const forwardsActivity = [
    {
      id: 1,
      type: 'purchase',
      project: 'California Watershed Restoration',
      amount: '25 forwards',
      date: '1 week ago',
      deliveryDate: 'Q2 2024',
      status: 'pending'
    },
    {
      id: 2,
      type: 'delivery',
      project: 'Texas Grassland Restoration',
      amount: '15 forwards',
      date: '2 weeks ago',
      deliveryDate: 'Q1 2024',
      status: 'delivered'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Funder': return 'bg-green-100 text-green-800 border-green-200';
      case 'Validator': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Creator': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Participation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Participation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-600">Projects Funded</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Coins className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">135</div>
              <div className="text-sm text-gray-600">Lift Tokens</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">40</div>
              <div className="text-sm text-gray-600">Carbon Forwards</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">2</div>
              <div className="text-sm text-gray-600">Months Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Participation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Project Participation
            </CardTitle>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View All Projects
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectParticipation.map((participation) => (
              <div key={participation.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{participation.name}</h3>
                      <Badge className={getRoleColor(participation.role)}>
                        {participation.role}
                      </Badge>
                      <Badge className={getStatusColor(participation.status)}>
                        {participation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {participation.amount && (
                        <span className="font-medium text-green-600">{participation.amount}</span>
                      )}
                      <span>{participation.date}</span>
                      <span>•</span>
                      <span>{participation.impact}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lift Tokens Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              Lift Tokens Activity
            </CardTitle>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Portfolio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {liftTokenActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.action === 'Purchased' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Coins className={`w-4 h-4 ${
                      activity.action === 'Purchased' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {activity.action} {activity.amount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {activity.project} • {activity.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{activity.price}</div>
                  <div className="text-sm text-gray-500">per token</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Carbon Forwards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Carbon Forwards
            </CardTitle>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Marketplace
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forwardsActivity.map((forward) => (
              <div key={forward.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    forward.type === 'purchase' ? 'bg-purple-100' : 'bg-green-100'
                  }`}>
                    <TrendingUp className={`w-4 h-4 ${
                      forward.type === 'purchase' ? 'text-purple-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {forward.type === 'purchase' ? 'Purchased' : 'Delivered'} {forward.amount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {forward.project} • {forward.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(forward.status)}>
                    {forward.status}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">
                    Delivery: {forward.deliveryDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle>Export Activity Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Download your complete participation history for your records or tax purposes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Tax Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}