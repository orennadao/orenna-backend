'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG } from 'qrcode.react'
import { Shield, Smartphone, Key, Copy, Check, AlertTriangle } from 'lucide-react'

interface TwoFactorAuthProps {
  isEnabled?: boolean
  onEnable?: (backupCodes: string[]) => void
  onDisable?: () => void
  onVerify?: (code: string) => Promise<boolean>
}

export function TwoFactorAuth({ 
  isEnabled = false, 
  onEnable, 
  onDisable, 
  onVerify 
}: TwoFactorAuthProps) {
  const [step, setStep] = useState<'setup' | 'qr' | 'verify' | 'backup-codes' | 'enabled'>('setup')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [copiedCodes, setCopiedCodes] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  
  useEffect(() => {
    if (isEnabled) {
      setStep('enabled')
    }
  }, [isEnabled])
  
  const generateQRCode = async () => {
    try {
      // Mock API call for testing
      console.log('Generating QR code (mock)')
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
      
      // Mock data for testing
      const mockSecret = 'JBSWY3DPEHPK3PXP'
      const mockQrUrl = `otpauth://totp/VWB%20Platform:test@example.com?secret=${mockSecret}&issuer=VWB%20Platform`
      
      setQrCodeUrl(mockQrUrl)
      setSecretKey(mockSecret)
      setStep('qr')
    } catch (error) {
      console.error('QR generation error:', error)
      setError('Network error occurred')
    }
  }
  
  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code')
      return
    }
    
    setIsVerifying(true)
    setError('')
    
    try {
      // Mock API call for testing
      console.log('Verifying 2FA setup (mock)', { code: verificationCode })
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      
      // Accept 123456 as valid for testing
      if (verificationCode === '123456') {
        // Mock backup codes
        const mockBackupCodes = [
          'BACKUP01', 'BACKUP02', 'BACKUP03', 'BACKUP04',
          'BACKUP05', 'BACKUP06', 'BACKUP07', 'BACKUP08'
        ]
        
        setBackupCodes(mockBackupCodes)
        setStep('backup-codes')
        if (onEnable) {
          onEnable(mockBackupCodes)
        }
      } else {
        setError('Invalid code. Use "123456" for testing.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Network error occurred')
    } finally {
      setIsVerifying(false)
    }
  }
  
  const disable2FA = async () => {
    try {
      // Mock API call for testing
      console.log('Disabling 2FA (mock)')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStep('setup')
      if (onDisable) {
        onDisable()
      }
    } catch (error) {
      console.error('Disable 2FA error:', error)
      setError('Network error occurred')
    }
  }
  
  const copyToClipboard = (text: string, type: 'codes' | 'secret') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'codes') {
        setCopiedCodes(true)
        setTimeout(() => setCopiedCodes(false), 2000)
      } else {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      }
    })
  }
  
  const renderStep = () => {
    switch (step) {
      case 'setup':
        return (
          <div className="text-center space-y-4">
            <Shield className="w-16 h-16 text-blue-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Enable Two-Factor Authentication</h3>
              <p className="text-gray-600 mt-1">
                Add an extra layer of security to your VWB platform account
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">Benefits of 2FA:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Protects against unauthorized access</li>
                <li>• Secures water benefit transactions</li>
                <li>• Meets corporate security requirements</li>
                <li>• Prevents account takeover attacks</li>
              </ul>
            </div>
            <Button onClick={generateQRCode} className="w-full">
              <Smartphone className="w-4 h-4 mr-2" />
              Setup 2FA
            </Button>
          </div>
        )
      
      case 'qr':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-gray-600 text-sm">
                Use your authenticator app to scan this QR code
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <Label htmlFor="secretKey" className="text-sm font-medium">
                Manual Entry Key (if QR doesn't work):
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="secretKey"
                  value={secretKey}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(secretKey, 'secret')}
                >
                  {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Alert>
              <Smartphone className="w-4 h-4" />
              <AlertDescription className="text-sm">
                Recommended apps: Google Authenticator, Authy, Microsoft Authenticator, or 1Password
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button onClick={() => setStep('verify')} className="flex-1">
                I've Scanned the Code
              </Button>
            </div>
          </div>
        )
      
      case 'verify':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Key className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Verify Setup</h3>
              <p className="text-gray-600 text-sm">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            
            <div>
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setVerificationCode(value)
                  setError('')
                }}
                placeholder="000000"
                className="text-center text-lg font-mono"
                maxLength={6}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('qr')}>
                Back
              </Button>
              <Button 
                onClick={verifyAndEnable} 
                disabled={verificationCode.length !== 6 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )
      
      case 'backup-codes':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-green-900">2FA Enabled Successfully!</h3>
              <p className="text-gray-600 text-sm">
                Save these backup codes in a secure location
              </p>
            </div>
            
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Important:</strong> These backup codes can be used to access your account if you lose your authenticator device. Save them securely and don't share them.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">Backup Codes</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                >
                  {copiedCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCodes ? 'Copied!' : 'Copy All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded border font-mono text-sm text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            
            <Button onClick={() => setStep('enabled')} className="w-full">
              I've Saved My Backup Codes
            </Button>
          </div>
        )
      
      case 'enabled':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">2FA is Enabled</h3>
              <Badge variant="default" className="mt-2">
                <Shield className="w-3 h-3 mr-1" />
                Protected
              </Badge>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                Your account is now protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                View Backup Codes
              </Button>
              <Button variant="outline" className="w-full">
                Regenerate Backup Codes
              </Button>
              <Button 
                variant="destructive" 
                onClick={disable2FA}
                className="w-full"
              >
                Disable 2FA
              </Button>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Secure your VWB platform account with 2FA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStep()}
      </CardContent>
    </Card>
  )
}

// 2FA Verification Modal for Login
interface TwoFactorVerificationProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (code: string) => Promise<boolean>
  onUseBackupCode?: (code: string) => Promise<boolean>
}

export function TwoFactorVerification({ 
  isOpen, 
  onClose, 
  onVerify, 
  onUseBackupCode 
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  
  const handleVerify = async () => {
    if (!code || (useBackupCode ? code.length !== 8 : code.length !== 6)) {
      setError(`Please enter a valid ${useBackupCode ? '8-character backup' : '6-digit'} code`)
      return
    }
    
    setIsVerifying(true)
    setError('')
    
    try {
      const success = useBackupCode && onUseBackupCode ? 
        await onUseBackupCode(code) : 
        await onVerify(code)
      
      if (success) {
        onClose()
      } else {
        setError('Invalid code. Please try again.')
      }
    } catch (error) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Enter your {useBackupCode ? 'backup code' : 'authenticator code'} to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="authCode">
              {useBackupCode ? 'Backup Code' : 'Authenticator Code'}
            </Label>
            <Input
              id="authCode"
              value={code}
              onChange={(e) => {
                const value = useBackupCode ? 
                  e.target.value.toUpperCase().slice(0, 8) :
                  e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(value)
                setError('')
              }}
              placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
              className="text-center text-lg font-mono"
              maxLength={useBackupCode ? 8 : 6}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleVerify}
              disabled={
                (useBackupCode ? code.length !== 8 : code.length !== 6) || 
                isVerifying
              }
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                setUseBackupCode(!useBackupCode)
                setCode('')
                setError('')
              }}
              className="text-sm"
            >
              {useBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}