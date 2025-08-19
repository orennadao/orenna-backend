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
  TrendingDown,
  Clock,
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
  Leaf,
  CalendarDays
} from 'lucide-react';
import { sampleProjects } from '../../../../sample-data/sample-project';

export default function ForwardMarketplacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params?.id as string);
  
  const { data: apiProject, isLoading } = useProject(projectId);
  const sampleProject = sampleProjects.find(p => p.id === projectId);
  const project = apiProject || sampleProject;

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  const forwardPrice = 22.00;
  const spotPrice = 25.50;
  const discount = spotPrice - forwardPrice;
  const discountPercent = ((discount / spotPrice) * 100);
  const availableForwards = 750;
  const totalForwards = 1500;
  const deliveryMonths = 12;
  const deliveryDate = new Date();
  deliveryDate.setMonth(deliveryDate.getMonth() + deliveryMonths);

  const handleBack = () => {
    router.back();
  };

  const handleBuyForward = () => {
    router.push(`/marketplace/forwards/${projectId}/buy`);
  };

  const totalCost = quantity * forwardPrice;

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
                <TrendingDown className="h-8 w-8 text-blue-600" />
                <span>Forward Contracts</span>
              </h1>
              <p className="text-muted-foreground">{project.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Forward Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Forward Contract Overview</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Future Delivery
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Purchase future carbon credits at today's discounted price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Forward Price</p>
                    <p className="text-xl font-bold text-blue-600">${forwardPrice}</p>
                    <p className="text-xs text-green-600">-{discountPercent.toFixed(1)}% vs spot</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Spot Price</p>
                    <p className="text-xl font-bold">${spotPrice}</p>
                    <p className="text-xs text-muted-foreground">current market</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-xl font-bold">{availableForwards.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">tCO2e contracts</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Delivery</p>
                    <p className="text-xl font-bold">{deliveryMonths}mo</p>
                    <p className="text-xs text-muted-foreground">{deliveryDate.toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Savings Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current spot price:</span>
                      <span className="font-medium">${spotPrice} per tCO2e</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Forward contract price:</span>
                      <span className="font-medium text-blue-600">${forwardPrice} per tCO2e</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Your savings:</span>
                      <span className="text-green-600">${discount.toFixed(2)} per tCO2e ({discountPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Contract Allocation</span>
                    <span className="text-sm text-muted-foreground">
                      {((totalForwards - availableForwards) / totalForwards * 100).toFixed(1)}% reserved
                    </span>
                  </div>
                  <Progress value={((totalForwards - availableForwards) / totalForwards * 100)} />
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="terms">Contract Terms</TabsTrigger>
                <TabsTrigger value="project">Project Details</TabsTrigger>
                <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>How Forward Contracts Work</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Forward contracts allow you to purchase carbon credits at today's price for delivery in the future. 
                        This provides price certainty and often significant savings compared to spot prices.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <CalendarDays className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <h4 className="font-medium">Lock in Price</h4>
                          <p className="text-sm text-muted-foreground">
                            Pay ${forwardPrice} today for future credits
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <h4 className="font-medium">Wait for Delivery</h4>
                          <p className="text-sm text-muted-foreground">
                            Credits delivered in {deliveryMonths} months
                          </p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <h4 className="font-medium">Receive Credits</h4>
                          <p className="text-sm text-muted-foreground">
                            Verified tokens transferred to you
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Contract Price</Label>
                        <p className="text-lg font-semibold">${forwardPrice} per tCO2e</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Delivery Date</Label>
                        <p className="text-lg font-semibold">{deliveryDate.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Minimum Quantity</Label>
                        <p className="text-lg font-semibold">1 tCO2e</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Maximum Quantity</Label>
                        <p className="text-lg font-semibold">500 tCO2e per contract</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Settlement Method</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Physical delivery of verified carbon credit tokens to your wallet
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Cancellation Policy</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Contracts can be cancelled up to 30 days before delivery with a 5% penalty fee
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Quality Guarantee</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          All credits are verified under VCS standards with independent third-party validation
                        </p>
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
                      <Label className="text-sm font-medium">Project Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.description}
                      </p>
                    </div>
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
                        <span className="text-sm">Impact Score: {project.impactScore}/10</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Risk Assessment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Low Risk</p>
                        <p className="text-sm text-green-600">This project has strong fundamentals and verification</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Risk Factors Assessed:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Project developer has 15+ years experience</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Established verification methodology (VCS)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Strong regulatory environment</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Local community support verified</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Insurance coverage in place</span>
                        </div>
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
                  <span>Purchase Forward</span>
                </CardTitle>
                <CardDescription>
                  Lock in today's price for future delivery
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
                      max={availableForwards}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(10, availableForwards))}
                    >
                      10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(100, availableForwards))}
                    >
                      100
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Forward price:</span>
                    <span className="font-medium">${forwardPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity} tCO2e</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery date:</span>
                    <span className="font-medium">{deliveryDate.toLocaleDateString()}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Cost:</span>
                      <span className="font-bold text-lg">${totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Savings vs spot:</span>
                      <span className="font-medium">${(quantity * discount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleBuyForward}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Forward Contract
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  Secure escrow until delivery
                </div>
              </CardContent>
            </Card>

            {/* Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-medium">{deliveryMonths} months</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level:</span>
                  <Badge variant="outline" className="text-green-600">Low</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verification:</span>
                  <Badge variant="outline" className="text-blue-600">VCS</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cancellation:</span>
                  <span className="font-medium">30 days</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}