'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Image, CheckCircle } from 'lucide-react'

const DOCUMENT_TYPES = [
  { value: 'government_id', label: 'Government ID', required: true },
  { value: 'business_license', label: 'Business License', required: false },
  { value: 'professional_certification', label: 'Professional Certification', required: false },
  { value: 'tax_document', label: 'Tax Document', required: false },
  { value: 'kyc_document', label: 'KYC Document', required: true },
  { value: 'corporate_registration', label: 'Corporate Registration', required: false },
  { value: 'water_rights_documentation', label: 'Water Rights Documentation', required: false },
  { value: 'environmental_permit', label: 'Environmental Permit', required: false }
]

interface UploadedDocument {
  id: string
  file: File
  type: string
  description: string
  uploadProgress: number
  status: 'uploading' | 'completed' | 'error'
}

export default function ProfileSetupPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  const [formData, setFormData] = useState({
    profilePhoto: null as File | null,
    bio: '',
    linkedinUrl: '',
    websiteUrl: '',
    expertise: [] as string[],
    languages: [] as string[],
    timezone: '',
    preferredContactMethod: '',
    notificationPreferences: {
      email: true,
      sms: false,
      inApp: true
    }
  })
  
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleFileUpload = (files: FileList | null, documentType: string) => {
    if (!files) return
    
    Array.from(files).forEach(file => {
      const newDocument: UploadedDocument = {
        id: Math.random().toString(36),
        file,
        type: documentType,
        description: '',
        uploadProgress: 0,
        status: 'uploading'
      }
      
      setDocuments(prev => [...prev, newDocument])
      
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setDocuments(prev => prev.map(doc => {
          if (doc.id === newDocument.id) {
            const newProgress = Math.min(doc.uploadProgress + 10, 100)
            return {
              ...doc,
              uploadProgress: newProgress,
              status: newProgress === 100 ? 'completed' : 'uploading'
            }
          }
          return doc
        }))
      }, 200)
      
      // Clear interval when upload completes
      setTimeout(() => {
        clearInterval(uploadInterval)
      }, 2000)
    })
  }
  
  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }
  
  const updateDocumentDescription = (documentId: string, description: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, description } : doc
    ))
  }
  
  const addExpertise = (expertise: string) => {
    if (expertise && !formData.expertise.includes(expertise)) {
      handleInputChange('expertise', [...formData.expertise, expertise])
    }
  }
  
  const removeExpertise = (expertise: string) => {
    handleInputChange('expertise', formData.expertise.filter(e => e !== expertise))
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // TODO: Implement actual profile setup API call
      console.log('Profile setup data:', {
        formData,
        documents: documents.map(doc => ({
          type: doc.type,
          description: doc.description,
          fileName: doc.file.name,
          fileSize: doc.file.size
        }))
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Profile setup failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getRequiredDocuments = () => {
    return DOCUMENT_TYPES.filter(doc => doc.required)
  }
  
  const getUploadedDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.type === type)
  }
  
  const isRequiredDocumentUploaded = (type: string) => {
    return getUploadedDocumentsByType(type).some(doc => doc.status === 'completed')
  }
  
  const allRequiredDocumentsUploaded = () => {
    return getRequiredDocuments().every(doc => isRequiredDocumentUploaded(doc.value))
  }
  
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Preparing profile setup
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please complete registration and email verification first
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/auth/register')}>
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Finalize your VWB platform profile with verification documents
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            Step {currentStep} of 3: {
              currentStep === 1 ? 'Profile Information' :
              currentStep === 2 ? 'Verification Documents' :
              'Review & Submit'
            }
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                
                {/* Profile Photo */}
                <div>
                  <Label>Profile Photo</Label>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      {formData.profilePhoto ? (
                        <img
                          src={URL.createObjectURL(formData.profilePhoto)}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400">No photo</span>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleInputChange('profilePhoto', file)
                        }}
                        className="hidden"
                        id="profilePhoto"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('profilePhoto')?.click()}
                      >
                        Upload Photo
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Describe your professional background and expertise in water management or related fields"
                    rows={4}
                  />
                </div>
                
                {/* Professional Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                    <Input
                      id="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="websiteUrl">Website/Portfolio</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                      placeholder="https://your-website.com"
                    />
                  </div>
                </div>
                
                {/* Expertise */}
                <div>
                  <Label>Areas of Expertise</Label>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.expertise.map(exp => (
                        <Badge key={exp} variant="secondary" className="flex items-center gap-1">
                          {exp}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeExpertise(exp)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add expertise (e.g., Watershed Management)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addExpertise(e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addExpertise(input.value)
                          input.value = ''
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleInputChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                    <Select
                      value={formData.preferredContactMethod}
                      onValueChange={(value) => handleInputChange('preferredContactMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="platform">Platform Messages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
                <p className="text-gray-600 mb-6">
                  Upload the required verification documents to complete your profile setup.
                </p>
                
                {/* Required Documents */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Required Documents</h3>
                  {getRequiredDocuments().map(docType => (
                    <div key={docType.value} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          {docType.label}
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                          {isRequiredDocumentUploaded(docType.value) && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </h4>
                        <div>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleFileUpload(e.target.files, docType.value)}
                            className="hidden"
                            id={`upload-${docType.value}`}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById(`upload-${docType.value}`)?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      
                      {/* Show uploaded documents */}
                      {getUploadedDocumentsByType(docType.value).map(doc => (
                        <div key={doc.id} className="bg-gray-50 p-3 rounded mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {doc.file.type.startsWith('image/') ? (
                                <Image className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">{doc.file.name}</span>
                              <Badge variant={
                                doc.status === 'completed' ? 'default' :
                                doc.status === 'error' ? 'destructive' : 'secondary'
                              }>
                                {doc.status}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(doc.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {doc.status === 'uploading' && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${doc.uploadProgress}%` }}
                              />
                            </div>
                          )}
                          
                          <Input
                            placeholder="Add description (optional)"
                            value={doc.description}
                            onChange={(e) => updateDocumentDescription(doc.id, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                
                {/* Optional Documents */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Additional Documents (Optional)</h3>
                  {DOCUMENT_TYPES.filter(doc => !doc.required).map(docType => (
                    <div key={docType.value} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{docType.label}</h4>
                        <div>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleFileUpload(e.target.files, docType.value)}
                            className="hidden"
                            id={`upload-${docType.value}`}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById(`upload-${docType.value}`)?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      
                      {getUploadedDocumentsByType(docType.value).map(doc => (
                        <div key={doc.id} className="bg-gray-50 p-3 rounded mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">{doc.file.name}</span>
                              <Badge variant={doc.status === 'completed' ? 'default' : 'secondary'}>
                                {doc.status}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(doc.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Input
                            placeholder="Add description"
                            value={doc.description}
                            onChange={(e) => updateDocumentDescription(doc.id, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
                
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-medium text-green-800">Profile Setup Complete</h3>
                    </div>
                    <p className="text-green-700 text-sm">
                      Your profile information and verification documents are ready for submission.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Profile Summary</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Bio: {formData.bio ? 'Added' : 'Not provided'}</p>
                        <p>LinkedIn: {formData.linkedinUrl ? 'Added' : 'Not provided'}</p>
                        <p>Expertise: {formData.expertise.length} areas</p>
                        <p>Timezone: {formData.timezone || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Documents Uploaded</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Total documents: {documents.length}</p>
                        <p>Required documents: {getRequiredDocuments().filter(doc => isRequiredDocumentUploaded(doc.value)).length}/{getRequiredDocuments().length}</p>
                        <p>Status: {allRequiredDocumentsUploaded() ? 'Ready to submit' : 'Missing required documents'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {!allRequiredDocumentsUploaded() && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        Please upload all required documents before submitting your profile.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={currentStep === 2 && !allRequiredDocumentsUploaded()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allRequiredDocumentsUploaded() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Profile Setup'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}