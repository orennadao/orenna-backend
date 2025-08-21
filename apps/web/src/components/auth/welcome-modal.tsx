'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TechTermTooltip } from '@/components/ui/tooltip';
import { 
  X,
  Leaf,
  Users,
  Shield,
  ChevronRight,
  Globe,
  Heart,
  ArrowRight
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onNext: () => void;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onNext, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[95vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600 to-blue-600 p-8 text-white">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Orenna</h1>
            <p className="text-xl text-green-100">
              A community restoring ecosystems together
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 leading-relaxed">
              Join a decentralized community dedicated to ecological restoration through 
              transparent governance, voluntary participation, and innovative financing.
            </p>
          </div>

          {/* Key Principles */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Our Core Principles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 hover:border-green-300 transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Transparency</h4>
                  <p className="text-sm text-gray-600">
                    All governance decisions and ecological outcomes are publicly verifiable
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Voluntary Restoration</h4>
                  <p className="text-sm text-gray-600">
                    Participate in meaningful ecological restoration at your own pace
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 hover:border-purple-300 transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    <TechTermTooltip 
                      term="DAO Governance" 
                      definition="Decentralized Autonomous Organization - A democratic system where token holders vote on important decisions without centralized control"
                    />
                  </h4>
                  <p className="text-sm text-gray-600">
                    Community-driven decisions through democratic token-based voting
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* What to Expect */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">What to Expect</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                Connect your Web3 wallet to participate in governance
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                Review our Terms of Service and understand the risks
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                Join a community working toward real ecological impact
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                Participate in transparent, democratic decision-making
              </li>
            </ul>
          </div>

          {/* Wyoming DAO Trust Element */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Organized as{' '}
                  <TechTermTooltip 
                    term="Wyoming DAO LLC" 
                    definition="A legal entity structure recognized by Wyoming state law that provides legal protection for DAO participants while maintaining decentralized governance"
                  />
                </h4>
                <p className="text-sm text-blue-800">
                  Legally structured for transparency and participant protection under Wyoming law.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <Button 
              onClick={onNext}
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <p className="text-xs text-gray-500 mt-4">
              Questions? Contact us at{' '}
              <a href="mailto:ben@orennadao.com" className="text-blue-600 hover:text-blue-700">
                ben@orennadao.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}