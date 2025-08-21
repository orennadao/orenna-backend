'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X,
  AlertTriangle,
  Shield,
  Users,
  Heart,
  CheckCircle,
  ArrowRight,
  Key,
  Scale
} from 'lucide-react';

interface FinalConsentModalProps {
  isOpen: boolean;
  onEnterOrenna: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function FinalConsentModal({ isOpen, onEnterOrenna, onBack, onClose }: FinalConsentModalProps) {
  const [hasConsented, setHasConsented] = useState(false);

  const handleEnterOrenna = () => {
    if (hasConsented) {
      onEnterOrenna();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[95vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Final Confirmation</h2>
              <p className="text-sm text-gray-600">Ready to join the Orenna community</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Welcome to the Future of Ecological Restoration
            </h3>
            <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
              You're about to join a global community working together to restore ecosystems through 
              transparent governance and voluntary participation.
            </p>
          </div>

          {/* Key Reminders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Risk Acknowledgment</h4>
                    <p className="text-sm text-amber-800">
                      Smart contracts, regulatory changes, and ecological outcomes involve inherent risks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Governance Process</h4>
                    <p className="text-sm text-blue-800">
                      You agree to abide by community decisions made through transparent DAO voting
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">Voluntary Participation</h4>
                    <p className="text-sm text-purple-800">
                      Your participation is entirely voluntary and you can withdraw at any time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Wallet Control</h4>
                    <p className="text-sm text-green-800">
                      You maintain full control of your wallet and private keys at all times
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final Confirmation Statement */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-3">Final Confirmation</h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                "By joining Orenna, you acknowledge the risks, agree to our governance process, 
                and confirm your participation is voluntary."
              </p>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h5 className="font-medium text-gray-900 mb-1">Wyoming DAO LLC Protection</h5>
                    <p className="text-sm text-gray-600">
                      Orenna operates as a Wyoming DAO LLC, providing legal structure and participant protections 
                      under Wyoming law while maintaining decentralized governance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="final-consent"
                checked={hasConsented}
                onCheckedChange={(checked) => setHasConsented(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="final-consent" className="text-sm text-blue-900 leading-relaxed font-medium">
                I acknowledge that I have read and understood the Terms of Service and Privacy Notice. 
                I understand the risks involved, agree to participate in DAO governance, and confirm 
                that my participation is entirely voluntary. I consent to join Orenna.
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleEnterOrenna}
              disabled={!hasConsented}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              size="lg"
            >
              <Heart className="w-4 h-4 mr-2" />
              Enter Orenna
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
            >
              Back to Privacy Notice
            </Button>
          </div>

          {/* Support Contact */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact{' '}
              <a 
                href="mailto:ben@orennadao.com" 
                className="text-blue-600 hover:text-blue-700"
              >
                ben@orennadao.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}