'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@orenna/api-client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Label,
  Checkbox,
  Badge
} from '@orenna/ui';
import { 
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Wallet,
  Shield,
  CheckCircle,
  TrendingDown,
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react';
import { sampleProjects } from '../../../../../sample-data/sample-project';

export default function BuyForwardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params?.id as string);
  
  const { data: apiProject } = useProject(projectId);
  const sampleProject = sampleProjects.find(p => p.id === projectId);
  const project = apiProject || sampleProject;

  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [processing, setProcessing] = useState(false);

  const forwardPrice = 22.00;
  const spotPrice = 25.50;
  const savings = (spotPrice - forwardPrice) * quantity;
  const totalCost = quantity * forwardPrice;
  const escrowFee = totalCost * 0.015; // 1.5% escrow fee
  const finalTotal = totalCost + escrowFee;
  
  const deliveryDate = new Date();
  deliveryDate.setMonth(deliveryDate.getMonth() + 12);

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePurchase = async () => {
    setProcessing(true);
    
    // Simulate purchase process
    setTimeout(() => {
      setProcessing(false);
      setStep(4); // Success step
    }, 3000);
  };

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold">Project Not Found</h3>
            <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Purchase Forward Contract</h1>
              <p className="text-muted-foreground">{project.name}</p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 mb-6">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step > stepNum ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Details</CardTitle>
                    <CardDescription>
                      Configure your forward contract terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="quantity">Quantity (tCO2e contracts)</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max="500"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setQuantity(10)}
                        >
                          10
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setQuantity(50)}
                        >
                          50
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setQuantity(100)}
                        >
                          100
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm text-muted-foreground">Forward Price</Label>
                        <p className="text-xl font-bold text-blue-600">${forwardPrice}</p>
                        <p className="text-xs text-muted-foreground">per tCO2e</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm text-muted-foreground">Current Spot Price</Label>
                        <p className="text-xl font-bold">${spotPrice}</p>
                        <p className="text-xs text-muted-foreground">per tCO2e</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Your Savings
                      </h4>
                      <p className="text-sm text-green-700">
                        By purchasing {quantity} forward contracts at ${forwardPrice} each instead of 
                        the current spot price of ${spotPrice}, you'll save{' '}
                        <strong>${savings.toFixed(2)}</strong> ({((savings / (quantity * spotPrice)) * 100).toFixed(1)}%).
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Delivery Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Delivery Date:</span>
                          <span className="font-medium">{deliveryDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contract Duration:</span>
                          <span className="font-medium">12 months</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Settlement Method:</span>
                          <span className="font-medium">Physical delivery to wallet</span>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleNext} className="w-full" size="lg">
                      Continue to Payment Method
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>
                      Choose how you'd like to pay for your forward contract
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card 
                        className={`cursor-pointer border-2 ${
                          paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-border'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CardContent className="p-4 text-center">
                          <CreditCard className="h-8 w-8 mx-auto mb-2" />
                          <h4 className="font-medium">Credit/Debit Card</h4>
                          <p className="text-sm text-muted-foreground">
                            Secure payment with escrow protection
                          </p>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`cursor-pointer border-2 ${
                          paymentMethod === 'crypto' ? 'border-blue-600 bg-blue-50' : 'border-border'
                        }`}
                        onClick={() => setPaymentMethod('crypto')}
                      >
                        <CardContent className="p-4 text-center">
                          <Wallet className="h-8 w-8 mx-auto mb-2" />
                          <h4 className="font-medium">Cryptocurrency</h4>
                          <p className="text-sm text-muted-foreground">
                            Pay with ETH, USDC, or USDT
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Escrow Protection</h4>
                      <p className="text-sm text-yellow-700">
                        Your payment will be held in a secure escrow until contract delivery. 
                        This protects both parties and ensures contract fulfillment.
                      </p>
                    </div>

                    <Button 
                      onClick={handleNext} 
                      className="w-full" 
                      size="lg"
                      disabled={!paymentMethod}
                    >
                      Continue to Review
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review & Confirm</CardTitle>
                    <CardDescription>
                      Please review your forward contract details before confirming
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span>Project:</span>
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contract Type:</span>
                        <span className="font-medium">Forward Contract</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{quantity} tCO2e</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contract price:</span>
                        <span className="font-medium">${forwardPrice} per tCO2e</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery date:</span>
                        <span className="font-medium">{deliveryDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contract value:</span>
                        <span className="font-medium">${totalCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escrow fee (1.5%):</span>
                        <span className="font-medium">${escrowFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold">Total Due Today:</span>
                          <span className="font-bold">${finalTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Projected savings vs spot:</span>
                          <span className="font-medium">${savings.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Checkbox 
                          id="terms" 
                          checked={agreedToTerms}
                          onCheckedChange={setAgreedToTerms}
                        />
                        <Label htmlFor="terms" className="text-sm leading-relaxed">
                          I agree to the{' '}
                          <a href="#" className="text-blue-600 hover:underline">Forward Contract Terms</a>
                          {' '}and understand that this is a binding agreement for future delivery of carbon credits
                        </Label>
                      </div>
                    </div>

                    <Button 
                      onClick={handlePurchase} 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      size="lg"
                      disabled={!agreedToTerms || processing}
                    >
                      {processing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase Forward Contract
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 4 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="space-y-4">
                      <CheckCircle className="h-16 w-16 text-blue-600 mx-auto" />
                      <h2 className="text-2xl font-bold text-blue-600">Contract Secured!</h2>
                      <p className="text-muted-foreground">
                        Your forward contract for {quantity} tCO2e has been successfully created and funded.
                      </p>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Contract Details</h4>
                        <div className="text-sm space-y-1">
                          <div>Contract ID: FWD-{Date.now()}</div>
                          <div>Quantity: {quantity} tCO2e</div>
                          <div>Delivery Date: {deliveryDate.toLocaleDateString()}</div>
                          <div>Total Paid: ${finalTotal.toFixed(2)}</div>
                          <div className="text-green-600 font-medium">
                            Projected Savings: ${savings.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">What's Next?</h4>
                        <p className="text-sm text-yellow-700">
                          Your payment is now held in escrow. You'll receive your carbon credit tokens 
                          on {deliveryDate.toLocaleDateString()}. We'll send you updates as the delivery date approaches.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Button 
                          onClick={() => router.push('/dashboard')}
                          className="w-full"
                        >
                          View in Dashboard
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => router.push(`/projects/${projectId}`)}
                          className="w-full"
                        >
                          Back to Project
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contract Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity} tCO2e</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Forward price:</span>
                    <span className="font-medium">${forwardPrice} each</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Contract value:</span>
                    <span className="font-medium">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Escrow fee:</span>
                    <span className="font-medium">${escrowFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Savings:</span>
                      <span className="font-medium">${savings.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Escrow Protection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                    <span>Funds held in secure escrow</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                    <span>Automatic delivery on contract date</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                    <span>Cancellation protection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                    <span>Verified carbon credits guaranteed</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Key Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Contract Date:</span>
                    <span className="font-medium">Today</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Date:</span>
                    <span className="font-medium">{deliveryDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">12 months</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}