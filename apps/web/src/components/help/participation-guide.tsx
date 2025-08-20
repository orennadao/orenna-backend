'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search,
  DollarSign,
  TrendingUp,
  Award,
  ArrowRight,
  Globe,
  Eye,
  Target
} from 'lucide-react';

interface ParticipationStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  details: string[];
  action?: {
    label: string;
    href: string;
  };
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeEstimate: string;
}

const participationSteps: ParticipationStep[] = [
  {
    id: 1,
    title: 'Browse Projects',
    description: 'Explore active ecological restoration projects on the dashboard',
    icon: Search,
    details: [
      'Filter projects by type, location, and ecological focus',
      'Read project descriptions and restoration plans',
      'Review team credentials and past performance',
      'Check funding progress and timeline milestones'
    ],
    action: {
      label: 'Browse Projects',
      href: '/projects'
    },
    difficulty: 'Beginner',
    timeEstimate: '10-15 minutes'
  },
  {
    id: 2,
    title: 'Fund a Project',
    description: 'Purchase Lift Forwards to support implementation',
    icon: DollarSign,
    details: [
      'Choose forward contracts that align with your values',
      'Review project milestones and delivery timeline',
      'Purchase forwards with ETH or supported tokens',
      'Receive confirmation and smart contract receipt'
    ],
    action: {
      label: 'View Forwards',
      href: '/marketplace/forwards'
    },
    difficulty: 'Beginner',
    timeEstimate: '5-10 minutes'
  },
  {
    id: 3,
    title: 'Track Progress',
    description: 'Each project has a transparent record of milestones, budgets, and ecological metrics',
    icon: TrendingUp,
    details: [
      'Monitor milestone completion and fund disbursement',
      'View ecological measurement updates from the field',
      'Access verification reports from independent assessors',
      'Follow community discussions and project updates'
    ],
    action: {
      label: 'View Dashboard',
      href: '/dashboard'
    },
    difficulty: 'Beginner',
    timeEstimate: 'Ongoing'
  },
  {
    id: 4,
    title: 'Claim Lift',
    description: 'Once verified, Lift Tokens can be retired (to claim ecological outcomes) or transferred',
    icon: Award,
    details: [
      'Receive Lift Tokens upon project completion and verification',
      'Choose to retire tokens to claim environmental benefits',
      'Transfer tokens to others or trade on secondary markets',
      'Generate certificates for carbon accounting or ESG reporting'
    ],
    action: {
      label: 'View Tokens',
      href: '/lift-tokens'
    },
    difficulty: 'Intermediate',
    timeEstimate: 'As projects complete'
  }
];

const difficultyColors = {
  'Beginner': 'bg-green-100 text-green-800',
  'Intermediate': 'bg-yellow-100 text-yellow-800',
  'Advanced': 'bg-red-100 text-red-800'
};

interface StepCardProps {
  step: ParticipationStep;
}

function ParticipationStepCard({ step }: StepCardProps) {
  const Icon = step.icon;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-blue-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  Step {step.id}
                </Badge>
                <Badge className={`text-xs ${difficultyColors[step.difficulty]}`}>
                  {step.difficulty}
                </Badge>
                <span className="text-xs text-gray-500">
                  {step.timeEstimate}
                </span>
              </div>
              <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                {step.title}
              </CardTitle>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mt-3 leading-relaxed">
          {step.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">How it works:</h4>
          <ul className="space-y-2">
            {step.details.map((detail, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
                <span className="leading-relaxed">{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        {step.action && (
          <div className="pt-2">
            <Button asChild variant="outline" className="w-full group-hover:bg-blue-50 group-hover:border-blue-300">
              <a href={step.action.href} className="flex items-center justify-center gap-2">
                {step.action.label}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ParticipationGuide() {
  return (
    <section id="participation" className="scroll-mt-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Participating in Projects</h2>
        </div>
        <p className="text-gray-600">
          Learn how to discover, fund, and track ecological restoration projects on the Orenna platform.
        </p>
      </div>

      {/* Key Benefits */}
      <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Why participate in ecological restoration?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Direct Impact</h4>
                <p className="text-xs text-gray-600">Fund verified restoration work that creates measurable ecological benefits</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Full Transparency</h4>
                <p className="text-xs text-gray-600">Track every milestone, expense, and outcome on the blockchain</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Verified Results</h4>
                <p className="text-xs text-gray-600">Independent verification ensures authentic ecological outcomes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {participationSteps.map((step) => (
          <ParticipationStepCard key={step.id} step={step} />
        ))}
      </div>

      {/* Call to Action */}
      <Card className="mt-8 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">
            Ready to Make an Impact?
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of funders supporting ecological restoration worldwide. 
            Every contribution helps heal ecosystems and combat climate change.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <a href="/projects" className="flex items-center gap-2">
                Start Exploring Projects
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <a href="/governance" className="flex items-center gap-2">
                Join Governance
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}