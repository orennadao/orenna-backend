'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  Calendar, 
  Coins, 
  Shield,
  ArrowRight,
  Zap
} from 'lucide-react';

interface ConceptCard {
  title: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  details: string[];
  color: 'green' | 'blue' | 'purple' | 'orange';
}

const concepts: ConceptCard[] = [
  {
    title: 'Lift Tokens',
    description: 'Digital representations of verified ecological lift (improved ecosystem function)',
    icon: Leaf,
    badge: 'ERC-1155',
    details: [
      'Represent measurable ecological improvements',
      'Can be transferred or retired to claim outcomes',
      'Backed by independent verification',
      'Stored on blockchain for transparency'
    ],
    color: 'green'
  },
  {
    title: 'Lift Forwards',
    description: 'Forward purchase agreements that fund restoration work before completion',
    icon: Calendar,
    badge: 'Funding',
    details: [
      'Pre-fund restoration projects',
      'Receive Lift Tokens upon project completion',
      'Support land stewards with upfront capital',
      'Milestone-based fund release'
    ],
    color: 'blue'
  },
  {
    title: 'Project NFTs',
    description: 'Digital containers that organize Lift Tokens and Forwards for each project',
    icon: Shield,
    badge: 'ERC-721',
    details: [
      'Unique identifier for each project',
      'Contains all project-related tokens',
      'Transparent milestone tracking',
      'Immutable project history'
    ],
    color: 'purple'
  },
  {
    title: 'Governance Token',
    description: 'Enables community decision-making on protocol changes and strategy',
    icon: Coins,
    badge: 'ERC-20',
    details: [
      'Vote on protocol improvements',
      'Propose new features and standards',
      'Participate in treasury decisions',
      'Join working groups and committees'
    ],
    color: 'orange'
  }
];

const colorClasses = {
  green: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    icon: 'text-green-600 bg-green-100',
    border: 'hover:border-green-300'
  },
  blue: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'text-blue-600 bg-blue-100',
    border: 'hover:border-blue-300'
  },
  purple: {
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'text-purple-600 bg-purple-100',
    border: 'hover:border-purple-300'
  },
  orange: {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'text-orange-600 bg-orange-100',
    border: 'hover:border-orange-300'
  }
};

export function QuickStartCards() {
  return (
    <section id="concepts" className="scroll-mt-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Key Concepts</h2>
        </div>
        <p className="text-gray-600">
          Understanding these core concepts will help you navigate the Orenna ecosystem effectively.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {concepts.map((concept) => {
          const Icon = concept.icon;
          const colors = colorClasses[concept.color];
          
          return (
            <Card 
              key={concept.title}
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg ${colors.border} border-gray-200`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${colors.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className={colors.badge}>
                    {concept.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                  {concept.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {concept.description}
                </p>
                
                <ul className="space-y-2">
                  {concept.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <ArrowRight className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-4">
              Connect your wallet and explore live projects on the platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a 
                href="/auth" 
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Connect Wallet
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a 
                href="/projects" 
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Browse Projects
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}