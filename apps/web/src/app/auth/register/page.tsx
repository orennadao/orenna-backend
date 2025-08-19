'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

const USER_ROLES = [
  { value: 'water_project_developer', label: 'Project Delivery Partner' },
  { value: 'corporate_buyer', label: 'Funding Partner' },
  { value: 'water_benefit_verifier', label: 'Verifier' },
  { value: 'watershed_manager', label: 'Project Owner' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'administrator', label: 'Administrator' }
]

const CORPORATE_BUYER_TYPES = [
  { value: 'google', label: 'Google' },
  { value: 'enterprise', label: 'Other Enterprise' },
  { value: 'nonprofit', label: 'Non-profit Organization' }
]

export default function RegisterPage() {
  const { isConnected, isAuthenticated } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    
    // Role and Organization
    role: '',
    companyName: '',
    organizationType: '',
    position: '',
    
    // Role-specific fields
    watershedLocation: '',
    sustainabilityGoals: '',
    verificationExperience: '',
    certifications: '',
    
    // Legal and Compliance
    acceptedTerms: false,
    acceptedPrivacy: false,
    complianceDocuments: [] as File[]
  })
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // TODO: Implement actual registration API call
      console.log('Registration data:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to profile setup
      router.push('/auth/profile-setup')
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'water_project_developer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="watershedLocation">Primary Watershed Location</Label>
              <Input
                id="watershedLocation"
                value={formData.watershedLocation}
                onChange={(e) => handleInputChange('watershedLocation', e.target.value)}
                placeholder="e.g., Colorado River Basin, California Central Valley"
              />
            </div>
            <div>
              <Label htmlFor="certifications">Relevant Certifications</Label>
              <Textarea
                id="certifications"
                value={formData.certifications}
                onChange={(e) => handleInputChange('certifications', e.target.value)}
                placeholder="List any water management, environmental, or project development certifications"
                rows={3}
              />
            </div>
          </div>
        )
      
      case 'corporate_buyer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="organizationType">Organization Type</Label>
              <Select
                value={formData.organizationType}
                onValueChange={(value) => handleInputChange('organizationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  {CORPORATE_BUYER_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sustainabilityGoals">Water Stewardship Goals</Label>
              <Textarea
                id="sustainabilityGoals"
                value={formData.sustainabilityGoals}
                onChange={(e) => handleInputChange('sustainabilityGoals', e.target.value)}
                placeholder="Describe your organization's water positive commitments and sustainability targets"
                rows={4}
              />
            </div>
          </div>
        )
      
      case 'water_benefit_verifier':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="verificationExperience">Verification Experience</Label>
              <Textarea
                id="verificationExperience"
                value={formData.verificationExperience}
                onChange={(e) => handleInputChange('verificationExperience', e.target.value)}
                placeholder="Describe your experience with water measurement, hydrological assessment, and verification protocols"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="certifications">Professional Certifications</Label>
              <Textarea
                id="certifications"
                value={formData.certifications}
                onChange={(e) => handleInputChange('certifications', e.target.value)}
                placeholder="List relevant certifications (e.g., Professional Engineer, Certified Water Quality Analyst, etc.)"
                rows={3}
              />
            </div>
          </div>
        )
      
      case 'watershed_manager':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="watershedLocation">Managed Watershed Areas</Label>
              <Textarea
                id="watershedLocation"
                value={formData.watershedLocation}
                onChange={(e) => handleInputChange('watershedLocation', e.target.value)}
                placeholder="List the watershed areas you manage or oversee"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="certifications">Management Credentials</Label>
              <Textarea
                id="certifications"
                value={formData.certifications}
                onChange={(e) => handleInputChange('certifications', e.target.value)}
                placeholder="Describe your watershed management experience and credentials"
                rows={3}
              />
            </div>
          </div>
        )
      
      case 'stakeholder':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="stakeholderType">Stakeholder Type</Label>
              <Select
                value={formData.organizationType}
                onValueChange={(value) => handleInputChange('organizationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stakeholder type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Investor</SelectItem>
                  <SelectItem value="institutional">Institutional Investor</SelectItem>
                  <SelectItem value="community">Community Organization</SelectItem>
                  <SelectItem value="foundation">Foundation/NGO</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="investmentInterest">Investment Interest</Label>
              <Textarea
                id="investmentInterest"
                value={formData.sustainabilityGoals}
                onChange={(e) => handleInputChange('sustainabilityGoals', e.target.value)}
                placeholder="Describe your interest in water benefit investments and retirement goals"
                rows={3}
              />
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Preparing registration form
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Connect Wallet Required</CardTitle>
            <CardDescription>
              Please connect your wallet before registering for the VWB platform
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/auth')}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join the VWB Platform</h1>
          <p className="mt-2 text-gray-600">
            Register to participate in the Volumetric Water Benefit marketplace
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((step) => (
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
            Step {currentStep} of 4: {
              currentStep === 1 ? 'Basic Information' :
              currentStep === 2 ? 'Role & Organization' :
              currentStep === 3 ? 'Role-Specific Details' :
              'Legal & Compliance'
            }
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Role & Organization</h2>
                <div>
                  <Label htmlFor="role">Platform Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role on the platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="companyName">Company/Organization Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position/Title</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Role-Specific Details</h2>
                {formData.role ? (
                  renderRoleSpecificFields()
                ) : (
                  <p className="text-gray-500">Please select a role in the previous step.</p>
                )}
              </div>
            )}
            
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Legal & Compliance</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptedTerms"
                      checked={formData.acceptedTerms}
                      onCheckedChange={(checked) => handleInputChange('acceptedTerms', checked)}
                    />
                    <Label htmlFor="acceptedTerms" className="text-sm leading-normal">
                      I agree to the VWB Platform Terms of Service and Water Benefit Transfer Agreement *
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptedPrivacy"
                      checked={formData.acceptedPrivacy}
                      onCheckedChange={(checked) => handleInputChange('acceptedPrivacy', checked)}
                    />
                    <Label htmlFor="acceptedPrivacy" className="text-sm leading-normal">
                      I agree to the Privacy Policy and consent to data processing for water benefit transactions *
                    </Label>
                  </div>
                  <div>
                    <Label>Compliance Documentation</Label>
                    <div className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <p className="text-sm text-gray-600">
                        Upload any required compliance documents (KYC/AML, corporate registration, etc.)
                      </p>
                      <Button variant="outline" className="mt-2">
                        Choose Files
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && (!formData.firstName || !formData.lastName || !formData.email)) ||
                    (currentStep === 2 && (!formData.role || !formData.companyName))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.acceptedTerms || 
                    !formData.acceptedPrivacy || 
                    isSubmitting
                  }
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}