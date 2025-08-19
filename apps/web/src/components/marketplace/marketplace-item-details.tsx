'use client';

import { useState } from 'react';
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
  Textarea
} from '@orenna/ui';
import { 
  ArrowLeft,
  Share2,
  Heart,
  ShoppingCart,
  DollarSign,
  MapPin,
  Calendar,
  Target,
  Shield,
  CheckCircle,
  Clock,
  Star,
  Users,
  TrendingUp,
  FileText,
  Download,
  Droplets,
  Leaf,
  Zap,
  Building,
  AlertCircle
} from 'lucide-react';

interface MarketplaceItemDetailsProps {
  item: {
    id: number;
    type: 'forward' | 'token';
    projectType: 'water' | 'carbon' | 'energy' | 'mixed';
    name: string;
    description: string;
    location: string;
    price: number;
    currency: string;
    totalSupply?: number;
    availableSupply: number;
    vintage?: string;
    deliveryDate?: string;
    verification?: {
      status: 'verified' | 'pending' | 'unverified';
      methodology?: string;
      confidence?: number;
      verifier?: string;
      verifiedAt?: string;
    };
    project: {
      name: string;
      developer: string;
      impactMetrics: {
        type: string;
        value: number;
        unit: string;
      }[];
      methodology?: string;
      timeline?: {
        start: string;
        end: string;
      };
      stakeholders?: string[];
    };
    funding?: {
      target: number;
      raised: number;
      backers: number;
      escrowAddress?: string;
    };
    rating?: number;
    reviews?: {
      count: number;
      average: number;
    };
    riskAssessment?: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
    documents?: {
      name: string;
      type: string;
      url: string;
    }[];
    createdAt: string;
  };
  onBack?: () => void;
  onPurchase?: (item: any, quantity: number) => void;
}

export function MarketplaceItemDetails({ item, onBack, onPurchase }: MarketplaceItemDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'carbon': return <Leaf className="h-5 w-5 text-green-600" />;
      case 'energy': return <Zap className="h-5 w-5 text-yellow-600" />;
      case 'mixed': return <Building className="h-5 w-5 text-purple-600" />;
      default: return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const getVerificationBadge = (verification?: typeof item.verification) => {
    if (!verification) return null;
    
    switch (verification.status) {
      case 'verified':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Shield className="h-3 w-3 mr-1" />
            Verified {verification.confidence && `(${Math.round(verification.confidence * 100)}%)`}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Verification Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unverified
          </Badge>
        );
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge variant="outline" className="text-green-600 border-green-600">Low Risk</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-red-600 border-red-600">High Risk</Badge>;
      default:
        return null;
    }
  };

  const totalCost = quantity * item.price;
  const maxQuantity = Math.min(item.availableSupply, 1000); // Cap at 1000 for UI purposes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFavorited(!isFavorited)}
          >
            <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            {isFavorited ? 'Favorited' : 'Add to Favorites'}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getProjectTypeIcon(item.projectType)}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={item.type === 'forward' ? 'secondary' : 'default'}>
                        {item.type}
                      </Badge>
                      {getVerificationBadge(item.verification)}
                      {item.riskAssessment && getRiskBadge(item.riskAssessment.level)}
                    </div>
                    <CardTitle className="text-2xl">{item.name}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {item.location}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Listed {new Date(item.createdAt).toLocaleDateString()}
                </div>
                {item.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    {item.rating.toFixed(1)} 
                    {item.reviews && ` (${item.reviews.count} reviews)`}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Tabs Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Developer</h4>
                    <p className="text-sm text-muted-foreground">{item.project.developer}</p>
                  </div>
                  
                  {item.project.methodology && (
                    <div>
                      <h4 className="font-medium mb-2">Methodology</h4>
                      <p className="text-sm text-muted-foreground">{item.project.methodology}</p>
                    </div>
                  )}

                  {item.project.timeline && (
                    <div>
                      <h4 className="font-medium mb-2">Timeline</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.project.timeline.start).toLocaleDateString()} - {new Date(item.project.timeline.end).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {item.project.stakeholders && (
                    <div>
                      <h4 className="font-medium mb-2">Key Stakeholders</h4>
                      <div className="flex flex-wrap gap-1">
                        {item.project.stakeholders.map((stakeholder, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {item.type === 'forward' && item.funding && (
                <Card>
                  <CardHeader>
                    <CardTitle>Funding Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round((item.funding.raised / item.funding.target) * 100)}%</span>
                      </div>
                      <Progress value={(item.funding.raised / item.funding.target) * 100} />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${item.funding.raised.toLocaleString()} raised</span>
                        <span>Target: ${item.funding.target.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{item.funding.backers}</p>
                        <p className="text-sm text-muted-foreground">Backers</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          ${(item.funding.target - item.funding.raised).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                      </div>
                    </div>

                    {item.funding.escrowAddress && (
                      <div>
                        <h5 className="font-medium mb-1">Escrow Address</h5>
                        <p className="text-xs font-mono bg-muted p-2 rounded">
                          {item.funding.escrowAddress}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="impact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Impact Metrics</CardTitle>
                  <CardDescription>
                    Expected environmental and social impacts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.project.impactMetrics.map((metric, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {metric.value.toLocaleString()}
                            </p>
                            <p className="text-sm font-medium">{metric.unit}</p>
                            <p className="text-xs text-muted-foreground mt-1">{metric.type}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.verification ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        {getVerificationBadge(item.verification)}
                      </div>
                      
                      {item.verification.methodology && (
                        <div className="flex items-center justify-between">
                          <span>Methodology</span>
                          <Badge variant="outline">{item.verification.methodology}</Badge>
                        </div>
                      )}

                      {item.verification.confidence && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Confidence Score</span>
                            <span>{Math.round(item.verification.confidence * 100)}%</span>
                          </div>
                          <Progress value={item.verification.confidence * 100} />
                        </div>
                      )}

                      {item.verification.verifier && (
                        <div className="flex items-center justify-between">
                          <span>Verifier</span>
                          <span className="text-sm text-muted-foreground">{item.verification.verifier}</span>
                        </div>
                      )}

                      {item.verification.verifiedAt && (
                        <div className="flex items-center justify-between">
                          <span>Verified Date</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.verification.verifiedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Not Yet Verified</h3>
                      <p className="text-sm text-muted-foreground">
                        This {item.type} has not undergone verification yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {item.riskAssessment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Risk Level</span>
                      {getRiskBadge(item.riskAssessment.level)}
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Risk Factors</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {item.riskAssessment.factors.map((factor, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Supporting Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.documents && item.documents.length > 0 ? (
                    <div className="space-y-2">
                      {item.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{doc.name}</span>
                            <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Documents Available</h3>
                      <p className="text-sm text-muted-foreground">
                        Supporting documents have not been uploaded yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Purchase/Funding */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{item.type === 'forward' ? 'Back This Project' : 'Purchase Tokens'}</span>
                <div className="text-right">
                  <p className="text-2xl font-bold">${item.price}</p>
                  <p className="text-sm text-muted-foreground">per unit</p>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {item.availableSupply.toLocaleString()} units
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Unit Price:</span>
                  <span>${item.price}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>

              {item.deliveryDate && (
                <div className="text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Expected delivery: {new Date(item.deliveryDate).toLocaleDateString()}
                </div>
              )}

              {onPurchase && (
                <Button 
                  onClick={() => onPurchase(item, quantity)}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {item.type === 'forward' ? 'Back Project' : 'Purchase Tokens'}
                </Button>
              )}

              <div className="text-xs text-muted-foreground text-center">
                {item.type === 'forward' 
                  ? 'Funds will be held in escrow until project completion'
                  : 'Tokens will be transferred to your wallet after payment'
                }
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project Type:</span>
                <span className="capitalize">{item.projectType}</span>
              </div>
              
              {item.vintage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vintage:</span>
                  <span>{item.vintage}</span>
                </div>
              )}
              
              {item.totalSupply && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Supply:</span>
                  <span>{item.totalSupply.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available:</span>
                <span>{item.availableSupply.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}