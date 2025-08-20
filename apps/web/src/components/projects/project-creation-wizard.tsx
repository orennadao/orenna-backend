'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Droplets,
  Leaf,
  Zap,
  Building,
  MapPin,
  Calendar,
  FileText,
  ArrowLeft,
  Upload,
  Hash
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { WalletConnectButton } from '@/components/auth/wallet-connect-button';
import { apiClient } from '@/lib/api';

const PROJECT_STEPS = [
  { id: 'type', title: 'Project Type', icon: FileText },
  { id: 'basic', title: 'Basic Information', icon: Building },
  { id: 'location', title: 'Location & Timeline', icon: MapPin },
  { id: 'details', title: 'Project Details', icon: Calendar },
  { id: 'review', title: 'Review & Submit', icon: CheckCircle },
];

const PROJECT_TYPES = [
  {
    id: 'water',
    name: 'Water Conservation',
    description: 'Water stewardship, conservation, and restoration projects',
    icon: Droplets,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'carbon',
    name: 'Carbon Sequestration',
    description: 'Forest restoration, afforestation, and carbon credit projects',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'energy',
    name: 'Renewable Energy',
    description: 'Clean energy generation and energy efficiency projects',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    id: 'mixed',
    name: 'Mixed Impact',
    description: 'Multi-benefit projects combining different environmental impacts',
    icon: Building,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export function ProjectCreationWizard() {
  const router = useRouter();
  const { user, isConnected } = useAuth();
  const address = user?.address || '0x742d35Cc6Cb32bc0bC8A9C4E33B8b88e5234f890'; // Mock address for testing
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate owner address and registry data when wallet connects
  useEffect(() => {
    if (address) {
      // Generate registry data automatically based on project data
      const baseURI = `${window.location.origin}/api/projects`;
      setFormData(prev => ({ 
        ...prev, 
        ownerAddress: address,
        // Auto-generate registry data - these will be populated when NFT is minted
        tokenURI: `${baseURI}/{id}/metadata`,
        registryDataURI: `${baseURI}/{id}/registry-data`,
        dataHash: `0x${Math.random().toString(16).slice(2, 66).padEnd(64, '0')}` // Placeholder hash
      }));
    }
  }, [address]);
  
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    category: '',
    address: '',
    city: '',
    state: '',
    country: '',
    startDate: '',
    endDate: '',
    expectedImpact: '',
    methodology: '',
    budget: '',
    fundingTarget: '',
    stakeholders: '',
    riskAssessment: '',
    // ProjectNFT specific fields
    ownerAddress: '',
    tokenURI: '',
    registryDataURI: '',
    dataHash: '',
    chainId: 8453, // Base mainnet
    schemaVersion: 1
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Project Type
        return formData.type !== '';
      case 1: // Basic Information
        return formData.name.trim().length >= 3 && formData.description.trim().length >= 10 && isConnected;
      case 2: // Location & Timeline
        return formData.address.trim() && formData.city.trim() && formData.country.trim() && formData.startDate && formData.endDate;
      case 3: // Project Details
        return formData.expectedImpact.trim().length >= 10;
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < PROJECT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet to create a project');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const projectData = {
        ownerAddress: address,
        tokenURI: formData.tokenURI,
        registryDataURI: formData.registryDataURI,
        dataHash: formData.dataHash,
        chainId: formData.chainId,
        schemaVersion: formData.schemaVersion,
        // Legacy fields for backward compatibility
        name: formData.name,
        description: formData.description,
      };

      const result = await apiClient.request('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
      
      // Redirect to the created project
      router.push(`/projects/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / PROJECT_STEPS.length) * 100;
  const selectedProjectType = PROJECT_TYPES.find(type => type.id === formData.type);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderProjectTypeStep();
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderLocationTimelineStep();
      case 3:
        return renderProjectDetailsStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderProjectTypeStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Project Type</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose the primary focus of your regenerative finance project.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROJECT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = formData.type === type.id;
          
          return (
            <div
              key={type.id}
              className={`
                cursor-pointer rounded-lg border-2 p-6 transition-colors
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }
              `}
              onClick={() => handleInputChange('type', type.id)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${type.bgColor}`}>
                  <Icon className={`h-6 w-6 ${type.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{type.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {type.description}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide basic details about your project and connect your wallet.
        </p>
      </div>

      {/* Wallet Connection */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <Label className="text-sm font-medium">Wallet Connection *</Label>
        <div className="mt-2">
          {isConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected wallet:</p>
                <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                <WalletConnectButton />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Connect your wallet to continue</p>
              <WalletConnectButton />
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          placeholder="Enter a descriptive project name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`mt-1 ${formData.name.trim().length >= 3 ? 'border-green-500' : formData.name.length > 0 ? 'border-red-500' : ''}`}
        />
        <p className="text-xs text-gray-600 mt-1">
          Choose a clear, descriptive name for your project (minimum 3 characters)
          {formData.name.length > 0 && (
            <span className={formData.name.trim().length >= 3 ? 'text-green-600' : 'text-red-600'}>
              {' '}({formData.name.trim().length}/3)
            </span>
          )}
        </p>
      </div>

      <div>
        <Label htmlFor="description">Project Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the goals, activities, and expected outcomes of your project..."
          rows={4}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={`mt-1 ${formData.description.trim().length >= 10 ? 'border-green-500' : formData.description.length > 0 ? 'border-red-500' : ''}`}
        />
        <p className="text-xs text-gray-600 mt-1">
          Provide a comprehensive overview of your project's objectives and approach (minimum 10 characters)
          {formData.description.length > 0 && (
            <span className={formData.description.trim().length >= 10 ? 'text-green-600' : 'text-red-600'}>
              {' '}({formData.description.trim().length}/10)
            </span>
          )}
        </p>
      </div>

      {selectedProjectType && (
        <div>
          <Label htmlFor="category">Project Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange('category', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {selectedProjectType.id === 'water' && (
                <>
                  <SelectItem value="conservation">Water Conservation</SelectItem>
                  <SelectItem value="restoration">Watershed Restoration</SelectItem>
                  <SelectItem value="efficiency">Water Efficiency</SelectItem>
                  <SelectItem value="quality">Water Quality Improvement</SelectItem>
                </>
              )}
              {selectedProjectType.id === 'carbon' && (
                <>
                  <SelectItem value="reforestation">Reforestation</SelectItem>
                  <SelectItem value="afforestation">Afforestation</SelectItem>
                  <SelectItem value="agroforestry">Agroforestry</SelectItem>
                  <SelectItem value="soil">Soil Carbon</SelectItem>
                </>
              )}
              {selectedProjectType.id === 'energy' && (
                <>
                  <SelectItem value="solar">Solar Energy</SelectItem>
                  <SelectItem value="wind">Wind Energy</SelectItem>
                  <SelectItem value="efficiency">Energy Efficiency</SelectItem>
                  <SelectItem value="storage">Energy Storage</SelectItem>
                </>
              )}
              {selectedProjectType.id === 'mixed' && (
                <>
                  <SelectItem value="integrated">Integrated Systems</SelectItem>
                  <SelectItem value="regenerative">Regenerative Agriculture</SelectItem>
                  <SelectItem value="ecosystem">Ecosystem Restoration</SelectItem>
                  <SelectItem value="circular">Circular Economy</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600 mt-1">
            Specify the category that best describes your project
          </p>
        </div>
      )}
    </div>
  );

  const renderLocationTimelineStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Location & Timeline</h3>
        <p className="text-sm text-gray-600 mb-6">
          Specify where and when your project will take place.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Project Location</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              placeholder="Street address or area description"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              placeholder="City or municipality"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              placeholder="State or province"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              placeholder="Country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Project Timeline</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjectDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Project Details</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide detailed information about your project's impact and methodology.
        </p>
      </div>

      <div>
        <Label htmlFor="expectedImpact">Expected Impact *</Label>
        <Textarea
          id="expectedImpact"
          placeholder="Describe the expected environmental, social, and economic impacts..."
          rows={4}
          value={formData.expectedImpact}
          onChange={(e) => handleInputChange('expectedImpact', e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-gray-600 mt-1">
          Detail the measurable impacts your project aims to achieve
        </p>
      </div>

      <div>
        <Label htmlFor="methodology">Methodology (Optional)</Label>
        <Textarea
          id="methodology"
          placeholder="Describe the approach, methods, and techniques to be used..."
          rows={3}
          value={formData.methodology}
          onChange={(e) => handleInputChange('methodology', e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-gray-600 mt-1">
          Explain the technical approach and methods for achieving your project goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budget">Project Budget (Optional)</Label>
          <Input
            id="budget"
            type="number"
            step="0.01"
            placeholder="Total project cost"
            value={formData.budget}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-600 mt-1">
            Estimated total project cost in USD
          </p>
        </div>

        <div>
          <Label htmlFor="fundingTarget">Funding Target (Optional)</Label>
          <Input
            id="fundingTarget"
            type="number"
            step="0.01"
            placeholder="Amount seeking funding"
            value={formData.fundingTarget}
            onChange={(e) => handleInputChange('fundingTarget', e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-600 mt-1">
            Amount of funding sought in USD
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="stakeholders">Key Stakeholders (Optional)</Label>
        <Textarea
          id="stakeholders"
          placeholder="List key stakeholders, partners, and beneficiaries..."
          rows={3}
          value={formData.stakeholders}
          onChange={(e) => handleInputChange('stakeholders', e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-gray-600 mt-1">
          Identify important stakeholders and their roles in the project
        </p>
      </div>

      <div>
        <Label htmlFor="riskAssessment">Risk Assessment (Optional)</Label>
        <Textarea
          id="riskAssessment"
          placeholder="Identify potential risks and mitigation strategies..."
          rows={3}
          value={formData.riskAssessment}
          onChange={(e) => handleInputChange('riskAssessment', e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-gray-600 mt-1">
          Outline main risks and how they will be managed
        </p>
      </div>
    </div>
  );


  const renderReviewStep = () => {
    const selectedType = PROJECT_TYPES.find(type => type.id === formData.type);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
          <p className="text-sm text-gray-600 mb-6">
            Review your project details before submission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Project Overview</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Type:</span> {selectedType?.name}</div>
              <div><span className="font-medium">Name:</span> {formData.name}</div>
              <div><span className="font-medium">Category:</span> {formData.category || 'Not specified'}</div>
              <div><span className="font-medium">Location:</span> {formData.city}, {formData.country}</div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Timeline & Budget</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Start:</span> {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Not set'}</div>
              <div><span className="font-medium">End:</span> {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'Not set'}</div>
              <div><span className="font-medium">Budget:</span> {formData.budget ? `$${Number(formData.budget).toLocaleString()}` : 'Not specified'}</div>
              <div><span className="font-medium">Funding Target:</span> {formData.fundingTarget ? `$${Number(formData.fundingTarget).toLocaleString()}` : 'Not specified'}</div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Project Description</h4>
          <p className="text-sm text-gray-700">{formData.description}</p>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Expected Impact</h4>
          <p className="text-sm text-gray-700">{formData.expectedImpact}</p>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">Step {currentStep + 1} of {PROJECT_STEPS.length}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {PROJECT_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                ${isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isCurrent 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : 'border-gray-300 bg-white text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <p className={`text-xs mt-2 text-center max-w-20 ${
                isCurrent ? 'font-medium text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <Card className="p-6">
        {renderStepContent()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link href="/projects">
          <Button variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </Link>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < PROJECT_STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting || !validateCurrentStep()}
              title={!validateCurrentStep() ? 'Please complete all required fields' : ''}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !validateCurrentStep()}
              title={!validateCurrentStep() ? 'Please complete all required fields' : ''}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          )}
          
          {/* Debug validation state - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-2">
              Debug: Step {currentStep} valid: {validateCurrentStep().toString()}
              {currentStep === 1 && (
                <div>
                  Name: "{formData.name}" (length: {formData.name.trim().length}) | 
                  Description: "{formData.description}" (length: {formData.description.trim().length})
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}