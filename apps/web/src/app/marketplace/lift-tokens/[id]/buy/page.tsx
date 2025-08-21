'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft,
  Coins,
  ShoppingCart,
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader,
  Recycle,
  FileText,
  ExternalLink,
  Award,
  Calendar
} from 'lucide-react';

// Mock token data (same as detail page)
const mockLiftTokens = [
  {
    id: 1,
    tokenId: "LFT001",
    contractAddress: "0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A",
    name: 'Amazon Rainforest Carbon Credits',
    price: 28.50,
    availableSupply: 2500,
    project: {
      name: 'Amazon Conservation Initiative',
      developer: 'Rainforest Alliance Brazil'
    }
  }
];

export default function BuyLiftTokenPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = parseInt(params?.id as string);
  
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRetirement, setAgreeRetirement] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [retirementCertificate, setRetirementCertificate] = useState<string | null>(null);

  const token = mockLiftTokens.find(t => t.id === tokenId);

  const handleBack = () => {
    router.back();
  };

  const handlePurchase = async () => {
    if (!agreeTerms || !agreeRetirement) {
      alert('Please agree to the terms and retirement confirmation');
      return;
    }

    setIsProcessing(true);
    
    // Simulate purchase process
    setTimeout(() => {
      setIsProcessing(false);
      setPurchaseComplete(true);
      setRetirementCertificate(`RET-${Date.now()}`);
    }, 3000);
  };

  if (!token) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Token Not Found</h3>
              <p className="text-muted-foreground">The lift token you're trying to purchase doesn't exist.</p>
              <Button onClick={handleBack} className="mt-4">Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCost = quantity * token.price;
  const estimatedFees = totalCost * 0.025; // 2.5% platform fee
  const finalTotal = totalCost + estimatedFees;

  if (purchaseComplete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6">
          <div className="max-w-2xl mx-auto">
            <Card className="border-green-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-800">Purchase & Retirement Complete!</CardTitle>
                <CardDescription>
                  Your tokens have been purchased and immediately retired. Environmental benefits are now secured.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-3">Transaction Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Token:</span>
                      <span className="font-medium">{token.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity Retired:</span>
                      <span className="font-medium">{quantity} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-medium">${finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retirement Certificate:</span>
                      <span className="font-medium font-mono text-xs">{retirementCertificate}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    Environmental Impact Secured
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="font-semibold text-blue-800">{(quantity * 1.8).toFixed(1)} tonnes</div>
                      <div className="text-xs text-blue-600">CO2 Sequestered</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="font-semibold text-green-800">{(quantity * 0.4).toFixed(1)} hectares</div>
                      <div className="text-xs text-green-600">Forest Protected</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Next Steps</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Retirement certificate will be generated within 24 hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Impact report will be emailed to your registered address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>You can share your impact on social media</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => router.push('/marketplace/lift-tokens')}>
                    Browse More Tokens
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <span>Purchase & Retire Tokens</span>
              </h1>
              <p className="text-muted-foreground">{token.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Retirement Notice */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Recycle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-1">Immediate Retirement</h3>
                    <p className="text-sm text-orange-800">
                      All tokens purchased through this marketplace are automatically and permanently retired upon purchase. 
                      This ensures the environmental benefits are secured and cannot be double-counted.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Quantity</CardTitle>
                <CardDescription>
                  Choose how many tokens you want to purchase and retire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Number of Tokens</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={token.availableSupply}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(10, token.availableSupply))}
                    >
                      10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(100, token.availableSupply))}
                    >
                      100
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(1000, token.availableSupply))}
                    >
                      1K
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum available: {token.availableSupply.toLocaleString()} tokens
                  </p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Environmental Impact per token:</span>
                      <span className="font-medium">~1.8 tonnes CO2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your total impact:</span>
                      <span className="font-medium text-green-600">
                        ~{(quantity * 1.8).toFixed(1)} tonnes CO2
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Choose your preferred payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'crypto' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod('crypto')}
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Cryptocurrency</div>
                        <div className="text-sm text-muted-foreground">ETH, USDC, USDT</div>
                      </div>
                    </div>
                  </div>
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'card' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="flex items-center space-x-3">
                      <ShoppingCart className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Credit Card</div>
                        <div className="text-sm text-muted-foreground">Visa, Mastercard, Amex</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Agreements */}
            <Card>
              <CardHeader>
                <CardTitle>Terms & Agreements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="terms" 
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I agree to the Terms of Service and Privacy Policy
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      By purchasing, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="retirement" 
                    checked={agreeRetirement}
                    onCheckedChange={(checked) => setAgreeRetirement(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="retirement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I understand that tokens will be permanently retired
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Tokens cannot be resold or transferred after retirement. Environmental benefits are permanently secured.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Secure & Verified</p>
                      <p>All transactions are secured by blockchain technology and environmental benefits are verified by independent third parties.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="h-5 w-5" />
                  <span>Purchase Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Token:</span>
                    <span className="font-medium text-right">{token.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price per token:</span>
                    <span className="font-medium">${token.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity} tokens</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform fee (2.5%):</span>
                    <span className="font-medium">${estimatedFees.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Environmental Impact</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>CO2 Impact:</span>
                      <span className="font-medium">{(quantity * 1.8).toFixed(1)} tonnes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Forest Area:</span>
                      <span className="font-medium">{(quantity * 0.4).toFixed(1)} hectares</span>
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handlePurchase}
                  disabled={!agreeTerms || !agreeRetirement || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Complete Purchase
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>✓ Instant retirement certificate</p>
                  <p>✓ Blockchain verification</p>
                  <p>✓ Tax-deductible receipt</p>
                </div>
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">{token.project.name}</div>
                  <div className="text-muted-foreground">{token.project.developer}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token ID:</span>
                  <span className="font-mono text-xs">{token.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span>{token.availableSupply.toLocaleString()}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Project Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}