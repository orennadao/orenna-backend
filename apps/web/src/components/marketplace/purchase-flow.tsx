'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Badge
} from '@orenna/ui';
import { 
  CreditCard,
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';

const purchaseSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  paymentMethod: z.enum(['crypto', 'card', 'bank'], {
    required_error: 'Please select a payment method'
  }),
  walletAddress: z.string().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  companyName: z.string().optional(),
  retirementPlan: z.enum(['immediate', 'later', 'hold'], {
    required_error: 'Please select retirement plan'
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseFlowProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    type: 'forward' | 'token';
    name: string;
    price: number;
    currency: string;
    availableSupply: number;
    projectType: string;
  };
  initialQuantity?: number;
  onComplete: (data: any) => void;
}

const PAYMENT_METHODS = [
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Pay with ETH, USDC, or other supported tokens',
    icon: Wallet,
    fees: '0-2%',
    processing: 'Instant'
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Pay with Visa, Mastercard, or other major cards',
    icon: CreditCard,
    fees: '2.9%',
    processing: '1-2 business days'
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    description: 'Direct bank transfer (ACH/Wire)',
    icon: DollarSign,
    fees: '0.5%',
    processing: '3-5 business days'
  }
];

export function PurchaseFlow({ 
  isOpen, 
  onClose, 
  item, 
  initialQuantity = 1, 
  onComplete 
}: PurchaseFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      quantity: initialQuantity,
      purpose: '',
      companyName: '',
      retirementPlan: 'later',
      agreeToTerms: false
    }
  });

  const quantity = form.watch('quantity');
  const paymentMethod = form.watch('paymentMethod');
  const totalCost = quantity * item.price;
  const selectedPaymentMethod = PAYMENT_METHODS.find(method => method.id === paymentMethod);
  const fees = selectedPaymentMethod ? 
    (selectedPaymentMethod.id === 'crypto' ? totalCost * 0.01 : 
     selectedPaymentMethod.id === 'card' ? totalCost * 0.029 : 
     totalCost * 0.005) : 0;
  const finalTotal = totalCost + fees;

  const steps = [
    { title: 'Details', description: 'Purchase details and quantity' },
    { title: 'Payment', description: 'Select payment method' },
    { title: 'Review', description: 'Review and confirm' },
    { title: 'Complete', description: 'Transaction complete' }
  ];

  const handleNext = async () => {
    let fieldsToValidate: (keyof PurchaseFormData)[] = [];
    
    switch (currentStep) {
      case 0:
        fieldsToValidate = ['quantity', 'purpose', 'retirementPlan'];
        break;
      case 1:
        fieldsToValidate = ['paymentMethod'];
        if (paymentMethod === 'crypto') {
          fieldsToValidate.push('walletAddress');
        }
        break;
      case 2:
        fieldsToValidate = ['agreeToTerms'];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const formData = form.getValues();
    const transactionData = {
      ...formData,
      item,
      totalCost,
      fees,
      finalTotal,
      transactionId: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    onComplete(transactionData);
    setCurrentStep(3);
    setIsProcessing(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Purchase Details</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant={item.type === 'forward' ? 'secondary' : 'default'} className="mt-1">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${item.price}</p>
                      <p className="text-sm text-muted-foreground">per unit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={item.availableSupply}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    Available: {item.availableSupply.toLocaleString()} units
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sustainability_goals">Corporate Sustainability Goals</SelectItem>
                        <SelectItem value="offset_emissions">Offset Emissions</SelectItem>
                        <SelectItem value="investment">Investment Portfolio</SelectItem>
                        <SelectItem value="personal_impact">Personal Environmental Impact</SelectItem>
                        <SelectItem value="trading">Trading/Resale</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormDescription>
                    For corporate purchases and reporting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retirementPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retirement Plan</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select retirement plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Retire Immediately</SelectItem>
                        <SelectItem value="later">Retire Later</SelectItem>
                        <SelectItem value="hold">Hold for Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    {item.type === 'token' 
                      ? 'Choose when to retire these tokens for environmental benefit claims'
                      : 'Choose how to handle tokens once the forward is delivered'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose how you'd like to pay for your {item.type === 'forward' ? 'project backing' : 'token purchase'}.
              </p>
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = field.value === method.id;
                        
                        return (
                          <div
                            key={method.id}
                            className={`
                              cursor-pointer rounded-lg border-2 p-4 transition-colors
                              ${isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                              }
                            `}
                            onClick={() => field.onChange(method.id)}
                          >
                            <div className="flex items-start space-x-4">
                              <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                              <div className="flex-1">
                                <h4 className="font-medium">{method.name}</h4>
                                <p className="text-sm text-muted-foreground">{method.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                  <span>Fees: {method.fees}</span>
                                  <span>Processing: {method.processing}</span>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentMethod === 'crypto' && (
              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0x..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Your wallet address for receiving tokens and transaction records
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review & Confirm</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Please review your {item.type === 'forward' ? 'backing' : 'purchase'} details before confirming.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Item:</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <Badge variant={item.type === 'forward' ? 'secondary' : 'default'}>
                    {item.type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>${item.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing Fee ({selectedPaymentMethod?.fees}):</span>
                  <span>${fees.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  {selectedPaymentMethod && (
                    <>
                      <selectedPaymentMethod.icon className="h-5 w-5" />
                      <span>{selectedPaymentMethod.name}</span>
                    </>
                  )}
                </div>
                {paymentMethod === 'crypto' && form.getValues('walletAddress') && (
                  <p className="text-sm text-muted-foreground mt-2 font-mono">
                    {form.getValues('walletAddress')}
                  </p>
                )}
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the Terms of Service and understand the risks
                    </FormLabel>
                    <FormDescription>
                      By proceeding, you acknowledge that you understand the terms and conditions
                      of this {item.type === 'forward' ? 'project backing' : 'token purchase'}.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {item.type === 'forward' && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your funds will be held in escrow until project completion and token delivery.
                  You can track progress and receive updates throughout the project lifecycle.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {item.type === 'forward' ? 'Project Backed Successfully!' : 'Purchase Complete!'}
              </h3>
              <p className="text-muted-foreground">
                {item.type === 'forward' 
                  ? 'You have successfully backed this project. You will receive updates as the project progresses.'
                  : 'Your tokens have been purchased and will be transferred to your account shortly.'
                }
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono">TXN-{Date.now()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="outline" className="text-green-600">
                      Confirmed
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col space-y-2">
              <Button onClick={onClose}>
                Continue to Dashboard
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item.type === 'forward' ? 'Back Project' : 'Purchase Tokens'}
          </DialogTitle>
          <DialogDescription>
            {currentStep < 3 
              ? `Step ${currentStep + 1} of ${steps.length - 1}`
              : 'Transaction Complete'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={(currentStep / (steps.length - 1)) * 100} className="mb-4" />
          <div className="flex justify-between text-sm">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`text-center flex-1 ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className="font-medium">{step.title}</div>
                <div className="text-xs">{step.description}</div>
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <div className="space-y-6">
            {renderStepContent()}

            {/* Navigation */}
            {currentStep < 3 && (
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep === 0 ? onClose : handlePrevious}
                  disabled={isProcessing}
                >
                  {currentStep === 0 ? 'Cancel' : 'Previous'}
                </Button>

                {currentStep < 2 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isProcessing}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isProcessing || !form.watch('agreeToTerms')}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Confirm ${item.type === 'forward' ? 'Backing' : 'Purchase'}`
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}