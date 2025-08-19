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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@orenna/ui';
import { 
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Droplets,
  Leaf,
  Zap,
  Building,
  MapPin,
  Calendar,
  Target,
  ShoppingCart,
  Eye,
  ArrowUpDown,
  Star,
  Shield
} from 'lucide-react';

interface MarketplaceItem {
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
  };
  project: {
    name: string;
    developer: string;
    impactMetrics: {
      type: string;
      value: number;
      unit: string;
    }[];
  };
  funding?: {
    target: number;
    raised: number;
    backers: number;
  };
  rating?: number;
  createdAt: string;
}

interface MarketplaceDashboardProps {
  onViewItem?: (item: MarketplaceItem) => void;
  onPurchase?: (item: MarketplaceItem) => void;
}

export function MarketplaceDashboard({ onViewItem, onPurchase }: MarketplaceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'forwards' | 'tokens'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'rating' | 'volume'>('date');
  const [filterType, setFilterType] = useState<'all' | 'water' | 'carbon' | 'energy' | 'mixed'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Mock data - replace with actual API call
  const mockItems: MarketplaceItem[] = [
    {
      id: 1,
      type: 'forward',
      projectType: 'water',
      name: 'California Watershed Restoration Forward',
      description: 'Large-scale watershed restoration project in Northern California focusing on groundwater recharge and biodiversity enhancement.',
      location: 'California, USA',
      price: 45.50,
      currency: 'USD',
      availableSupply: 1500,
      deliveryDate: '2025-12-31',
      verification: {
        status: 'pending',
        methodology: 'VWBA v2.0'
      },
      project: {
        name: 'Sacramento Valley Restoration',
        developer: 'AquaRestore Inc.',
        impactMetrics: [
          { type: 'Water Volume', value: 50000, unit: 'cubic meters' },
          { type: 'Habitat Area', value: 250, unit: 'hectares' }
        ]
      },
      funding: {
        target: 750000,
        raised: 425000,
        backers: 28
      },
      rating: 4.2,
      createdAt: '2024-11-15'
    },
    {
      id: 2,
      type: 'token',
      projectType: 'carbon',
      name: 'Amazon Reforestation Carbon Credits',
      description: 'Verified carbon credits from reforestation activities in the Brazilian Amazon, supporting local communities.',
      location: 'Amazon Basin, Brazil',
      price: 28.75,
      currency: 'USD',
      totalSupply: 10000,
      availableSupply: 7500,
      vintage: '2023',
      verification: {
        status: 'verified',
        methodology: 'VCS',
        confidence: 0.95
      },
      project: {
        name: 'Amazon Green Corridor',
        developer: 'Forest Solutions Ltd.',
        impactMetrics: [
          { type: 'CO2 Sequestered', value: 25000, unit: 'tonnes' },
          { type: 'Trees Planted', value: 500000, unit: 'trees' }
        ]
      },
      rating: 4.8,
      createdAt: '2024-10-20'
    },
    {
      id: 3,
      type: 'forward',
      projectType: 'energy',
      name: 'Rural Solar Microgrid Forward',
      description: 'Community solar microgrid project providing clean energy access to rural communities in Kenya.',
      location: 'Nakuru County, Kenya',
      price: 32.00,
      currency: 'USD',
      availableSupply: 800,
      deliveryDate: '2025-06-30',
      verification: {
        status: 'pending',
        methodology: 'Gold Standard'
      },
      project: {
        name: 'Nakuru Solar Initiative',
        developer: 'SolarAfrica Partners',
        impactMetrics: [
          { type: 'Energy Capacity', value: 2.5, unit: 'MW' },
          { type: 'Households Served', value: 1200, unit: 'families' }
        ]
      },
      funding: {
        target: 250000,
        raised: 180000,
        backers: 15
      },
      rating: 4.5,
      createdAt: '2024-11-10'
    },
    {
      id: 4,
      type: 'token',
      projectType: 'water',
      name: 'Texas Aquifer Recharge Credits',
      description: 'Verified water benefit credits from managed aquifer recharge operations in South Texas.',
      location: 'Texas, USA',
      price: 52.25,
      currency: 'USD',
      totalSupply: 5000,
      availableSupply: 3200,
      vintage: '2024',
      verification: {
        status: 'verified',
        methodology: 'VWBA v2.0',
        confidence: 0.92
      },
      project: {
        name: 'Edwards Aquifer Enhancement',
        developer: 'Texas Water Conservancy',
        impactMetrics: [
          { type: 'Water Recharged', value: 75000, unit: 'cubic meters' },
          { type: 'Aquifer Enhancement', value: 15, unit: 'percent' }
        ]
      },
      rating: 4.6,
      createdAt: '2024-09-15'
    }
  ];

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="h-4 w-4 text-blue-600" />;
      case 'carbon': return <Leaf className="h-4 w-4 text-green-600" />;
      case 'energy': return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'mixed': return <Building className="h-4 w-4 text-purple-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVerificationBadge = (verification?: MarketplaceItem['verification']) => {
    if (!verification) return null;
    
    switch (verification.status) {
      case 'verified':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            Unverified
          </Badge>
        );
    }
  };

  const filteredItems = mockItems.filter(item => {
    const matchesTab = activeTab === 'all' || item.type === activeTab.slice(0, -1);
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.projectType === filterType;
    
    return matchesTab && matchesSearch && matchesType;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'volume':
        return b.availableSupply - a.availableSupply;
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const forwardsCount = mockItems.filter(item => item.type === 'forward').length;
  const tokensCount = mockItems.filter(item => item.type === 'token').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Lift Token Marketplace</h1>
        <p className="text-muted-foreground">
          Discover forwards and tokens from regenerative finance projects worldwide
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Listed</p>
                <p className="text-2xl font-bold">{mockItems.length}</p>
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forwards</p>
                <p className="text-2xl font-bold text-orange-600">{forwardsCount}</p>
              </div>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tokens</p>
                <p className="text-2xl font-bold text-green-600">{tokensCount}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">
                  ${(mockItems.reduce((sum, item) => sum + item.price, 0) / mockItems.length).toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects, locations..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Project Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="carbon">Carbon</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Latest</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="all">All ({mockItems.length})</TabsTrigger>
          <TabsTrigger value="forwards">Forwards ({forwardsCount})</TabsTrigger>
          <TabsTrigger value="tokens">Tokens ({tokensCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {sortedItems.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No items found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getProjectTypeIcon(item.projectType)}
                        <Badge variant={item.type === 'forward' ? 'secondary' : 'default'}>
                          {item.type}
                        </Badge>
                      </div>
                      {getVerificationBadge(item.verification)}
                    </div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {item.location}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Price per unit</span>
                        <span className="text-lg font-bold">
                          ${item.price} {item.currency}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Available</span>
                        <span>{item.availableSupply.toLocaleString()} units</span>
                      </div>

                      {item.type === 'forward' && item.funding && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Funding Progress</span>
                            <span>{Math.round((item.funding.raised / item.funding.target) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(item.funding.raised / item.funding.target) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>${item.funding.raised.toLocaleString()} raised</span>
                            <span>{item.funding.backers} backers</span>
                          </div>
                        </div>
                      )}

                      {item.deliveryDate && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          Delivery: {new Date(item.deliveryDate).toLocaleDateString()}
                        </div>
                      )}

                      {item.rating && (
                        <div className="flex items-center text-sm">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          {item.rating.toFixed(1)} rating
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Impact Metrics</h5>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {item.project.impactMetrics.slice(0, 2).map((metric, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{metric.type}:</span>
                            <span>{metric.value.toLocaleString()} {metric.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {onViewItem && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onViewItem(item)}
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      )}
                      {onPurchase && (
                        <Button 
                          size="sm" 
                          onClick={() => onPurchase(item)}
                          className="flex-1"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          {item.type === 'forward' ? 'Back Project' : 'Purchase'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}