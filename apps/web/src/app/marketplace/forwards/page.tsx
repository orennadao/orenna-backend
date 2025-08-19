'use client';

import { useState } from 'react';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
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
  Shield
} from 'lucide-react';
import Link from 'next/link';

interface ForwardItem {
  id: number;
  projectType: 'water' | 'carbon' | 'energy' | 'mixed';
  name: string;
  description: string;
  location: string;
  price: number;
  currency: string;
  availableSupply: number;
  deliveryDate: string;
  verification: {
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
  funding: {
    target: number;
    raised: number;
    backers: number;
    escrowAddress?: string;
  };
  rating?: number;
  createdAt: string;
}

export default function ForwardsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'rating' | 'funding'>('date');

  // Mock forwards data - this would come from your API
  const mockForwards: ForwardItem[] = [
    {
      id: 1,
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
        backers: 28,
        escrowAddress: '0x1234...5678'
      },
      rating: 4.2,
      createdAt: '2024-11-15'
    },
    {
      id: 3,
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
        backers: 15,
        escrowAddress: '0xabcd...efgh'
      },
      rating: 4.5,
      createdAt: '2024-11-10'
    },
    {
      id: 5,
      projectType: 'carbon',
      name: 'Mangrove Restoration Forward',
      description: 'Coastal mangrove restoration project in Southeast Asia supporting carbon sequestration and coastal protection.',
      location: 'Philippines',
      price: 38.75,
      currency: 'USD',
      availableSupply: 1200,
      deliveryDate: '2025-09-15',
      verification: {
        status: 'verified',
        methodology: 'VCS',
        confidence: 0.93
      },
      project: {
        name: 'Philippines Mangrove Initiative',
        developer: 'Coastal Restoration Corp.',
        impactMetrics: [
          { type: 'CO2 Sequestered', value: 15000, unit: 'tonnes' },
          { type: 'Coastline Protected', value: 50, unit: 'kilometers' }
        ]
      },
      funding: {
        target: 500000,
        raised: 320000,
        backers: 42,
        escrowAddress: '0x9876...5432'
      },
      rating: 4.7,
      createdAt: '2024-10-05'
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

  const getVerificationBadge = (verification: ForwardItem['verification']) => {
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

  const filteredForwards = mockForwards.filter(forward =>
    forward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    forward.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedForwards = [...filteredForwards].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'funding':
        return (b.funding.raised / b.funding.target) - (a.funding.raised / a.funding.target);
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const totalFunding = mockForwards.reduce((sum, forward) => sum + forward.funding.target, 0);
  const totalRaised = mockForwards.reduce((sum, forward) => sum + forward.funding.raised, 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Lift Forwards</h1>
                <p className="text-muted-foreground">
                  Back regenerative projects before they deliver verified outcomes
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Forwards</p>
                        <p className="text-2xl font-bold">{mockForwards.length}</p>
                      </div>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Funding</p>
                        <p className="text-2xl font-bold">${(totalFunding / 1000000).toFixed(1)}M</p>
                      </div>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Funds Raised</p>
                        <p className="text-2xl font-bold text-green-600">${(totalRaised / 1000000).toFixed(1)}M</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Backers</p>
                        <p className="text-2xl font-bold">
                          {mockForwards.reduce((sum, forward) => sum + forward.funding.backers, 0)}
                        </p>
                      </div>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search forwards by name or location..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select 
                      className="px-3 py-2 border border-border rounded-md"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="date">Sort by Date</option>
                      <option value="price">Sort by Price</option>
                      <option value="rating">Sort by Rating</option>
                      <option value="funding">Sort by Funding Progress</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Forwards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedForwards.map((forward) => (
                  <Card key={forward.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getProjectTypeIcon(forward.projectType)}
                          <CardTitle className="text-lg">{forward.name}</CardTitle>
                        </div>
                        {getVerificationBadge(forward.verification)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {forward.location}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <CardDescription className="text-sm">
                        {forward.description}
                      </CardDescription>

                      {/* Funding Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Funding Progress</span>
                          <span className="font-medium">
                            ${(forward.funding.raised / 1000).toFixed(0)}k / ${(forward.funding.target / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-brand h-2 rounded-full" 
                            style={{ width: `${(forward.funding.raised / forward.funding.target) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{forward.funding.backers} backers</span>
                          <span>{((forward.funding.raised / forward.funding.target) * 100).toFixed(0)}% funded</span>
                        </div>
                      </div>

                      {/* Impact Metrics */}
                      <div className="grid grid-cols-2 gap-2">
                        {forward.project.impactMetrics.slice(0, 2).map((metric, index) => (
                          <div key={index} className="text-center p-2 bg-muted/30 rounded">
                            <div className="font-semibold text-sm">{metric.value.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{metric.type}</div>
                          </div>
                        ))}
                      </div>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <div className="text-lg font-bold">${forward.price}</div>
                          <div className="text-xs text-muted-foreground">per forward unit</div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/marketplace/forwards/${forward.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Link href={`/marketplace/forwards/${forward.id}/buy`}>
                            <Button size="sm" className="bg-brand hover:bg-brand/90">
                              Back Project
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Escrow Address */}
                      {forward.funding.escrowAddress && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Escrow:</strong> {forward.funding.escrowAddress}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredForwards.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No forwards found matching your search.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}