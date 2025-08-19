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
  Progress,
  Badge
} from '@orenna/ui';
import { 
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Wallet,
  Shield,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Coins
} from 'lucide-react';
import { sampleProjects } from '../../../../../sample-data/sample-project';

export default function BuyTokenPage() {
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

  const tokenPrice = 25.50;
  const totalCost = quantity * tokenPrice;
  const platformFee = totalCost * 0.025; // 2.5% platform fee
  const finalTotal = totalCost + platformFee;

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
              <h1 className="text-2xl font-bold">Purchase Lift Tokens</h1>
              <p className="text-muted-foreground">{project.name}</p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 mb-6">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-green-600 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step > stepNum ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-green-600' : 'bg-muted'
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
                    <CardTitle>Select Quantity</CardTitle>
                    <CardDescription>
                      Choose how many carbon credit tokens you want to purchase
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="quantity">Quantity (tCO2e tokens)</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max="1000"
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

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Environmental Impact</h4>
                      <p className="text-sm text-blue-800">
                        Your purchase of {quantity} tCO2e tokens will offset approximately{' '}
                        <strong>{(quantity * 2.2).toFixed(1)} tons</strong> of CO2 emissions, 
                        equivalent to taking a car off the road for{' '}
                        <strong>{(quantity * 0.5).toFixed(1)} months</strong>.
                      </p>
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
                      Choose how you'd like to pay for your tokens
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card 
                        className={`cursor-pointer border-2 ${
                          paymentMethod === 'card' ? 'border-green-600 bg-green-50' : 'border-border'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CardContent className="p-4 text-center">
                          <CreditCard className="h-8 w-8 mx-auto mb-2" />
                          <h4 className="font-medium">Credit/Debit Card</h4>
                          <p className="text-sm text-muted-foreground">
                            Pay with Visa, Mastercard, or Amex
                          </p>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`cursor-pointer border-2 ${
                          paymentMethod === 'crypto' ? 'border-green-600 bg-green-50' : 'border-border'
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
                      Please review your purchase details before confirming
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span>Project:</span>
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{quantity} tCO2e tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price per token:</span>
                        <span className="font-medium">${tokenPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">${totalCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform fee (2.5%):</span>
                        <span className="font-medium">${platformFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold">${finalTotal.toFixed(2)}</span>
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
                          <a href="#" className="text-green-600 hover:underline">Terms of Service</a>
                          {' '}and{' '}
                          <a href="#" className="text-green-600 hover:underline">Carbon Token Purchase Agreement</a>
                        </Label>
                      </div>
                    </div>

                    <Button 
                      onClick={handlePurchase} 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      size="lg"
                      disabled={!agreedToTerms || processing}
                    >
                      {processing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Complete Purchase
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
                      <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                      <h2 className="text-2xl font-bold text-green-600">Purchase Successful!</h2>
                      <p className="text-muted-foreground">
                        You have successfully purchased {quantity} tCO2e carbon credit tokens.
                      </p>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Transaction Details</h4>
                        <div className="text-sm space-y-1">
                          <div>Transaction ID: TX-{Date.now()}</div>
                          <div>Tokens: {quantity} tCO2e</div>
                          <div>Total Paid: ${finalTotal.toFixed(2)}</div>
                        </div>
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
                  <CardTitle className="text-sm">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity} tCO2e</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price:</span>
                    <span className="font-medium">${tokenPrice} each</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform fee:</span>
                    <span className="font-medium">${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure Purchase</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>SSL encrypted payment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Blockchain verified tokens</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>30-day money back guarantee</span>
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