'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from '@orenna/ui';
import { type VerificationMethod, type EvidenceSubmission } from '@orenna/api-client';
import { EvidenceUpload } from './evidence-upload';
import { Upload, AlertCircle } from 'lucide-react';

const submitVerificationSchema = z.object({
  methodId: z.string().min(1, 'Please select a verification method'),
  validatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  validatorName: z.string().optional(),
  notes: z.string().optional(),
});

type SubmitVerificationFormData = z.infer<typeof submitVerificationSchema>;

interface SubmitVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  methods: VerificationMethod[];
  onSubmit: (data: SubmitVerificationFormData & { evidence: EvidenceSubmission[] }) => Promise<void>;
  isSubmitting: boolean;
}

export function SubmitVerificationDialog({
  open,
  onOpenChange,
  methods,
  onSubmit,
  isSubmitting,
}: SubmitVerificationDialogProps) {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceSubmission[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  const form = useForm<SubmitVerificationFormData>({
    resolver: zodResolver(submitVerificationSchema),
    defaultValues: {
      methodId: '',
      validatorAddress: '',
      validatorName: '',
      notes: '',
    },
  });

  const selectedMethod = methods.find(m => m.methodId === selectedMethodId);

  const handleSubmit = async (data: SubmitVerificationFormData) => {
    try {
      await onSubmit({
        ...data,
        evidence: evidenceFiles,
      });
      form.reset();
      setEvidenceFiles([]);
      setSelectedMethodId('');
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleMethodChange = (methodId: string) => {
    setSelectedMethodId(methodId);
    form.setValue('methodId', methodId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Verification Request</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Method Selection */}
            <FormField
              control={form.control}
              name="methodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Method</FormLabel>
                  <Select
                    onValueChange={handleMethodChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verification method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {methods.map((method) => (
                        <SelectItem 
                          key={method.methodId} 
                          value={method.methodId}
                          disabled={!method.active}
                        >
                          <div className="flex items-center gap-2">
                            <span>{method.name}</span>
                            {!method.active && (
                              <span className="text-xs text-muted-foreground">(Inactive)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the verification methodology for this request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Method Details */}
            {selectedMethod && (
              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">{selectedMethod.name}</h4>
                {selectedMethod.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedMethod.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Required Evidence Types:</p>
                    <ul className="text-muted-foreground mt-1 space-y-1">
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
              </div>
            )}

            {/* Validator Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validatorAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validator Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0x..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Ethereum address of the validator
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
                      <Input 
                        placeholder="Organization or individual name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Human-readable validator identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Evidence Upload */}
            {selectedMethod && (
              <div>
                <label className="text-sm font-medium mb-4 block">
                  Evidence Files
                </label>
                <EvidenceUpload
                  requiredTypes={selectedMethod.criteria.requiredEvidenceTypes}
                  onFilesChange={setEvidenceFiles}
                  files={evidenceFiles}
                />
                {evidenceFiles.length === 0 && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Upload evidence files to support your verification request
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional information about this verification request..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any additional context or special instructions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedMethod}
              >
                {isSubmitting ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Verification
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}