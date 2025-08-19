'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Key, 
  Mail, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  FileText,
  Upload,
  User
} from 'lucide-react'

interface AccountRecoveryProps {
  onComplete?: () => void
}

export function AccountRecovery({ onComplete }: AccountRecoveryProps) {
  const [step, setStep] = useState<'method' | 'email' | 'documents' | 'verification' | 'success'>('method')
  const [recoveryMethod, setRecoveryMethod] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    companyName: '',
    lastKnownWallet: '',
    description: '',
    contactNumber: '',
    verificationDocuments: [] as File[]
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }
  
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    
    const newFiles = Array.from(files)
    setFormData(prev => ({
      ...prev,
      verificationDocuments: [...prev.verificationDocuments, ...newFiles]
    }))
  }
  
  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      verificationDocuments: prev.verificationDocuments.filter((_, i) => i !== index)
    }))
  }
  
  const submitEmailRecovery = async () => {
    if (!formData.email) {
      setError('Email address is required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/recovery/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })
      
      if (response.ok) {
        setStep('verification')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send recovery email')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const submitDocumentRecovery = async () => {
    if (!formData.fullName || !formData.email || !formData.description) {
      setError('Please fill in all required fields')
      return
    }
    
    if (formData.verificationDocuments.length === 0) {
      setError('Please upload at least one verification document')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // TODO: Replace with actual API call
      const formDataToSend = new FormData()
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('companyName', formData.companyName)
      formDataToSend.append('lastKnownWallet', formData.lastKnownWallet)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('contactNumber', formData.contactNumber)
      
      formData.verificationDocuments.forEach((file, index) => {
        formDataToSend.append(`documents[${index}]`, file)
      })
      
      const response = await fetch('/api/auth/recovery/documents', {
        method: 'POST',
        body: formDataToSend
      })
      
      if (response.ok) {
        setStep('success')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit recovery request')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const verifyRecoveryCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/recovery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          code: verificationCode 
        })
      })
      
      if (response.ok) {
        setStep('success')
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const renderStep = () => {
    switch (step) {
      case 'method':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Key className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Account Recovery</h3>
              <p className="text-gray-600 text-sm">
                Choose a method to recover access to your VWB platform account
              </p>
            </div>
            
            <div className="space-y-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  recoveryMethod === 'email' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setRecoveryMethod('email')}
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Email Recovery</h4>
                    <p className="text-sm text-gray-600">
                      Recover using your registered email address
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  recoveryMethod === 'documents' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setRecoveryMethod('documents')}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Document Verification</h4>
                    <p className="text-sm text-gray-600">
                      Recover using identity verification documents
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription className="text-sm">
                For security reasons, account recovery may take 24-48 hours to process and verify.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => {
                if (recoveryMethod === 'email') setStep('email')
                else if (recoveryMethod === 'documents') setStep('documents')
              }}
              disabled={!recoveryMethod}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )
      
      case 'email':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Mail className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Email Recovery</h3>
              <p className="text-gray-600 text-sm">
                Enter your registered email address to receive recovery instructions
              </p>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your registered email"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Recovery instructions will be sent to your email. Make sure you have access to this email account.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('method')}>
                Back
              </Button>
              <Button 
                onClick={submitEmailRecovery}
                disabled={!formData.email || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Sending...' : 'Send Recovery Email'}
              </Button>
            </div>
          </div>
        )
      
      case 'documents':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Document Verification</h3>
              <p className="text-gray-600 text-sm">
                Provide verification documents to recover your account
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Your full legal name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Your registered email"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company/Organization</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="Phone number for verification"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="lastKnownWallet">Last Known Wallet Address</Label>
              <Input
                id="lastKnownWallet"
                value={formData.lastKnownWallet}
                onChange={(e) => handleInputChange('lastKnownWallet', e.target.value)}
                placeholder="0x... (if you remember it)"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Describe Your Situation *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Explain how you lost access to your account and any relevant details that might help verify your identity"
                rows={4}
              />
            </div>
            
            <div>
              <Label>Verification Documents *</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload documents that can verify your identity
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Accepted: Government ID, Business License, Previous Verification Documents
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="documents"
                />
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('documents')?.click()}
                >
                  Choose Files
                </Button>
              </div>
              
              {formData.verificationDocuments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {formData.verificationDocuments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription className="text-sm">
                All documents will be securely processed and deleted after verification. Recovery requests are manually reviewed within 24-48 hours.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('method')}>
                Back
              </Button>
              <Button 
                onClick={submitDocumentRecovery}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Recovery Request'}
              </Button>
            </div>
          </div>
        )
      
      case 'verification':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Mail className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Check Your Email</h3>
              <p className="text-gray-600 text-sm">
                We've sent a verification code to {formData.email}
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
            
            <Button 
              onClick={verifyRecoveryCode}
              disabled={verificationCode.length !== 6 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </Button>
            
            <div className="text-center">
              <Button variant="ghost" onClick={submitEmailRecovery} className="text-sm">
                Resend verification code
              </Button>
            </div>
          </div>
        )
      
      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Recovery Request Submitted</h3>
              <p className="text-gray-600 mt-1">
                {recoveryMethod === 'email' 
                  ? 'Recovery instructions have been sent to your email.'
                  : 'Your recovery request has been submitted for review.'
                }
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
              <ul className="text-green-800 text-sm space-y-1">
                {recoveryMethod === 'email' ? (
                  <>
                    <li>• Check your email for recovery instructions</li>
                    <li>• Follow the secure link to regain access</li>
                    <li>• Set up new authentication methods</li>
                  </>
                ) : (
                  <>
                    <li>• Our team will review your documents within 24-48 hours</li>
                    <li>• You'll receive an email update on the status</li>
                    <li>• Additional verification may be required</li>
                  </>
                )}
              </ul>
            </div>
            
            <Button onClick={onComplete} className="w-full">
              Return to Login
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Account Recovery
        </CardTitle>
        <CardDescription>
          Regain access to your VWB platform account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStep()}
      </CardContent>
    </Card>
  )
}