'use client';

import { useState } from 'react';
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Search,
  Coins,
  Droplets,
  Leaf,
  Zap,
  Building,
  MapPin,
  Calendar,
  Target,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Shield,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Recycle,
  Award,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface LiftToken {
  id: number;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  projectType: 'water' | 'carbon' | 'energy' | 'biodiversity' | 'mixed';
  name: string;
  description: string;
  location: string;
  price: number;
  currency: string;
  availableSupply: number;
  totalSupply: number;
  retiredAmount: number;
  priceChange24h: number;
  issuanceDate: string;
  verification: {
    status: 'verified' | 'pending' | 'unverified';
    methodology?: string;
    verifier?: string;
    confidence?: number;
  };
  project: {
    name: string;
    developer: string;
    nftId: number;
    impactMetrics: {
      type: string;
      value: number;
      unit: string;
    }[];
  };
  trading: {
    volume24h: number;
    holders: number;
    avgPrice: number;
    retirementRate: number;
  };
  status: 'active' | 'retired' | 'locked';
  rating?: number;
  createdAt: string;
}

export default function LiftTokensPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'volume' | 'rating'>('date');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock Lift Token data
  const mockLiftTokens: LiftToken[] = [
    {
      id: 1,
      tokenId: "LFT001",
      contractAddress: "0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A",
      chainId: 1,
      projectType: 'carbon',
      name: 'Amazon Rainforest Carbon Credits',
      description: 'Verified carbon credits from REDD+ forest conservation project in the Brazilian Amazon rainforest.',
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
        confidence: 0.95
      },
      project: {
        name: 'Amazon Conservation Initiative',
        developer: 'Rainforest Alliance Brazil',
        nftId: 101,
        impactMetrics: [
          { type: 'CO2 Sequestered', value: 50000, unit: 'tonnes' },
          { type: 'Forest Area Protected', value: 10000, unit: 'hectares' },
          { type: 'Biodiversity Species', value: 1250, unit: 'species' }
        ]
      },
      trading: {
        volume24h: 156000,
        holders: 89,
        avgPrice: 27.80,
        retirementRate: 24.0
      },
      status: 'active',
      rating: 4.8,
      createdAt: '2024-09-15'
    },
    {
      id: 2,
      tokenId: "LFT002", 
      contractAddress: "0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A",
      chainId: 1,
      projectType: 'water',
      name: 'California Aquifer Restoration Credits',
      description: 'Water restoration credits from groundwater recharge and wetland restoration in Central Valley.',
      location: 'California, USA',
      price: 22.75,
      currency: 'USD',
      availableSupply: 1800,
      totalSupply: 3000,
      retiredAmount: 850,
      priceChange24h: -1.5,
      issuanceDate: '2024-10-01',
      verification: {
        status: 'verified',
        methodology: 'VWBA v2.1',
        verifier: 'Water Verification Bureau',
        confidence: 0.92
      },
      project: {
        name: 'Central Valley Water Recovery',
        developer: 'AquaRestore California',
        nftId: 102,
        impactMetrics: [
          { type: 'Water Volume Restored', value: 75000, unit: 'cubic meters' },
          { type: 'Wetland Area', value: 450, unit: 'hectares' },
          { type: 'Species Habitat', value: 180, unit: 'species' }
        ]
      },
      trading: {
        volume24h: 89000,
        holders: 67,
        avgPrice: 23.10,
        retirementRate: 28.3
      },
      status: 'active',
      rating: 4.6,
      createdAt: '2024-10-01'
    },
    {
      id: 3,
      tokenId: "LFT003",
      contractAddress: "0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A", 
      chainId: 1,
      projectType: 'energy',
      name: 'Kenya Solar Microgrid Credits',
      description: 'Renewable energy credits from community solar installations providing clean energy access.',
      location: 'Nakuru County, Kenya',
      price: 18.25,
      currency: 'USD',
      availableSupply: 3200,
      totalSupply: 4000,
      retiredAmount: 400,
      priceChange24h: 5.8,
      issuanceDate: '2024-11-05',
      verification: {
        status: 'verified',
        methodology: 'Gold Standard',
        verifier: 'TÜV SÜD',
        confidence: 0.89
      },
      project: {
        name: 'Rural Solar Access Project',
        developer: 'SolarAfrica Collective',
        nftId: 103,
        impactMetrics: [
          { type: 'Clean Energy Generated', value: 2800, unit: 'MWh' },
          { type: 'Households Connected', value: 1200, unit: 'families' },
          { type: 'CO2 Avoided', value: 1800, unit: 'tonnes' }
        ]
      },
      trading: {
        volume24h: 124000,
        holders: 45,
        avgPrice: 17.50,
        retirementRate: 10.0
      },
      status: 'active',
      rating: 4.4,
      createdAt: '2024-11-05'
    },
    {
      id: 4,
      tokenId: "LFT004",
      contractAddress: "0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A",
      chainId: 1,
      projectType: 'biodiversity',
      name: 'Coral Reef Restoration Credits',
      description: 'Marine biodiversity credits from coral reef restoration and protection in the Great Barrier Reef.',
      location: 'Queensland, Australia',
      price: 35.00,
      currency: 'USD',
      availableSupply: 750,
      totalSupply: 1500,
      retiredAmount: 600,
      priceChange24h: 1.2,
      issuanceDate: '2024-08-20',
      verification: {
        status: 'verified',
        methodology: 'Marine Stewardship Standard',
        verifier: 'Ocean Foundation',
        confidence: 0.88
      },
      project: {
        name: 'Great Barrier Reef Recovery',
        developer: 'Reef Alliance Australia',
        nftId: 104,
        impactMetrics: [
          { type: 'Reef Area Restored', value: 125, unit: 'hectares' },
          { type: 'Coral Colonies', value: 15000, unit: 'colonies' },
          { type: 'Marine Species', value: 350, unit: 'species' }
        ]
      },
      trading: {
        volume24h: 67000,
        holders: 32,
        avgPrice: 34.50,
        retirementRate: 40.0
      },
      status: 'active',
      rating: 4.9,
      createdAt: '2024-08-20'
    },
    {
      id: 5,
      tokenId: "LFT005",
      contractAddress: "0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A",
      chainId: 1,
      projectType: 'mixed',
      name: 'Integrated Ecosystem Restoration',
      description: 'Multi-benefit credits from integrated land management including carbon, water, and biodiversity.',
      location: 'Costa Rica',
      price: 42.80,
      currency: 'USD',
      availableSupply: 1200,
      totalSupply: 2000,
      retiredAmount: 350,
      priceChange24h: 2.1,
      issuanceDate: '2024-07-10',
      verification: {
        status: 'verified',
        methodology: 'Climate Community Biodiversity',
        verifier: 'Rainforest Alliance',
        confidence: 0.94
      },
      project: {
        name: 'Costa Rica Ecosystem Recovery',
        developer: 'Tropical Conservation Alliance',
        nftId: 105,
        impactMetrics: [
          { type: 'CO2 Sequestered', value: 25000, unit: 'tonnes' },
          { type: 'Watershed Protected', value: 5000, unit: 'hectares' },
          { type: 'Species Corridors', value: 12, unit: 'corridors' }
        ]
      },
      trading: {
        volume24h: 198000,
        holders: 76,
        avgPrice: 41.20,
        retirementRate: 17.5
      },
      status: 'active',
      rating: 4.7,
      createdAt: '2024-07-10'
    }
  ];

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="h-4 w-4 text-blue-600" />;
      case 'carbon': return <Leaf className="h-4 w-4 text-green-600" />;
      case 'energy': return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'biodiversity': return <Activity className="h-4 w-4 text-purple-600" />;
      case 'mixed': return <Building className="h-4 w-4 text-orange-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVerificationBadge = (verification: LiftToken['verification']) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'retired':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Retired</Badge>;
      case 'locked':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Locked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredTokens = mockLiftTokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || token.projectType === filterType;
    const matchesStatus = filterStatus === 'all' || token.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'volume':
        return b.trading.volume24h - a.trading.volume24h;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const totalMarketCap = mockLiftTokens.reduce((sum, token) => sum + (token.totalSupply * token.price), 0);
  const totalVolume24h = mockLiftTokens.reduce((sum, token) => sum + token.trading.volume24h, 0);
  const totalRetired = mockLiftTokens.reduce((sum, token) => sum + token.retiredAmount, 0);

  return (
    <ProtectedRoute>
      <MainLayout
        title="Lift Token Marketplace"
        description="Purchase and retire verified environmental impact tokens"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Coins className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold">Lift Token Marketplace</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Purchase verified environmental impact tokens representing real-world outcomes. 
              Retire tokens to claim environmental benefits and support regenerative projects.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available Tokens</p>
                    <p className="text-2xl font-bold">{mockLiftTokens.length}</p>
                  </div>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
                    <p className="text-2xl font-bold">${(totalMarketCap / 1000000).toFixed(1)}M</p>
                  </div>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">24h Volume</p>
                    <p className="text-2xl font-bold text-green-600">${(totalVolume24h / 1000).toFixed(0)}K</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tokens Retired</p>
                    <p className="text-2xl font-bold text-purple-600">{totalRetired.toLocaleString()}</p>
                  </div>
                  <Recycle className="h-4 w-4 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tokens by name or location..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="px-3 py-2 border border-border rounded-md text-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="carbon">Carbon</option>
                    <option value="water">Water</option>
                    <option value="energy">Energy</option>
                    <option value="biodiversity">Biodiversity</option>
                    <option value="mixed">Mixed Benefits</option>
                  </select>
                  <select 
                    className="px-3 py-2 border border-border rounded-md text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="retired">Retired</option>
                    <option value="locked">Locked</option>
                  </select>
                  <select 
                    className="px-3 py-2 border border-border rounded-md text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="date">Sort by Date</option>
                    <option value="price">Sort by Price</option>
                    <option value="volume">Sort by Volume</option>
                    <option value="rating">Sort by Rating</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tokens Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedTokens.map((token) => (
              <Card key={token.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getProjectTypeIcon(token.projectType)}
                      <div>
                        <CardTitle className="text-lg">{token.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {token.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getVerificationBadge(token.verification)}
                      {getStatusBadge(token.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {token.description}
                  </CardDescription>

                  {/* Token Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/30 rounded">
                      <div className="font-semibold">{token.availableSupply.toLocaleString()}</div>
                      <div className="text-muted-foreground">Available</div>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded">
                      <div className="font-semibold">{token.trading.holders}</div>
                      <div className="text-muted-foreground">Holders</div>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded">
                      <div className="font-semibold">{token.retiredAmount.toLocaleString()}</div>
                      <div className="text-muted-foreground">Retired</div>
                    </div>
                  </div>

                  {/* Supply Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Supply Utilization</span>
                      <span className="font-medium">
                        {(((token.totalSupply - token.availableSupply) / token.totalSupply) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={((token.totalSupply - token.availableSupply) / token.totalSupply) * 100} />
                  </div>

                  {/* Impact Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    {token.project.impactMetrics.slice(0, 2).map((metric, index) => (
                      <div key={index} className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-sm text-green-800">{metric.value.toLocaleString()}</div>
                        <div className="text-xs text-green-600">{metric.type}</div>
                      </div>
                    ))}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <div className="text-lg font-bold flex items-center gap-2">
                        ${token.price}
                        {token.priceChange24h >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                        )}
                        <span className={`text-sm ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">per token unit</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/marketplace/lift-tokens/${token.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/marketplace/lift-tokens/${token.id}/buy`}>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Buy & Retire
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Token Info */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><strong>Token ID:</strong> {token.tokenId}</div>
                    <div><strong>Project NFT:</strong> #{token.project.nftId}</div>
                    <div><strong>24h Volume:</strong> ${token.trading.volume24h.toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTokens.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No lift tokens found matching your criteria.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}