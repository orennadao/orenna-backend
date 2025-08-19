'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  UserPlus, 
  Mail, 
  User, 
  Shield, 
  Key,
  Clock,
  TestTube
} from 'lucide-react'

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <TestTube className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Authentication System Test</h1>
          <p className="mt-2 text-gray-600">
            Test all VWB platform authentication workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Registration Flow */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Registration
              </CardTitle>
              <CardDescription>
                Test the multi-step registration flow with role selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>• Role-based registration</p>
                <p>• Company/organization details</p>
                <p>• Role-specific fields</p>
                <p>• Legal compliance</p>
              </div>
              <Link href="/auth/register">
                <Button className="w-full">
                  Test Registration
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Email Verification */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-500" />
                Email Verification
              </CardTitle>
              <CardDescription>
                Test email verification flow and resend functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>• Token-based verification</p>
                <p>• Resend with cooldown</p>
                <p>• Error handling</p>
                <p>• Auto-redirect</p>
              </div>
              <Link href="/auth/verify-email">
                <Button className="w-full" variant="outline">
                  Test Verification
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Setup */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                Profile Setup
              </CardTitle>
              <CardDescription>
                Test profile completion with document upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>• Professional profile</p>
                <p>• Document verification</p>
                <p>• Progress tracking</p>
                <p>• File upload</p>
              </div>
              <Link href="/auth/profile-setup">
                <Button className="w-full" variant="outline">
                  Test Profile Setup
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Two-Factor Auth */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Two-Factor Auth
              </CardTitle>
              <CardDescription>
                Test 2FA setup, QR codes, and verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>• QR code generation</p>
                <p>• Authenticator setup</p>
                <p>• Backup codes</p>
                <p>• Login verification</p>
              </div>
              <Button className="w-full" variant="outline" disabled>
                Test 2FA (Component)
              </Button>
            </CardContent>
          </Card>

          {/* Account Recovery */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-500" />
                Account Recovery
              </CardTitle>
              <CardDescription>
                Test account recovery flows and document verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>• Email recovery</p>
                <p>• Document verification</p>
                <p>• Multi-step process</p>
                <p>• Security checks</p>
              </div>
              <Button className="w-full" variant="outline" disabled>
                Test Recovery (Component)
              </Button>
            </CardContent>
          </Card>

          {/* Session Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Session Management
              </CardTitle>
              <CardDescription>
                Test auto-logout, session extension, and warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>• Auto-logout timer</p>
                <p>• Activity tracking</p>
                <p>• Session warnings</p>
                <p>• Multi-device support</p>
              </div>
              <Button className="w-full" variant="outline" disabled>
                Test Sessions (Component)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Testing Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">User Scenarios to Test:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Project Delivery Partner registration</li>
                  <li>• Funding Partner (Google) registration</li>
                  <li>• Verifier registration</li>
                  <li>• Project Owner registration</li>
                  <li>• Stakeholder registration</li>
                  <li>• Administrator registration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Key Features to Validate:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Form validation and error handling</li>
                  <li>• Role-specific field display</li>
                  <li>• File upload functionality</li>
                  <li>• Progress tracking accuracy</li>
                  <li>• Responsive design on mobile</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Limitations (Demo Mode):</h4>
              <ul className="text-sm space-y-1 text-blue-800">
                <li>• Email verification uses mock tokens</li>
                <li>• File uploads are simulated (no actual storage)</li>
                <li>• 2FA QR codes are placeholder</li>
                <li>• Session management uses local timers</li>
                <li>• Account recovery submissions are mocked</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}