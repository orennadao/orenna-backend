'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  TrendingUp, 
  Award, 
  ArrowRight,
  HelpCircle,
  ExternalLink,
  User,
  Wallet
} from 'lucide-react';

interface ProfileSidebarProps {
  user: any;
}

export function ProfileSidebar({ user }: ProfileSidebarProps) {
  // Mock impact data - in real app this would come from API
  const impactData = {
    acresRestored: 12.5,
    tokensRetired: 3,
    projectsFunded: 2,
    carbonSequestered: 45.2
  };

  const quickLinks = [
    { label: 'Browse Projects', href: '/projects', icon: Leaf },
    { label: 'Marketplace', href: '/marketplace/forwards', icon: TrendingUp },
    { label: 'Governance', href: '/governance', icon: Award },
    { label: 'Help Center', href: '/help', icon: HelpCircle },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* User Card */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center space-x-3 lg:space-x-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate text-sm lg:text-base">
                {user?.displayName || 'Anonymous User'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Wallet className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 font-mono truncate">
                  {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'Not connected'}
                </span>
              </div>
            </div>
          </div>
          
          {user?.role && (
            <div className="mt-3 lg:mt-4">
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <Card>
        <CardHeader className="pb-3 lg:pb-4">
          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
            <Leaf className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
            Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3 lg:space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <div className="text-center">
              <div className="text-xl lg:text-2xl font-bold text-green-600">
                {impactData.acresRestored}
              </div>
              <div className="text-xs text-gray-600">Acres Restored</div>
            </div>
            <div className="text-center">
              <div className="text-xl lg:text-2xl font-bold text-blue-600">
                {impactData.tokensRetired}
              </div>
              <div className="text-xs text-gray-600">Tokens Retired</div>
            </div>
            <div className="text-center">
              <div className="text-xl lg:text-2xl font-bold text-purple-600">
                {impactData.projectsFunded}
              </div>
              <div className="text-xs text-gray-600">Projects Funded</div>
            </div>
            <div className="text-center">
              <div className="text-xl lg:text-2xl font-bold text-orange-600">
                {impactData.carbonSequestered}t
              </div>
              <div className="text-xs text-gray-600">CO₂ Sequestered</div>
            </div>
          </div>
          
          <div className="pt-3 lg:pt-4 border-t border-gray-200">
            <Button variant="outline" size="sm" className="w-full text-xs lg:text-sm">
              View Detailed Impact Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="lg:block hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base lg:text-lg">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1 lg:space-y-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center justify-between p-2 lg:p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <Icon className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-xs lg:text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {link.label}
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </a>
            );
          })}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-blue-50 border-blue-200 lg:block hidden">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-3 h-3 lg:w-4 lg:h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1 text-sm lg:text-base">
                Profile Tips
              </h4>
              <p className="text-xs lg:text-sm text-blue-800 mb-2 lg:mb-3">
                Complete your identity section to help project creators understand your interests and expertise.
              </p>
              <a 
                href="/help#getting-started"
                className="inline-flex items-center text-xs lg:text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Learn more
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}