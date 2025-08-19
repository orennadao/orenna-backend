'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const [mounted, setMounted] = useState(false)
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted && token) {
      verifyEmailToken(token)
    }
  }, [token, mounted])
  
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])
  
  const verifyEmailToken = async (verificationToken: string) => {
    setVerificationStatus('verifying')
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })
      
      if (response.ok) {
        setVerificationStatus('success')
        // Redirect to profile setup after 3 seconds
        setTimeout(() => {
          router.push('/auth/profile-setup')
        }, 3000)
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Verification failed')
        setVerificationStatus('error')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setErrorMessage('Network error occurred')
      setVerificationStatus('error')
    }
  }
  
  const handleResendVerification = async () => {
    if (!resendEmail) return
    
    setIsResending(true)
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      })
      
      if (response.ok) {
        setResendCooldown(60) // 60 second cooldown
        alert('Verification email sent! Please check your inbox.')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      console.error('Resend error:', error)
      alert('Network error occurred')
    } finally {
      setIsResending(false)
    }
  }
  
  const renderContent = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <div className="text-center">
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to your email address. Click the link to verify your account.
            </p>
            {email && (
              <p className="text-sm text-gray-500 mb-4">
                Verification email sent to: <strong>{email}</strong>
              </p>
            )}
            <div className="space-y-4">
              <div>
                <Label htmlFor="resendEmail">Didn't receive the email? Enter your email to resend:</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="resendEmail"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                  <Button
                    onClick={handleResendVerification}
                    disabled={!resendEmail || isResending || resendCooldown > 0}
                    variant="outline"
                  >
                    {isResending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : resendCooldown > 0 ? (
                      `Wait ${resendCooldown}s`
                    ) : (
                      'Resend'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'verifying':
        return (
          <div className="text-center">
            <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Verifying Your Email</h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        )
      
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Email Verified Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your email has been verified. You can now complete your profile setup.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                Redirecting to profile setup in 3 seconds...
              </p>
            </div>
            <Button onClick={() => router.push('/auth/profile-setup')}>
              Continue to Profile Setup
            </Button>
          </div>
        )
      
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">
              {errorMessage || 'The verification link is invalid or has expired.'}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                Common reasons for verification failure:
              </p>
              <ul className="text-red-700 text-sm mt-2 list-disc list-inside">
                <li>The verification link has expired (links expire after 24 hours)</li>
                <li>The link has already been used</li>
                <li>The link was corrupted when copied</li>
              </ul>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="resendEmail">Request a new verification email:</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="resendEmail"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                  <Button
                    onClick={handleResendVerification}
                    disabled={!resendEmail || isResending || resendCooldown > 0}
                    variant="outline"
                  >
                    {isResending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : resendCooldown > 0 ? (
                      `Wait ${resendCooldown}s`
                    ) : (
                      'Resend'
                    )}
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/auth/register')}
                className="w-full"
              >
                Return to Registration
              </Button>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Preparing email verification
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              Verify your email to complete your VWB platform registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Preparing email verification
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}