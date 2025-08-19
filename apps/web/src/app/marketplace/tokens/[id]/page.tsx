'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@orenna/api-client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Label
} from '@orenna/ui';
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
  Leaf
} from 'lucide-react';
import { sampleProjects } from '../../../../sample-data/sample-project';

export default function TokenMarketplacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params?.id as string);
  
  const { data: apiProject, isLoading } = useProject(projectId);
  const sampleProject = sampleProjects.find(p => p.id === projectId);
  const project = apiProject || sampleProject;

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  const tokenPrice = 25.50;
  const availableTokens = 1250;
  const totalTokens = 2500;
  const priceChange24h = 2.5;

  const handleBack = () => {
    router.back();
  };

  const handleBuyNow = () => {
    router.push(`/marketplace/tokens/${projectId}/buy`);
  };

  const totalCost = quantity * tokenPrice;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Project Not Found</h3>
              <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
              <Button onClick={handleBack} className="mt-4">Go Back</Button>
            </div>
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
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <Coins className="h-8 w-8 text-green-600" />
                <span>Lift Tokens</span>
              </h1>
              <p className="text-muted-foreground">{project.name}</p>
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
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Verified carbon credits tokenized on blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-xl font-bold text-green-600">${tokenPrice}</p>
                    <p className="text-xs text-green-600">+{priceChange24h}% (24h)</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-xl font-bold">{availableTokens.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">tCO2e units</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Supply</p>
                    <p className="text-xl font-bold">{totalTokens.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">tCO2e units</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="text-xl font-bold">${(totalTokens * tokenPrice / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">USD</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Supply Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {((totalTokens - availableTokens) / totalTokens * 100).toFixed(1)}% sold
                    </span>
                  </div>
                  <Progress value={((totalTokens - availableTokens) / totalTokens * 100)} />
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="project">Project Details</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="market">Market Data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {project.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{project.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Leaf className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{project.type} Project</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Active since 2024</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="project" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Expected Impact</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.expectedImpact}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Methodology</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.methodology}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Stakeholders</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.stakeholders}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Verification Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Fully Verified</p>
                        <p className="text-sm text-green-600">All carbon credits have been independently verified</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Verification Standard:</span>
                        <span className="font-medium">Verified Carbon Standard (VCS)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Methodology:</span>
                        <span className="font-medium">VM0007 REDD+ Methodology</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Verifier:</span>
                        <span className="font-medium">SCS Global Services</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Verification Date:</span>
                        <span className="font-medium">August 2024</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="market" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">24h Volume</Label>
                          <p className="text-lg font-semibold">247 tCO2e</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">24h Change</Label>
                          <p className="text-lg font-semibold text-green-600">+{priceChange24h}%</p>
                        </div>
                      </div>
                      <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Price chart placeholder</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Purchase Panel */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Purchase Tokens</span>
                </CardTitle>
                <CardDescription>
                  Buy verified carbon credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Quantity (tCO2e)</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={availableTokens}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(10, availableTokens))}
                    >
                      10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(100, availableTokens))}
                    >
                      100
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Price per token:</span>
                    <span className="font-medium">${tokenPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity} tCO2e</span>
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
                  Buy Now
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  Secure payment via blockchain escrow
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Project Status:</span>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impact Score:</span>
                  <span className="font-medium">{project.impactScore}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level:</span>
                  <Badge variant="outline" className="text-green-600">Low</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}