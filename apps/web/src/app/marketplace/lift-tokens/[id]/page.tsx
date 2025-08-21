'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Coins,
  TrendingUp,
  TrendingDown,
  Shield,
  MapPin,
  Calendar,
  FileText,
  Users,
  ShoppingCart,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  Droplets,
  Zap,
  Activity,
  Building,
  Target,
  Recycle,
  ExternalLink,
  Award
} from 'lucide-react';

// Mock data (in real implementation, this would come from API)
const mockLiftTokens = [
  {
    id: 1,
    tokenId: "LFT001",
    contractAddress: "0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A",
    chainId: 1,
    projectType: 'carbon',
    name: 'Amazon Rainforest Carbon Credits',
    description: 'Verified carbon credits from REDD+ forest conservation project in the Brazilian Amazon rainforest. This project protects 10,000 hectares of primary rainforest while supporting indigenous communities through sustainable livelihood programs.',
    location: 'Acre, Brazil',
    price: 28.50,
    currency: 'USD',
    availableSupply: 2500,
    totalSupply: 5000,
    retiredAmount: 1200,
    priceChange24h: 3.2,
    issuanceDate: '2024-09-15',
    verification: {
      status: 'verified',
      methodology: 'VCS REDD+',
      verifier: 'SCS Global Services',
      confidence: 0.95,
      verificationDate: '2024-09-10',
      certificateUrl: 'https://registry.verra.org/myModule/rpt/myrpt.asp?r=206&h=123456'
    },
    project: {
      name: 'Amazon Conservation Initiative',
      developer: 'Rainforest Alliance Brazil',
      nftId: 101,
      website: 'https://rainforest-alliance.org',
      impactMetrics: [
        { type: 'CO2 Sequestered', value: 50000, unit: 'tonnes' },
        { type: 'Forest Area Protected', value: 10000, unit: 'hectares' },
        { type: 'Biodiversity Species', value: 1250, unit: 'species' },
        { type: 'Indigenous Communities', value: 8, unit: 'communities' }
      ]
    },
    trading: {
      volume24h: 156000,
      volume7d: 890000,
      holders: 89,
      avgPrice: 27.80,
      retirementRate: 24.0,
      priceHistory: [
        { date: '2024-11-15', price: 27.50 },
        { date: '2024-11-16', price: 28.10 },
        { date: '2024-11-17', price: 28.50 },
      ]
    },
    status: 'active',
    rating: 4.8,
    createdAt: '2024-09-15',
    additionalAttributes: {
      vintage: '2024',
      methodology: 'REDD+ Forest Conservation',
      additionality: 'Demonstrated through baseline analysis',
      permanence: '100 year commitment with buffer pool',
      cobenefits: ['Biodiversity protection', 'Community development', 'Water conservation']
    }
  }
];

export default function LiftTokenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = parseInt(params?.id as string);
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  const token = mockLiftTokens.find(t => t.id === tokenId);

  const handleBack = () => {
    router.back();
  };

  const handleBuyNow = () => {
    router.push(`/marketplace/lift-tokens/${tokenId}/buy`);
  };

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'carbon': return <Leaf className="h-5 w-5 text-green-600" />;
      case 'energy': return <Zap className="h-5 w-5 text-yellow-600" />;
      case 'biodiversity': return <Activity className="h-5 w-5 text-purple-600" />;
      case 'mixed': return <Building className="h-5 w-5 text-orange-600" />;
      default: return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  if (!token) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Token Not Found</h3>
              <p className="text-muted-foreground">The lift token you're looking for doesn't exist.</p>
              <Button onClick={handleBack} className="mt-4">Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCost = quantity * token.price;
  const retirementPercentage = (token.retiredAmount / token.totalSupply) * 100;
  const availablePercentage = (token.availableSupply / token.totalSupply) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
            <div className="flex items-center gap-3">
              {getProjectTypeIcon(token.projectType)}
              <div>
                <h1 className="text-3xl font-bold">{token.name}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {token.location} • Token ID: {token.tokenId}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Token Overview</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      {token.verification.status}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {token.status}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  {token.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price and Market Data */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-xl font-bold text-green-600">${token.price}</p>
                    <p className={`text-xs ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h}% (24h)
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-xl font-bold">{token.availableSupply.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{availablePercentage.toFixed(1)}% of supply</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Retired</p>
                    <p className="text-xl font-bold text-purple-600">{token.retiredAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{retirementPercentage.toFixed(1)}% retired</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                    <p className="text-xl font-bold">${(token.trading.volume24h / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">{token.trading.holders} holders</p>
                  </div>
                </div>

                {/* Supply Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Token Supply Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Available for Purchase</span>
                      <span className="font-medium">{token.availableSupply.toLocaleString()} ({availablePercentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={availablePercentage} className="bg-green-100" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Permanently Retired</span>
                      <span className="font-medium">{token.retiredAmount.toLocaleString()} ({retirementPercentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={retirementPercentage} className="bg-purple-100" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Supply: {token.totalSupply.toLocaleString()} tokens
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Project Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">{token.project.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Developer</Label>
                    <p className="text-sm text-muted-foreground mt-1">{token.project.developer}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Project NFT</Label>
                    <p className="text-sm text-muted-foreground mt-1">#{token.project.nftId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Vintage Year</Label>
                    <p className="text-sm text-muted-foreground mt-1">{token.additionalAttributes.vintage}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Impact Metrics</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {token.project.impactMetrics.map((metric, index) => (
                      <div key={index} className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-semibold text-sm text-green-800">{metric.value.toLocaleString()}</div>
                        <div className="text-xs text-green-600">{metric.type}</div>
                        <div className="text-xs text-muted-foreground">{metric.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Co-benefits</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {token.additionalAttributes.cobenefits.map((benefit, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Verification & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Fully Verified</p>
                    <p className="text-sm text-green-600">
                      Confidence Score: {(token.verification.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Standard</Label>
                    <p className="text-sm text-muted-foreground mt-1">{token.verification.methodology}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Verifier</Label>
                    <p className="text-sm text-muted-foreground mt-1">{token.verification.verifier}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Verification Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">{token.verification.verificationDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Issuance Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">{token.issuanceDate}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Methodology Details</Label>
                  <p className="text-sm text-muted-foreground mt-1">{token.additionalAttributes.methodology}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Additionality</Label>
                  <p className="text-sm text-muted-foreground mt-1">{token.additionalAttributes.additionality}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Permanence</Label>
                  <p className="text-sm text-muted-foreground mt-1">{token.additionalAttributes.permanence}</p>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Panel */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Purchase & Retire</span>
                </CardTitle>
                <CardDescription>
                  Buy tokens and retire them to claim environmental benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Quantity (tokens)</Label>
                  <div className="flex space-x-2 mt-1">
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
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Price per token:</span>
                    <span className="font-medium">${token.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity} tokens</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Cost:</span>
                      <span className="font-bold text-lg">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleBuyNow}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy & Retire Tokens
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✓ Immediate retirement upon purchase</p>
                  <p>✓ Verifiable impact certificate</p>
                  <p>✓ Blockchain-secured transaction</p>
                </div>
              </CardContent>
            </Card>

            {/* Token Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Market Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating:</span>
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="font-medium">{token.rating}/5.0</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">7d Volume:</span>
                  <span className="font-medium">${(token.trading.volume7d / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Price:</span>
                  <span className="font-medium">${token.trading.avgPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retirement Rate:</span>
                  <span className="font-medium">{token.trading.retirementRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="font-medium text-xs font-mono">
                    {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}