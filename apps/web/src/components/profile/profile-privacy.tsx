'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Download, 
  Trash2, 
  FileText,
  Database,
  Lock,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Clock,
  Settings,
  Globe,
  Users,
  Mail
} from 'lucide-react';

interface ProfilePrivacyProps {
  user: any;
}

export function ProfilePrivacy({ user }: ProfilePrivacyProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Mock privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public', // public, members, private
    activityVisibility: 'members', // public, members, private
    walletVisibility: 'private', // public, members, private
    emailVisibility: 'private', // public, members, private
    participationVisibility: 'public', // public, members, private
    
    // Data processing
    dataProcessing: true,
    analytics: true,
    marketing: false,
    thirdPartySharing: false,
    
    // Communication
    researchParticipation: false,
    newsletterOptIn: true,
    surveyInvitations: true
  });

  const dataCategories = [
    {
      category: 'Profile Information',
      description: 'Display name, bio, location, and contact details',
      dataSize: '2.1 KB',
      lastUpdated: '2 days ago',
      retention: '7 years after account deletion'
    },
    {
      category: 'Wallet Data',
      description: 'Connected wallet addresses and transaction history',
      dataSize: '156 KB',
      lastUpdated: '6 hours ago',
      retention: 'Permanent (blockchain records)'
    },
    {
      category: 'Participation History',
      description: 'Project funding, voting records, and token activities',
      dataSize: '89 KB',
      lastUpdated: '1 day ago',
      retention: '7 years after account deletion'
    },
    {
      category: 'Communication Data',
      description: 'Email preferences, notification settings, and messages',
      dataSize: '12 KB',
      lastUpdated: '3 days ago',
      retention: '3 years after account deletion'
    },
    {
      category: 'Analytics Data',
      description: 'Usage patterns, session data, and performance metrics',
      dataSize: '234 KB',
      lastUpdated: '2 hours ago',
      retention: '2 years after collection'
    }
  ];

  const updatePrivacySetting = (setting: string, value: boolean | string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Visible to everyone';
      case 'members': return 'Visible to DAO members only';
      case 'private': return 'Visible only to you';
      default: return '';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-red-100 text-red-800 border-red-200';
      case 'members': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'private': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Privacy Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">Controlled</div>
              <div className="text-sm text-gray-600">Profile Visibility</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">Encrypted</div>
              <div className="text-sm text-gray-600">Data Storage</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">Customizable</div>
              <div className="text-sm text-gray-600">Privacy Settings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Visibility Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { key: 'profileVisibility', label: 'Profile Information', icon: Users, desc: 'Your display name, bio, and basic information' },
            { key: 'activityVisibility', label: 'Activity History', icon: Clock, desc: 'Your participation in projects and governance' },
            { key: 'walletVisibility', label: 'Wallet Addresses', icon: Lock, desc: 'Connected wallet addresses and balances' },
            { key: 'emailVisibility', label: 'Contact Information', icon: Mail, desc: 'Email address and other contact details' },
            { key: 'participationVisibility', label: 'Participation Stats', icon: FileText, desc: 'Funding amounts and contribution metrics' }
          ].map(({ key, label, icon: Icon, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-600">{desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getVisibilityColor(privacySettings[key])}>
                  {getVisibilityDescription(privacySettings[key])}
                </Badge>
                <select 
                  value={privacySettings[key]}
                  onChange={(e) => updatePrivacySetting(key, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-3 py-1"
                >
                  <option value="public">Public</option>
                  <option value="members">DAO Members</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Processing Consent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            Data Processing Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { 
              key: 'dataProcessing', 
              label: 'Essential Data Processing', 
              desc: 'Required for core platform functionality and security',
              required: true
            },
            { 
              key: 'analytics', 
              label: 'Analytics & Performance', 
              desc: 'Help us improve the platform through usage analytics',
              required: false
            },
            { 
              key: 'marketing', 
              label: 'Marketing Communications', 
              desc: 'Receive personalized content and promotional materials',
              required: false
            },
            { 
              key: 'thirdPartySharing', 
              label: 'Third-Party Data Sharing', 
              desc: 'Share anonymized data with research partners',
              required: false
            }
          ].map(({ key, label, desc, required }) => (
            <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-900">{label}</div>
                  {required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600">{desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={privacySettings[key]}
                  onChange={(e) => updatePrivacySetting(key, e.target.checked)}
                  disabled={required}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Your Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataCategories.map((category, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{category.category}</h4>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Size: {category.dataSize}</span>
                    <span>Updated: {category.lastUpdated}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-3 h-3 mr-2" />
                  Export
                </Button>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <strong>Retention:</strong> {category.retention}
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200">
            <Button className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Download Complete Data Archive
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { 
              key: 'researchParticipation', 
              label: 'Research Participation', 
              desc: 'Participate in user research studies and interviews'
            },
            { 
              key: 'newsletterOptIn', 
              label: 'Newsletter Subscription', 
              desc: 'Receive our monthly newsletter with ecosystem updates'
            },
            { 
              key: 'surveyInvitations', 
              label: 'Survey Invitations', 
              desc: 'Get invited to provide feedback through surveys'
            }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-600">{desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={privacySettings[key]}
                  onChange={(e) => updatePrivacySetting(key, e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/privacy-policy" 
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Privacy Policy</div>
                <div className="text-sm text-gray-600">How we collect and use your data</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
            
            <a 
              href="/terms-of-service" 
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Terms of Service</div>
                <div className="text-sm text-gray-600">Your rights and responsibilities</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
            
            <a 
              href="/data-protection" 
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Lock className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Data Protection</div>
                <div className="text-sm text-gray-600">How we secure your information</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
            
            <a 
              href="/contact" 
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-gray-900">Contact Privacy Team</div>
                <div className="text-sm text-gray-600">Questions about your privacy</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Account Deletion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Before You Delete Your Account</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Export any data you want to keep</li>
                <li>• Settle any pending transactions or votes</li>
                <li>• Transfer or retire your remaining tokens</li>
                <li>• Note that blockchain transactions cannot be deleted</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setIsDeleteDialogOpen(!isDeleteDialogOpen)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
              
              {isDeleteDialogOpen && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-medium text-red-900 mb-3">Confirm Account Deletion</h4>
                  <p className="text-sm text-red-800 mb-3">
                    Type "DELETE ACCOUNT" to confirm. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Type DELETE ACCOUNT"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="destructive"
                      disabled={confirmText !== 'DELETE ACCOUNT'}
                    >
                      Confirm Deletion
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setConfirmText('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}