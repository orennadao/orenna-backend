'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MarketplaceDashboard } from "@/components/marketplace/marketplace-dashboard";
import { MarketplaceItemDetails } from "@/components/marketplace/marketplace-item-details";

// Mock marketplace item type (should be imported from API client)
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
}

export default function MarketplacePage() {
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  const handleViewItem = (item: MarketplaceItem) => {
    // Enhance the item with additional details for the detail view
    const enhancedItem = {
      ...item,
      verification: {
        ...item.verification,
        verifier: item.verification?.status === 'verified' ? 'Verified Solutions Inc.' : undefined,
        verifiedAt: item.verification?.status === 'verified' ? '2024-10-15' : undefined,
      },
      project: {
        ...item.project,
        timeline: {
          start: '2024-01-15',
          end: '2025-12-31'
        },
        stakeholders: ['Local Communities', 'Environmental NGOs', 'Government Partners'],
        methodology: item.verification?.methodology || 'Standard Environmental Protocol'
      },
      riskAssessment: {
        level: 'low' as const,
        factors: [
          'Regulatory compliance verified',
          'Experienced project developer',
          'Established verification methodology',
          'Strong local stakeholder support'
        ]
      },
      documents: [
        { name: 'Project Design Document', type: 'PDF', url: '#' },
        { name: 'Environmental Impact Assessment', type: 'PDF', url: '#' },
        { name: 'Verification Report', type: 'PDF', url: '#' },
        { name: 'Monitoring Plan', type: 'PDF', url: '#' }
      ],
      reviews: {
        count: 12,
        average: item.rating || 4.5
      }
    };

    setSelectedItem(enhancedItem);
  };

  const handlePurchase = (item: MarketplaceItem, quantity: number) => {
    // TODO: Integrate with actual purchase/funding flow
    console.log('Purchase/Fund:', {
      itemId: item.id,
      itemName: item.name,
      type: item.type,
      quantity,
      totalCost: quantity * item.price
    });
    
    // For now, just show an alert
    alert(`${item.type === 'forward' ? 'Backing' : 'Purchasing'} ${quantity} units of "${item.name}" for $${(quantity * item.price).toFixed(2)}`);
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  return (
    <ProtectedRoute 
      allowGuest={true}
      guestMessage="Browse marketplace items publicly. Connect your wallet to make purchases and access advanced features."
    >
      <MainLayout 
        title="Marketplace"
        description="Browse and purchase regenerative finance assets"
      >
        {selectedItem ? (
          <MarketplaceItemDetails
            item={selectedItem}
            onBack={handleBack}
            onPurchase={handlePurchase}
          />
        ) : (
          <MarketplaceDashboard 
            onViewItem={handleViewItem}
            onPurchase={handlePurchase}
          />
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}