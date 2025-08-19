'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
  Alert,
  AlertDescription,
} from '@orenna/ui';
import { type EvidenceSubmission, type Project, type VerificationMethod } from '@orenna/api-client';
import { EvidenceUpload } from './evidence-upload';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Calendar,
  Droplets,
  FileText,
  Calculator,
  Save,
  Send
} from 'lucide-react';

const VERIFICATION_STEPS = [
  { id: 'project-info', title: 'Project Information', icon: FileText },
  { id: 'baseline', title: 'Baseline Assessment', icon: Calculator },
  { id: 'methodology', title: 'Methodology Selection', icon: Droplets },
  { id: 'measurements', title: 'Water Measurements', icon: MapPin },
  { id: 'evidence', title: 'Evidence Upload', icon: FileText },
  { id: 'review', title: 'Review & Submit', icon: CheckCircle },
];

const DEFAULT_EVIDENCE_TYPES = [
  'WATER_MEASUREMENT_DATA',
  'BASELINE_ASSESSMENT', 
  'SITE_VERIFICATION',
  'GPS_COORDINATES',
  'METHODOLOGY_DOCUMENTATION'
];

const verificationSchema = z.object({
  // Project Information
  projectDescription: z.string().min(10, 'Project description must be at least 10 characters'),
  projectLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  implementationPeriod: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  }),
  
  // Baseline Assessment
  baselineWaterUse: z.number().min(0, 'Baseline water use must be positive'),
  baselineMethod: z.enum(['historical_data', 'modeling', 'measurement']),
  baselineNotes: z.string().optional(),
  
  // Methodology Selection
  selectedMethodId: z.string().min(1, 'Verification method is required'),
  verificationMethod: z.enum(['direct_measurement', 'indirect_calculation', 'modeling']).optional(),
  measurementFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  qualityAssurance: z.string().min(1, 'Quality assurance plan is required'),
  
  // Water Measurements
  totalWaterSaved: z.number().min(0, 'Water saved must be positive'),
  measurementUnit: z.enum(['liters', 'cubic_meters', 'gallons']),
  measurementPeriod: z.string().min(1, 'Measurement period is required'),
  uncertaintyAssessment: z.string().optional(),
  
  // Validator Information
  validatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  validatorName: z.string().optional(),
  validatorNotes: z.string().optional(),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface VerificationWizardProps {
  projectId: number;
  project: Project;
  availableMethods: VerificationMethod[];
  initialData?: any;
  onSave: (data: any) => void;
  onComplete: (data: any) => Promise<void>;
  onExit: () => void;
  isSubmitting: boolean;
}

export function VerificationWizard({
  projectId,
  project,
  availableMethods,
  initialData,
  onSave,
  onComplete,
  onExit,
  isSubmitting
}: VerificationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceSubmission[]>([]);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      projectDescription: initialData?.projectDescription || '',
      projectLocation: initialData?.projectLocation || {
        latitude: 0,
        longitude: 0,
        address: '',
      },
      implementationPeriod: initialData?.implementationPeriod || {
        startDate: '',
        endDate: '',
      },
      baselineWaterUse: initialData?.baselineWaterUse || 0,
      baselineMethod: initialData?.baselineMethod || 'historical_data',
      baselineNotes: initialData?.baselineNotes || '',
      selectedMethodId: initialData?.selectedMethodId || '',
      verificationMethod: initialData?.verificationMethod || 'direct_measurement',
      measurementFrequency: initialData?.measurementFrequency || 'monthly',
      qualityAssurance: initialData?.qualityAssurance || '',
      totalWaterSaved: initialData?.totalWaterSaved || 0,
      measurementUnit: initialData?.measurementUnit || 'cubic_meters',
      measurementPeriod: initialData?.measurementPeriod || '',
      uncertaintyAssessment: initialData?.uncertaintyAssessment || '',
      validatorAddress: initialData?.validatorAddress || '',
      validatorName: initialData?.validatorName || '',
      validatorNotes: initialData?.validatorNotes || '',
    },
  });

  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch((data) => {
      const formData = {
        ...data,
        evidence: evidenceFiles,
        currentStep,
        lastUpdated: new Date().toISOString(),
      };
      onSave(formData);
    });
    return () => subscription.unsubscribe();
  }, [form, evidenceFiles, currentStep, onSave]);

  // Validate current step
  const validateCurrentStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fields);
    setStepValidation(prev => ({ ...prev, [currentStep]: isValid }));
    return isValid;
  };

  const getFieldsForStep = (stepIndex: number): (keyof VerificationFormData)[] => {
    switch (stepIndex) {
      case 0: // Project Info
        return ['projectDescription', 'projectLocation', 'implementationPeriod'];
      case 1: // Baseline
        return ['baselineWaterUse', 'baselineMethod'];
      case 2: // Methodology
        return ['selectedMethodId', 'measurementFrequency', 'qualityAssurance'];
      case 3: // Measurements
        return ['totalWaterSaved', 'measurementUnit', 'measurementPeriod'];
      case 4: // Evidence
        return [];
      case 5: // Review
        return ['validatorAddress'];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < VERIFICATION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) {
      return;
    }

    const formData = form.getValues();
    const submissionData = {
      ...formData,
      evidence: evidenceFiles,
      liftTokenId: project.liftTokenId,
      projectId,
      methodId: formData.selectedMethodId,
      submittedAt: new Date().toISOString(),
    };

    await onComplete(submissionData);
  };

  const progress = ((currentStep + 1) / VERIFICATION_STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderProjectInfoStep();
      case 1:
        return renderBaselineStep();
      case 2:
        return renderMethodologyStep();
      case 3:
        return renderMeasurementsStep();
      case 4:
        return renderEvidenceStep();
      case 5:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderProjectInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Project Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Provide basic information about your water benefit project.
        </p>
      </div>

      <FormField
        control={form.control}
        name="projectDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the water conservation or restoration project..."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Provide a detailed description of the project activities and objectives
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="projectLocation.latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 37.7749"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectLocation.longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., -122.4194"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="projectLocation.address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="123 Main St, City, State, Country" {...field} />
            </FormControl>
            <FormDescription>
              Human-readable location description
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="implementationPeriod.startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Implementation Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="implementationPeriod.endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Implementation End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderBaselineStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Baseline Assessment</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Establish the baseline water use conditions before project implementation.
        </p>
      </div>

      <FormField
        control={form.control}
        name="baselineWaterUse"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Baseline Water Use</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 1000"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>
              Annual water use in cubic meters before project implementation
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="baselineMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Baseline Assessment Method</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="historical_data">Historical Data Analysis</SelectItem>
                <SelectItem value="modeling">Water Use Modeling</SelectItem>
                <SelectItem value="measurement">Direct Measurement</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Method used to determine baseline water use
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="baselineNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Baseline Assessment Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Additional details about the baseline assessment methodology..."
                {...field}
              />
            </FormControl>
            <FormDescription>
              Provide details about data sources, assumptions, and limitations
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderMethodologyStep = () => {
    const selectedMethod = availableMethods.find(m => m.methodId === form.watch('selectedMethodId'));
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Verification Methodology</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Select an approved verification methodology for measuring and verifying water benefits.
          </p>
        </div>

        <FormField
          control={form.control}
          name="selectedMethodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Method</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableMethods.filter(method => method.active).map((method) => (
                    <SelectItem key={method.methodId} value={method.methodId}>
                      {method.name} (v{method.version || '1.0'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose from approved verification methodologies
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedMethod && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{selectedMethod.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {selectedMethod.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Required Evidence:</p>
                  <ul className="text-muted-foreground mt-1">
                    {selectedMethod.criteria.requiredEvidenceTypes.map((type) => (
                      <li key={type} className="text-xs">
                        • {type.replace(/_/g, ' ').toLowerCase()}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Requirements:</p>
                  <div className="text-muted-foreground mt-1 space-y-1">
                    <p className="text-xs">
                      Min. Confidence: {(selectedMethod.criteria.minimumConfidence * 100).toFixed(0)}%
                    </p>
                    {selectedMethod.criteria.validationPeriod && (
                      <p className="text-xs">
                        Valid for: {selectedMethod.criteria.validationPeriod} days
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="measurementFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Measurement Frequency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How often measurements or assessments are performed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qualityAssurance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quality Assurance Plan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe quality control measures, calibration procedures, data validation..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detail the quality assurance and quality control procedures
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  const renderMeasurementsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Water Measurements</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Report the quantified water benefits from your project.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="totalWaterSaved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Water Saved/Restored</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="measurementUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Measurement Unit</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="liters">Liters</SelectItem>
                  <SelectItem value="cubic_meters">Cubic Meters</SelectItem>
                  <SelectItem value="gallons">Gallons</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="measurementPeriod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Measurement Period</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., January 2024 - December 2024"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Time period over which the water benefits were measured
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="uncertaintyAssessment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Uncertainty Assessment</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Discuss measurement uncertainties, confidence intervals, error sources..."
                {...field}
              />
            </FormControl>
            <FormDescription>
              Quantify and describe uncertainties in the water benefit calculations
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderEvidenceStep = () => {
    const selectedMethod = availableMethods.find(m => m.methodId === form.watch('selectedMethodId'));
    const requiredTypes = selectedMethod?.criteria.requiredEvidenceTypes || DEFAULT_EVIDENCE_TYPES;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Evidence Upload</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Upload supporting evidence for your verification request using the selected methodology.
          </p>
        </div>

        {selectedMethod && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Required Evidence for {selectedMethod.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {requiredTypes.map((type) => (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{type.replace(/_/g, ' ').toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <EvidenceUpload
          requiredTypes={requiredTypes}
          onFilesChange={setEvidenceFiles}
          files={evidenceFiles}
        />

        {evidenceFiles.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please upload at least one evidence file to support your verification request.
              {selectedMethod 
                ? `This ${selectedMethod.name} methodology requires specific evidence types as listed above.`
                : 'Required evidence types include water measurement data, baseline assessment, site verification, GPS coordinates, and methodology documentation.'
              }
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderReviewStep = () => {
    const formData = form.getValues();
    const selectedMethod = availableMethods.find(m => m.methodId === formData.selectedMethodId);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Review your verification request before submission.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Project Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Water Saved:</span> {formData.totalWaterSaved} {formData.measurementUnit}
              </div>
              <div>
                <span className="font-medium">Method:</span> {selectedMethod?.name || 'Not selected'}
              </div>
              <div>
                <span className="font-medium">Period:</span> {formData.measurementPeriod}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Evidence Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Files:</span> {evidenceFiles.length} uploaded
              </div>
              <div>
                <span className="font-medium">Types:</span>{' '}
                {[...new Set(evidenceFiles.map(f => f.evidenceType))].length} of {selectedMethod?.criteria.requiredEvidenceTypes.length || DEFAULT_EVIDENCE_TYPES.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validator Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="validatorAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validator Address</FormLabel>
                <FormControl>
                  <Input placeholder="0x..." {...field} />
                </FormControl>
                <FormDescription>
                  Ethereum address of the validator who will verify this request
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="validatorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validator Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Organization or individual name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="validatorNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information for the validator..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submission Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pre-Submission Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Project information completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Baseline assessment documented</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {formData.selectedMethodId ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Verification methodology selected</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Water measurements reported</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {evidenceFiles.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span>Evidence files uploaded ({evidenceFiles.length})</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {formData.validatorAddress ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Validator address provided</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Verification Wizard</h2>
            <p className="text-muted-foreground">Step {currentStep + 1} of {VERIFICATION_STEPS.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Progress</p>
            <p className="text-lg font-semibold">{Math.round(progress)}%</p>
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between mt-4">
          {VERIFICATION_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isValid = stepValidation[index];
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                      ? isValid === false 
                        ? 'border-red-500 bg-red-50 text-red-500'
                        : 'border-primary bg-primary text-white' 
                      : 'border-muted bg-muted text-muted-foreground'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <p className={`text-xs mt-2 text-center max-w-20 ${
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Form {...form}>
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>
      </Form>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onExit}
            disabled={isSubmitting}
          >
            Exit Wizard
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onSave({ 
              ...form.getValues(), 
              evidence: evidenceFiles, 
              currentStep,
              lastSaved: new Date().toISOString() 
            })}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < VERIFICATION_STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !form.formState.isValid || evidenceFiles.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Verification
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Export with the expected name
export { VerificationWizard as VWBAVerificationWizard };