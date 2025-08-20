'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet,
  User,
  Shield,
  ArrowRight,
  CheckCircle,
  PlayCircle,
  ExternalLink
} from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  details: string[];
  action?: {
    label: string;
    href: string;
    external?: boolean;
  };
  tips?: string[];
  estimated?: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Connect a Wallet',
    description: 'Use MetaMask or another supported wallet to create an Orenna account',
    icon: Wallet,
    details: [
      'Install MetaMask browser extension or mobile app',
      'Create a new wallet or import existing one',
      'Ensure you have some ETH for transaction fees',
      'Connect to Ethereum mainnet or supported networks'
    ],
    action: {
      label: 'Connect Wallet',
      href: '/auth'
    },
    tips: [
      'Keep your seed phrase secure and private',
      'Consider using a hardware wallet for large amounts',
      'Make sure you\'re on the official MetaMask website'
    ],
    estimated: '5 minutes'
  },
  {
    id: 2,
    title: 'Sign In with Ethereum (SIWE)',
    description: 'We use SIWE authentication for secure, Web3-native login',
    icon: Shield,
    details: [
      'Click "Sign In" and approve the signature request',
      'No password required - your wallet is your identity',
      'Signatures are free and don\'t require gas fees',
      'Your wallet address becomes your account identifier'
    ],
    tips: [
      'Signing is safe and doesn\'t give access to your funds',
      'Each signature is unique and time-limited',
      'You can sign out and sign back in anytime'
    ],
    estimated: '1 minute'
  },
  {
    id: 3,
    title: 'Profile Setup',
    description: 'Add optional details about your organization, role, and interests',
    icon: User,
    details: [
      'Specify your role: landowner, funder, or restoration professional',
      'Add organization information if applicable',
      'Set your ecological interests and focus areas',
      'Choose privacy settings for your profile'
    ],
    action: {
      label: 'Complete Profile',
      href: '/auth/profile-setup'
    },
    tips: [
      'Profile information helps match you with relevant projects',
      'You can update your profile anytime',
      'Some information may be visible to project creators'
    ],
    estimated: '3 minutes'
  }
];

interface StepCardProps {
  step: Step;
  isActive: boolean;
  isCompleted: boolean;
}

function StepCard({ step, isActive, isCompleted }: StepCardProps) {
  const Icon = step.icon;
  
  return (
    <Card className={`transition-all duration-200 ${
      isActive ? 'ring-2 ring-blue-500 shadow-lg' : 
      isCompleted ? 'bg-green-50 border-green-200' : 
      'hover:shadow-md'
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isCompleted ? 'bg-green-100' : 
              isActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Icon className={`h-5 w-5 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  Step {step.id}
                </Badge>
                {step.estimated && (
                  <span className="text-xs text-gray-500">
                    ~{step.estimated}
                  </span>
                )}
              </div>
              <CardTitle className="text-lg">
                {step.title}
              </CardTitle>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          {step.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">What you'll do:</h4>
          <ul className="space-y-1">
            {step.details.map((detail, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <ArrowRight className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        {step.tips && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-yellow-800 mb-2 text-sm">💡 Tips:</h4>
            <ul className="space-y-1">
              {step.tips.map((tip, index) => (
                <li key={index} className="text-xs text-yellow-700">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        {step.action && !isCompleted && (
          <div className="pt-2">
            <Button asChild className="w-full">
              <a 
                href={step.action.href}
                target={step.action.external ? '_blank' : undefined}
                rel={step.action.external ? 'noopener noreferrer' : undefined}
                className="flex items-center justify-center gap-2"
              >
                {isActive ? <PlayCircle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                {step.action.label}
                {step.action.external && <ExternalLink className="h-3 w-3" />}
              </a>
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="pt-2">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Completed</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GettingStartedGuide() {
  // TODO: Track actual completion status from user context
  const completedSteps = new Set([1]); // Mock: first step completed
  const currentStep = 2; // Mock: currently on step 2

  return (
    <section id="getting-started" className="scroll-mt-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <PlayCircle className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
        </div>
        <p className="text-gray-600">
          Follow these steps to set up your account and start participating in ecological restoration.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Setup Progress
          </span>
          <span className="text-sm text-gray-500">
            {completedSteps.size} of {steps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            isActive={step.id === currentStep}
            isCompleted={completedSteps.has(step.id)}
          />
        ))}
      </div>

      {/* Completion Message */}
      {completedSteps.size === steps.length && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🎉 Account Setup Complete!
            </h3>
            <p className="text-gray-600 mb-4">
              You're all set to explore projects and participate in the Orenna ecosystem.
            </p>
            <Button asChild>
              <a href="/projects" className="flex items-center gap-2">
                Explore Projects
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}