'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  MessageSquare,
  Leaf,
  Vote,
  Coins,
  TrendingUp
} from 'lucide-react';

interface ProfileNotificationsProps {
  user: any;
}

export function ProfileNotifications({ user }: ProfileNotificationsProps) {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mock notification preferences
  const [preferences, setPreferences] = useState({
    // Project notifications
    projectUpdates: { email: true, push: false, frequency: 'immediate' },
    projectMilestones: { email: true, push: true, frequency: 'immediate' },
    projectCompletion: { email: true, push: true, frequency: 'immediate' },
    
    // Governance notifications
    newProposals: { email: true, push: false, frequency: 'immediate' },
    votingDeadlines: { email: true, push: true, frequency: '24h' },
    proposalResults: { email: true, push: false, frequency: 'immediate' },
    
    // Token & Market notifications
    tokenTransfers: { email: false, push: false, frequency: 'immediate' },
    priceAlerts: { email: false, push: false, frequency: 'immediate' },
    marketingOpportunities: { email: true, push: false, frequency: 'weekly' },
    
    // System notifications
    systemUpdates: { email: true, push: false, frequency: 'immediate' },
    securityAlerts: { email: true, push: true, frequency: 'immediate' },
    maintenanceNotices: { email: true, push: false, frequency: 'immediate' },
  });

  const recentNotifications = [
    {
      id: 1,
      type: 'project',
      title: 'Project Milestone Reached',
      message: 'California Watershed Restoration has reached 50% completion',
      time: '2 hours ago',
      read: false,
      icon: Leaf,
      color: 'green'
    },
    {
      id: 2,
      type: 'governance',
      title: 'New Proposal Created',
      message: 'Proposal #13: Implement Quadratic Voting is now open for voting',
      time: '6 hours ago',
      read: true,
      icon: Vote,
      color: 'purple'
    },
    {
      id: 3,
      type: 'token',
      title: 'Token Transfer Confirmed',
      message: 'Your purchase of 50 Lift Tokens has been confirmed',
      time: '1 day ago',
      read: true,
      icon: Coins,
      color: 'blue'
    },
    {
      id: 4,
      type: 'system',
      title: 'Security Alert',
      message: 'New wallet connection detected from Chrome on macOS',
      time: '2 days ago',
      read: true,
      icon: AlertCircle,
      color: 'orange'
    }
  ];

  const updatePreference = (category: string, channel: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: value
      }
    }));
  };

  const updateFrequency = (category: string, frequency: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        frequency
      }
    }));
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'orange': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-600">Browser and mobile push notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!pushEnabled && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    // Request notification permission
                    if ('Notification' in window) {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          setPushEnabled(true);
                        }
                      });
                    }
                  }}
                >
                  Enable
                </Button>
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Sound Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-purple-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Sound Notifications</h3>
                <p className="text-sm text-gray-600">Play sounds for important notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Project Notifications */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-600" />
              Project Notifications
            </h3>
            <div className="space-y-4">
              {[
                { key: 'projectUpdates', label: 'Project Updates', desc: 'Regular progress updates from funded projects' },
                { key: 'projectMilestones', label: 'Project Milestones', desc: 'When projects reach significant milestones' },
                { key: 'projectCompletion', label: 'Project Completion', desc: 'When projects are completed' }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox"
                        checked={preferences[key]?.email}
                        onChange={(e) => updatePreference(key, 'email', e.target.checked)}
                      />
                      Email
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox"
                        checked={preferences[key]?.push}
                        onChange={(e) => updatePreference(key, 'push', e.target.checked)}
                      />
                      Push
                    </label>
                    <select 
                      value={preferences[key]?.frequency}
                      onChange={(e) => updateFrequency(key, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Governance Notifications */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Vote className="w-4 h-4 text-purple-600" />
              Governance Notifications
            </h3>
            <div className="space-y-4">
              {[
                { key: 'newProposals', label: 'New Proposals', desc: 'When new governance proposals are created' },
                { key: 'votingDeadlines', label: 'Voting Deadlines', desc: 'Reminders before voting periods end' },
                { key: 'proposalResults', label: 'Proposal Results', desc: 'When voting results are announced' }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox"
                        checked={preferences[key]?.email}
                        onChange={(e) => updatePreference(key, 'email', e.target.checked)}
                      />
                      Email
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox"
                        checked={preferences[key]?.push}
                        onChange={(e) => updatePreference(key, 'push', e.target.checked)}
                      />
                      Push
                    </label>
                    <select 
                      value={preferences[key]?.frequency}
                      onChange={(e) => updateFrequency(key, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="24h">24 hours before</option>
                      <option value="weekly">Weekly digest</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token & Market Notifications */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-600" />
              Token & Market Notifications
            </h3>
            <div className="space-y-4">
              {[
                { key: 'tokenTransfers', label: 'Token Transfers', desc: 'When tokens are transferred to/from your wallet' },
                { key: 'priceAlerts', label: 'Price Alerts', desc: 'Significant price changes for your tokens' },
                { key: 'marketingOpportunities', label: 'Market Opportunities', desc: 'New investment and trading opportunities' }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox"
                        checked={preferences[key]?.email}
                        onChange={(e) => updatePreference(key, 'email', e.target.checked)}
                      />
                      Email
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox"
                        checked={preferences[key]?.push}
                        onChange={(e) => updatePreference(key, 'push', e.target.checked)}
                      />
                      Push
                    </label>
                    <select 
                      value={preferences[key]?.frequency}
                      onChange={(e) => updateFrequency(key, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              Recent Notifications
            </CardTitle>
            <Button variant="outline" size="sm">
              Mark All as Read
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.color)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button variant="outline" className="w-full sm:w-auto">
              View All Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            Quiet Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Enable Quiet Hours</h4>
              <p className="text-sm text-gray-600">Pause non-urgent notifications during specified times</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <Input type="time" defaultValue="22:00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <Input type="time" defaultValue="08:00" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>Pacific Time (PT)</option>
              <option>Mountain Time (MT)</option>
              <option>Central Time (CT)</option>
              <option>Eastern Time (ET)</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}