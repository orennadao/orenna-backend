'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TwoFactorAuth, TwoFactorVerification } from '@/components/auth/two-factor-auth'
import { AccountRecovery } from '@/components/auth/account-recovery'
import { SessionManager } from '@/components/auth/session-manager'
import { 
  Shield, 
  Key, 
  Clock,
  TestTube,
  Eye,
  EyeOff
} from 'lucide-react'

export default function ComponentTestPage() {
  const [activeComponent, setActiveComponent] = useState<string | null>(null)
  const [show2FAVerification, setShow2FAVerification] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)

  const handle2FAEnable = (backupCodes: string[]) => {
    console.log('2FA enabled with backup codes:', backupCodes)
    setIs2FAEnabled(true)
  }

  const handle2FADisable = () => {
    console.log('2FA disabled')
    setIs2FAEnabled(false)
  }

  const handle2FAVerify = async (code: string) => {
    console.log('Verifying 2FA code:', code)
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1000))
    return code === '123456' // Accept 123456 as valid for testing
  }

  const handleRecoveryComplete = () => {
    console.log('Account recovery completed')
    setActiveComponent(null)
  }

  const handleSessionExpired = () => {
    console.log('Session expired!')
    alert('Session expired - user would be logged out')
  }

  const renderComponent = () => {
    switch (activeComponent) {
      case '2fa':
        return (
          <div className="space-y-4">
            <TwoFactorAuth
              isEnabled={is2FAEnabled}
              onEnable={handle2FAEnable}
              onDisable={handle2FADisable}
              onVerify={handle2FAVerify}
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => setShow2FAVerification(true)}
                variant="outline"
              >
                Test 2FA Login Modal
              </Button>
              <Button 
                onClick={() => setActiveComponent(null)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        )
      
      case 'recovery':
        return (
          <AccountRecovery onComplete={handleRecoveryComplete} />
        )
      
      case 'session':
        return (
          <div className="space-y-4">
            <SessionManager
              autoLogoutTime={2} // 2 minutes for testing
              warningTime={0.5} // 30 seconds warning
              onSessionExpired={handleSessionExpired}
            />
            <Button 
              onClick={() => setActiveComponent(null)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <TestTube className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Authentication Components Test</h1>
          <p className="mt-2 text-gray-600">
            Test individual authentication components in isolation
          </p>
        </div>

        {!activeComponent ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Two-Factor Auth */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveComponent('2fa')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    2FA Component
                  </CardTitle>
                  <CardDescription>
                    Test the complete 2FA setup and verification flow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>• QR code generation</p>
                    <p>• Setup wizard</p>
                    <p>• Backup codes</p>
                    <p>• Login verification modal</p>
                  </div>
                  <Button className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Test 2FA
                  </Button>
                </CardContent>
              </Card>

              {/* Account Recovery */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveComponent('recovery')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-orange-500" />
                    Recovery Component
                  </CardTitle>
                  <CardDescription>
                    Test account recovery flows and document upload
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>• Email recovery method</p>
                    <p>• Document verification</p>
                    <p>• Multi-step workflow</p>
                    <p>• Error handling</p>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Test Recovery
                  </Button>
                </CardContent>
              </Card>

              {/* Session Management */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveComponent('session')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Session Component
                  </CardTitle>
                  <CardDescription>
                    Test session management with auto-logout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>• 2-minute auto-logout</p>
                    <p>• 30-second warning</p>
                    <p>• Activity tracking</p>
                    <p>• Session extension</p>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Test Sessions
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Test Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Component Testing Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">2FA Testing:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Click through setup wizard</li>
                      <li>• Test QR code display</li>
                      <li>• Use code "123456" to verify</li>
                      <li>• Test backup codes generation</li>
                      <li>• Test login verification modal</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Recovery Testing:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Test email recovery flow</li>
                      <li>• Test document upload UI</li>
                      <li>• Fill out identity verification</li>
                      <li>• Test form validation</li>
                      <li>• Check success states</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Session Management Testing:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Timer set to 2 minutes for quick testing</li>
                    <li>• Warning appears at 30 seconds remaining</li>
                    <li>• Move mouse or click to reset timer</li>
                    <li>• Test session extension button</li>
                    <li>• Let timer run out to test auto-logout</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            {renderComponent()}
          </div>
        )}

        {/* 2FA Verification Modal */}
        <TwoFactorVerification
          isOpen={show2FAVerification}
          onClose={() => setShow2FAVerification(false)}
          onVerify={handle2FAVerify}
          onUseBackupCode={async (code) => {
            console.log('Using backup code:', code)
            return code === 'BACKUP01' // Accept BACKUP01 as valid
          }}
        />

        {/* Navigation */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}