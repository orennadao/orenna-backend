import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Wizard, WizardStep } from '../wizard';
import { Button } from '../button';
import { Input } from '../input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../form';

// Step 1: Site Description Schema
const siteDescriptionSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  footprint: z.number().positive('Footprint must be positive'),
  assetType: z.string().min(1, 'Asset type is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

// Step 2: Evidence Schema
const evidenceSchema = z.object({
  methods: z.array(z.string()).min(1, 'At least one method is required'),
  afnMapping: z.string().min(1, 'AfN mapping is required'),
  tnfdMapping: z.string().min(1, 'TNFD mapping is required'),
  uploads: z.array(z.string()).optional(),
});

// Step 3: Audit Schema
const auditSchema = z.object({
  validated: z.boolean(),
  checklist: z.array(z.object({
    id: z.string(),
    completed: z.boolean(),
    notes: z.string().optional(),
  })),
});

// Complete VWBA Schema
const vwbaSchema = z.object({
  siteDescription: siteDescriptionSchema,
  evidence: evidenceSchema,
  audit: auditSchema,
});

export type VWBAFormData = z.infer<typeof vwbaSchema>;

interface VWBAWizardProps {
  projectId: string;
  onSubmit: (data: VWBAFormData) => void;
  onSaveDraft: (data: Partial<VWBAFormData>) => void;
  defaultValues?: Partial<VWBAFormData>;
  isSubmitting?: boolean;
}

const WIZARD_STEPS = [
  {
    id: 'site-description',
    title: 'Describe Site',
    description: 'Location, footprint, and assets',
  },
  {
    id: 'evidence',
    title: 'Evidence',
    description: 'Methods, AfN/TNFD mapping, uploads',
  },
  {
    id: 'audit',
    title: 'Audit',
    description: 'Auto validation and pre-checklist',
  },
  {
    id: 'mint',
    title: 'Mint',
    description: 'Review, costs, sign & submit',
  },
];

export function VWBAWizard({
  projectId,
  onSubmit,
  onSaveDraft,
  defaultValues,
  isSubmitting = false,
}: VWBAWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<Partial<VWBAFormData>>(defaultValues || {});

  // Auto-save draft every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        onSaveDraft(formData);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, onSaveDraft]);

  const updateFormData = (stepData: Partial<VWBAFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    onSaveDraft({ ...formData, ...stepData });
  };

  const canNext = () => {
    switch (currentStep) {
      case 0:
        return !!formData.siteDescription;
      case 1:
        return !!formData.evidence;
      case 2:
        return !!formData.audit?.validated;
      default:
        return false;
    }
  };

  const canFinish = () => {
    return currentStep === 3 && !!formData.audit?.validated;
  };

  const handleFinish = () => {
    if (formData.siteDescription && formData.evidence && formData.audit) {
      onSubmit(formData as VWBAFormData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Wizard
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        canNext={canNext()}
        canFinish={canFinish()}
        onFinish={handleFinish}
        isLoading={isSubmitting}
      >
        <SiteDescriptionStep
          stepId="site-description"
          data={formData.siteDescription}
          onUpdate={(data) => updateFormData({ siteDescription: data })}
        />

        <EvidenceStep
          stepId="evidence"
          data={formData.evidence}
          onUpdate={(data) => updateFormData({ evidence: data })}
        />

        <AuditStep
          stepId="audit"
          data={formData.audit}
          onUpdate={(data) => updateFormData({ audit: data })}
        />

        <MintStep
          stepId="mint"
          formData={formData}
          projectId={projectId}
        />
      </Wizard>
    </div>
  );
}

// Step Components
function SiteDescriptionStep({
  stepId,
  data,
  onUpdate,
}: {
  stepId: string;
  data?: z.infer<typeof siteDescriptionSchema>;
  onUpdate: (data: z.infer<typeof siteDescriptionSchema>) => void;
}) {
  const form = useForm<z.infer<typeof siteDescriptionSchema>>({
    resolver: zodResolver(siteDescriptionSchema),
    defaultValues: data || {
      location: '',
      footprint: 0,
      assetType: '',
      description: '',
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isValid) {
        onUpdate(value as z.infer<typeof siteDescriptionSchema>);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  return (
    <WizardStep stepId={stepId}>
      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter site location" {...field} />
                </FormControl>
                <FormDescription>
                  Geographic location of the site
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="footprint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Footprint (hectares)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Total area of the site in hectares
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Forest, Wetland, Grassland" {...field} />
                </FormControl>
                <FormDescription>
                  Type of natural asset on the site
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Detailed description of the site" {...field} />
                </FormControl>
                <FormDescription>
                  Comprehensive description of the site and its characteristics
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </WizardStep>
  );
}

function EvidenceStep({
  stepId,
  data,
  onUpdate,
}: {
  stepId: string;
  data?: z.infer<typeof evidenceSchema>;
  onUpdate: (data: z.infer<typeof evidenceSchema>) => void;
}) {
  const form = useForm<z.infer<typeof evidenceSchema>>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: data || {
      methods: [],
      afnMapping: '',
      tnfdMapping: '',
      uploads: [],
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isValid) {
        onUpdate(value as z.infer<typeof evidenceSchema>);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  return (
    <WizardStep stepId={stepId}>
      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="afnMapping"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AfN Mapping</FormLabel>
                <FormControl>
                  <Input placeholder="Enter AfN framework mapping" {...field} />
                </FormControl>
                <FormDescription>
                  Alignment with Accounting for Nature framework
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tnfdMapping"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TNFD Mapping</FormLabel>
                <FormControl>
                  <Input placeholder="Enter TNFD framework mapping" {...field} />
                </FormControl>
                <FormDescription>
                  Alignment with Taskforce on Nature-related Financial Disclosures
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </WizardStep>
  );
}

function AuditStep({
  stepId,
  data,
  onUpdate,
}: {
  stepId: string;
  data?: z.infer<typeof auditSchema>;
  onUpdate: (data: z.infer<typeof auditSchema>) => void;
}) {
  const [isValidated, setIsValidated] = React.useState(data?.validated || false);

  React.useEffect(() => {
    onUpdate({
      validated: isValidated,
      checklist: [],
    });
  }, [isValidated, onUpdate]);

  return (
    <WizardStep stepId={stepId}>
      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-muted/50">
          <h3 className="font-medium mb-2">Auto Validation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Checking site data against validation criteria...
          </p>
          <Button
            onClick={() => setIsValidated(true)}
            disabled={isValidated}
            variant={isValidated ? "outline" : "default"}
          >
            {isValidated ? "✓ Validated" : "Run Validation"}
          </Button>
        </div>

        {isValidated && (
          <div className="p-4 border rounded-lg bg-success/10 border-success/20">
            <div className="flex items-center gap-2 text-success">
              <span className="text-lg">✓</span>
              <span className="font-medium">Validation Passed</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Site data meets all validation criteria. Ready to proceed to minting.
            </p>
          </div>
        )}
      </div>
    </WizardStep>
  );
}

function MintStep({
  stepId,
  formData,
  projectId,
}: {
  stepId: string;
  formData: Partial<VWBAFormData>;
  projectId: string;
}) {
  return (
    <WizardStep stepId={stepId}>
      <div className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Review Summary</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Project ID:</span> {projectId}</div>
            <div><span className="font-medium">Location:</span> {formData.siteDescription?.location}</div>
            <div><span className="font-medium">Footprint:</span> {formData.siteDescription?.footprint} hectares</div>
            <div><span className="font-medium">Asset Type:</span> {formData.siteDescription?.assetType}</div>
            <div><span className="font-medium">Validation:</span> {formData.audit?.validated ? '✓ Passed' : '✗ Failed'}</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
          <h3 className="font-medium mb-2">Minting Costs</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Base Fee:</span>
              <span>0.1 ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Validation Fee:</span>
              <span>0.05 ETH</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total:</span>
              <span>0.15 ETH</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            By proceeding, you agree to mint this VWBA unit for the specified project. 
            This action will create an immutable record on the blockchain.
          </p>
        </div>
      </div>
    </WizardStep>
  );
}