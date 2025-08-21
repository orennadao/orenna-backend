'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { ClientOnly } from '@/components/auth/client-only';
import { TermsRequiredWrapper } from '@/components/auth/terms-required-wrapper';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { ProfileOverview } from '@/components/profile/profile-overview';
import { ProfileWallets } from '@/components/profile/profile-wallets';
import { ProfileIdentity } from '@/components/profile/profile-identity';
import { ProfileParticipation } from '@/components/profile/profile-participation';
import { ProfileGovernance } from '@/components/profile/profile-governance';
import { ProfileNotifications } from '@/components/profile/profile-notifications';
import { ProfilePrivacy } from '@/components/profile/profile-privacy';
import { ProfileSecurity } from '@/components/profile/profile-security';
import { ProfileSidebar } from '@/components/profile/profile-sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const PROFILE_TABS = [
  { id: 'overview', label: 'Overview', component: ProfileOverview },
  { id: 'wallets', label: 'Wallets & Auth', component: ProfileWallets },
  { id: 'identity', label: 'Identity', component: ProfileIdentity },
  { id: 'participation', label: 'Participation', component: ProfileParticipation },
  { id: 'governance', label: 'Governance', component: ProfileGovernance },
  { id: 'notifications', label: 'Notifications', component: ProfileNotifications },
  { id: 'privacy', label: 'Privacy & Data', component: ProfilePrivacy },
  { id: 'security', label: 'Security', component: ProfileSecurity },
];

function ProfileContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Get active component
  const ActiveComponent = PROFILE_TABS.find(tab => tab.id === activeTab)?.component || ProfileOverview;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view and manage your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/auth">Connect Wallet</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <TermsRequiredWrapper
      onTermsDeclined={() => {
        window.location.href = '/';
      }}
    >
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span>Profile</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage your account, settings, and participation in the Orenna ecosystem
            </p>
          </div>
          <div className="text-left sm:text-right text-sm text-gray-500">
            <div>Last sign-in</div>
            <div className="font-medium">Just now</div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar - Mobile First */}
        <div className="lg:hidden">
          <ProfileSidebar user={user} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Tabs Navigation */}
          <ProfileTabs 
            tabs={PROFILE_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          {/* Tab Content */}
          <div className="mt-4 lg:mt-6">
            <ActiveComponent user={user} />
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <ProfileSidebar user={user} />
        </div>
      </div>
    </TermsRequiredWrapper>
  );
}

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ClientOnly 
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          }
        >
          <ProfileContent />
        </ClientOnly>
      </div>
    </MainLayout>
  );
}