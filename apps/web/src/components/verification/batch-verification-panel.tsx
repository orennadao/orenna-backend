'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@orenna/ui';
import { 
  useBatchVerification, 
  useBatchStatus, 
  useVerificationMethods,
  type BatchVerificationRequest 
} from '@orenna/api-client';
import { Upload, Search, Download, Trash2, Plus } from 'lucide-react';

const batchVerificationSchema = z.object({
  methodId: z.string().min(1, 'Please select a verification method'),
  validatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  validatorName: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  sharedEvidence: z.boolean().default(false),
});

type BatchVerificationFormData = z.infer<typeof batchVerificationSchema>;

interface BatchVerificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchVerificationPanel({ open, onOpenChange }: BatchVerificationPanelProps) {
  const [liftTokenIds, setLiftTokenIds] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [statusCheckIds, setStatusCheckIds] = useState<number[]>([]);

  const { data: methods } = useVerificationMethods({ active: true });
  const batchVerification = useBatchVerification();
  const batchStatus = useBatchStatus();

  const form = useForm<BatchVerificationFormData>({
    resolver: zodResolver(batchVerificationSchema),
    defaultValues: {
      methodId: '',
      validatorAddress: '',
      validatorName: '',
      notes: '',
      priority: 'normal',
      sharedEvidence: false,
    },
  });

  const handleAddTokenIds = () => {
    const ids = inputValue
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id > 0 && !liftTokenIds.includes(id));
    
    setLiftTokenIds([...liftTokenIds, ...ids]);
    setInputValue('');
  };

  const handleRemoveTokenId = (id: number) => {
    setLiftTokenIds(liftTokenIds.filter(tokenId => tokenId !== id));
  };

  const handleSubmitBatch = async (data: BatchVerificationFormData) => {
    if (liftTokenIds.length === 0) {
      form.setError('root', { message: 'Please add at least one lift token ID' });
      return;
    }

    try {
      const batchRequest: BatchVerificationRequest = {
        verifications: liftTokenIds.map(liftTokenId => ({
          liftTokenId,
          methodId: data.methodId,
          validatorAddress: data.validatorAddress,
          validatorName: data.validatorName,
          notes: data.notes,
          // Note: Evidence would need to be added separately for batch operations
        })),
        priority: data.priority,
        sharedEvidence: data.sharedEvidence,
      };

      await batchVerification.mutateAsync(batchRequest);
      
      // Reset form
      form.reset();
      setLiftTokenIds([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Batch verification failed:', error);
    }
  };

  const handleStatusCheck = async () => {
    if (statusCheckIds.length === 0) return;

    try {
      const result = await batchStatus.mutateAsync({ liftTokenIds: statusCheckIds });
      console.log('Batch status result:', result);
      // Here you would typically show the results in a dialog or expand the panel
    } catch (error) {
      console.error('Batch status check failed:', error);
    }
  };

  const handleImportFromCSV = () => {
    // This would open a file dialog and parse CSV
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const ids: number[] = [];
          
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !isNaN(parseInt(trimmed))) {
              ids.push(parseInt(trimmed));
            }
          });
          
          setLiftTokenIds([...new Set([...liftTokenIds, ...ids])]);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Batch Verification Operations</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Batch Status Check */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Check Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Lift Token IDs to Check
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter IDs separated by commas (e.g., 1,2,3)"
                    value={statusCheckIds.join(',')}
                    onChange={(e) => {
                      const ids = e.target.value
                        .split(',')
                        .map(id => parseInt(id.trim()))
                        .filter(id => !isNaN(id) && id > 0);
                      setStatusCheckIds(ids);
                    }}
                  />
                  <Button
                    onClick={handleStatusCheck}
                    disabled={statusCheckIds.length === 0 || batchStatus.isPending}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Check Status
                  </Button>
                </div>
              </div>

              {batchStatus.data && (
                <div className="mt-4 p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Status Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">{batchStatus.data.summary.total}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Verified</p>
                      <p className="font-medium text-green-600">{batchStatus.data.summary.verified}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending</p>
                      <p className="font-medium text-yellow-600">{batchStatus.data.summary.pending}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rejected</p>
                      <p className="font-medium text-red-600">{batchStatus.data.summary.rejected}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Not Submitted</p>
                      <p className="font-medium text-muted-foreground">{batchStatus.data.summary.not_submitted}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Batch Verification Submission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit Batch Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitBatch)} className="space-y-6">
                  {/* Token IDs Management */}
                  <div>
                    <label className="text-sm font-medium">
                      Lift Token IDs ({liftTokenIds.length})
                    </label>
                    
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Enter IDs separated by commas"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTokenIds();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTokenIds}
                        disabled={!inputValue.trim()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImportFromCSV}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import CSV
                      </Button>
                    </div>

                    {liftTokenIds.length > 0 && (
                      <div className="mt-3 p-3 border border-border rounded-lg max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {liftTokenIds.map((id) => (
                            <div
                              key={id}
                              className="flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                            >
                              <span>#{id}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTokenId(id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Verification Method */}
                  <FormField
                    control={form.control}
                    name="methodId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a verification method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {methods?.map((method) => (
                              <SelectItem 
                                key={method.methodId} 
                                value={method.methodId}
                                disabled={!method.active}
                              >
                                {method.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            <Input placeholder="Organization name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Priority and Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Processing Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Higher priority jobs are processed first
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sharedEvidence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shared Evidence</FormLabel>
                          <div className="mt-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="rounded"
                              />
                              <span className="text-sm">
                                Use same evidence for all tokens
                              </span>
                            </label>
                          </div>
                          <FormDescription>
                            Apply evidence files to all tokens in batch
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes about this batch verification..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          These notes will be applied to all verifications in the batch
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Error Messages */}
                  {form.formState.errors.root && (
                    <div className="text-sm text-destructive">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setLiftTokenIds([]);
                        form.reset();
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                    <Button
                      type="submit"
                      disabled={batchVerification.isPending || liftTokenIds.length === 0}
                    >
                      {batchVerification.isPending ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Batch ({liftTokenIds.length} tokens)
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}