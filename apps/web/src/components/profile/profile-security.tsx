'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Globe,
  MapPin,
  Clock,
  Wifi,
  Chrome,
  Laptop
} from 'lucide-react';

interface ProfileSecurityProps {
  user: any;
}

export function ProfileSecurity({ user }: ProfileSecurityProps) {
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  // Mock security data
  const securityStatus = {
    passwordStrength: 'strong',
    twoFactorEnabled: true,
    lastPasswordChange: '3 months ago',
    suspiciousActivity: false,
    loginAttempts: 0
  };

  const activeSessions = [
    {
      id: '1',
      device: 'Chrome on macOS',
      location: 'San Francisco, CA',
      ip: '192.168.1.100',
      loginTime: 'Just now',
      lastActivity: 'Active now',
      current: true,
      deviceType: 'desktop',
      trusted: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'San Francisco, CA',
      ip: '192.168.1.101',
      loginTime: '2 hours ago',
      lastActivity: '1 hour ago',
      current: false,
      deviceType: 'mobile',
      trusted: true
    },
    {
      id: '3',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      ip: '10.0.0.25',
      loginTime: '1 day ago',
      lastActivity: '18 hours ago',
      current: false,
      deviceType: 'desktop',
      trusted: false
    },
    {
      id: '4',
      device: 'Firefox on Linux',
      location: 'London, UK',
      ip: '172.16.0.1',
      loginTime: '3 days ago',
      lastActivity: '2 days ago',
      current: false,
      deviceType: 'desktop',
      trusted: true
    }
  ];

  const apiKeys = [
    {
      id: '1',
      name: 'Portfolio Tracker',
      key: 'sk_live_abc123...def456',
      created: '2 weeks ago',
      lastUsed: '1 hour ago',
      permissions: ['read:portfolio', 'read:transactions']
    },
    {
      id: '2',
      name: 'Analytics Dashboard',
      key: 'sk_live_xyz789...uvw012',
      created: '1 month ago',
      lastUsed: '2 days ago',
      permissions: ['read:analytics', 'read:projects']
    }
  ];

  const loginHistory = [
    {
      id: '1',
      timestamp: '2024-01-20 14:30:25',
      device: 'Chrome on macOS',
      location: 'San Francisco, CA',
      ip: '192.168.1.100',
      status: 'success',
      method: 'wallet'
    },
    {
      id: '2',
      timestamp: '2024-01-20 09:15:10',
      device: 'Safari on iPhone',
      location: 'San Francisco, CA',
      ip: '192.168.1.101',
      status: 'success',
      method: 'wallet'
    },
    {
      id: '3',
      timestamp: '2024-01-19 16:45:33',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      ip: '10.0.0.25',
      status: 'failed',
      method: 'wallet',
      reason: 'Invalid signature'
    },
    {
      id: '4',
      timestamp: '2024-01-19 11:20:15',
      device: 'Chrome on macOS',
      location: 'San Francisco, CA',
      ip: '192.168.1.100',
      status: 'success',
      method: 'wallet'
    }
  ];

  const getDeviceIcon = (deviceType: string, deviceName: string) => {
    if (deviceName.toLowerCase().includes('iphone') || deviceName.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-4 h-4" />;
    }
    if (deviceName.toLowerCase().includes('chrome')) {
      return <Chrome className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const maskApiKey = (key: string) => {
    const visible = key.slice(0, 12);
    const masked = '•'.repeat(8);
    return `${visible}${masked}`;
  };

  const terminateSession = (sessionId: string) => {
    // TODO: Implement session termination
    console.log('Terminating session:', sessionId);
  };

  const revokeApiKey = (keyId: string) => {
    // TODO: Implement API key revocation
    console.log('Revoking API key:', keyId);
  };

  const createApiKey = () => {
    if (!newApiKeyName.trim()) return;
    // TODO: Implement API key creation
    console.log('Creating API key:', newApiKeyName);
    setNewApiKeyName('');
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Password Strength</div>
                    <div className="text-sm text-gray-600">Last changed {securityStatus.lastPasswordChange}</div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Strong
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-600">Additional security layer</div>
                  </div>
                </div>
                <Badge className={securityStatus.twoFactorEnabled ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                  {securityStatus.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Suspicious Activity</div>
                    <div className="text-sm text-gray-600">No recent suspicious activity</div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Clear
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Key className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Failed Login Attempts</div>
                    <div className="text-sm text-gray-600">In the last 24 hours</div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {securityStatus.loginAttempts}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline">
                <Smartphone className="w-4 h-4 mr-2" />
                {securityStatus.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
              </Button>
              <Button variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Security Audit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-green-600" />
              Active Sessions
            </CardTitle>
            <Button variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Terminate All Others
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div key={session.id} className={`p-4 border rounded-lg ${session.current ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${session.trusted ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {getDeviceIcon(session.deviceType, session.device)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{session.device}</span>
                        {session.current && (
                          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                            Current
                          </Badge>
                        )}
                        {!session.trusted && (
                          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                            Untrusted
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span>{session.location}</span>
                          <span>•</span>
                          <span>{session.ip}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Logged in {session.loginTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wifi className="w-3 h-3" />
                            <span>{session.lastActivity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => terminateSession(session.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Terminate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              API Keys
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowApiKeys(!showApiKeys)}
            >
              {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showApiKeys ? 'Hide' : 'Show'} Keys
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing API Keys */}
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{apiKey.name}</div>
                    <div className="font-mono text-sm text-gray-600 mb-2">
                      {showApiKeys ? apiKey.key : maskApiKey(apiKey.key)}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {apiKey.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created {apiKey.created} • Last used {apiKey.lastUsed}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => revokeApiKey(apiKey.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Create New API Key */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Create New API Key</h4>
            <div className="flex gap-3">
              <Input 
                placeholder="API key name (e.g., Mobile App)"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createApiKey}>
                <Key className="w-4 h-4 mr-2" />
                Create Key
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Give your API key a descriptive name so you can identify it later.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Recent Login History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loginHistory.map((login) => (
              <div key={login.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(login.status)}`}>
                    {getStatusIcon(login.status)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {login.device}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {login.method}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      {login.timestamp} • {login.location} ({login.ip})
                    </div>
                    {login.reason && (
                      <div className="text-xs text-red-600 mt-1">{login.reason}</div>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(login.status)}>
                  {login.status}
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button variant="outline" className="w-full sm:w-auto">
              View Complete Login History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="w-5 h-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Strong Password ✓</div>
                <div className="text-sm text-blue-800">Your password meets security requirements</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Two-Factor Authentication ✓</div>
                <div className="text-sm text-blue-800">2FA is enabled for additional security</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Review Untrusted Sessions</div>
                <div className="text-sm text-blue-800">You have 1 untrusted session that should be reviewed</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Regular Security Audits</div>
                <div className="text-sm text-blue-800">Review your security settings monthly</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}