'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X,
  Shield,
  Eye,
  Cookie,
  Mail,
  Database,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Lock
} from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function PrivacyNoticeModal({ isOpen, onAccept, onBack, onClose }: PrivacyNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[95vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Privacy Notice</h2>
              <p className="text-sm text-gray-600">We collect as little as possible. Here's what that means.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Introduction */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Privacy-First Approach
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Orenna is designed with privacy in mind. We only collect what's necessary for the platform to function 
              and never sell or misuse your data.
            </p>
          </div>

          {/* What We Collect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <Database className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What We Log</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Wallet addresses (public blockchain data)</li>
                      <li>• Governance voting records (on-chain)</li>
                      <li>• Token transaction history (public)</li>
                      <li>• Platform usage analytics (anonymized)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What We Don't Do</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Sell your data to third parties</li>
                      <li>• Track you across other websites</li>
                      <li>• Store private keys or passwords</li>
                      <li>• Require personal identification</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Summary Points */}
          <div className="space-y-4 mb-8">
            <h4 className="font-semibold text-gray-900 text-center mb-6">Privacy Summary</h4>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-green-900 mb-1">Minimal Data Collection</h5>
                  <p className="text-sm text-green-800">
                    We only collect wallet activity that's already public on the blockchain and basic usage analytics to improve the platform.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">No Data Sales</h5>
                  <p className="text-sm text-blue-800">
                    We never sell, rent, or share your data with third parties for marketing purposes. Your privacy is not for sale.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <Cookie className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-purple-900 mb-1">Cookie Control</h5>
                  <p className="text-sm text-purple-800">
                    We use essential cookies only. You can control optional analytics cookies in your browser settings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <Mail className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-orange-900 mb-1">Communication Opt-out</h5>
                  <p className="text-sm text-orange-800">
                    You can opt out of any communications at any time. We respect your preferences and won't spam you.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Transparency Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-900 mb-2">Blockchain Transparency</h4>
                <p className="text-sm text-amber-800">
                  As a blockchain-based platform, your wallet address and transactions are publicly visible on the 
                  blockchain. This transparency is essential for DAO governance and ecological impact verification.
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Rights */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h4 className="font-medium text-gray-900 mb-3">Your Rights & Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h5 className="font-medium text-gray-900 mb-1">You have the right to:</h5>
                <ul className="space-y-1">
                  <li>• Request data deletion</li>
                  <li>• Access your data</li>
                  <li>• Correct inaccuracies</li>
                  <li>• Opt out of communications</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Questions or concerns?</h5>
                <p>Contact our privacy team:</p>
                <a 
                  href="mailto:ben@orennadao.com" 
                  className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  ben@orennadao.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onAccept}
              className="flex-1"
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I Understand - Continue
            </Button>
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
            >
              Back to Terms
            </Button>
          </div>

          <div className="mt-4 text-center">
            <a 
              href="/privacy-policy" 
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Read Full Privacy Policy
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}