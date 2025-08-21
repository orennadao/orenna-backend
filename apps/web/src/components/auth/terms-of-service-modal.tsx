'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { TechTermTooltip } from '@/components/ui/tooltip';
import { 
  AlertTriangle,
  Shield,
  Scale,
  Info,
  CheckCircle,
  ExternalLink,
  X,
  FileText,
  Clock
} from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  showSummary?: boolean;
}

export function TermsOfServiceModal({ 
  isOpen, 
  onAccept, 
  onDecline, 
  showSummary = true 
}: TermsOfServiceModalProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasAcceptedRisks, setHasAcceptedRisks] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;
    if (isScrolledToBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
      setHasReadTerms(true);
    }
  };

  const canProceed = hasReadTerms && hasAcceptedTerms && hasAcceptedRisks;

  const handleAccept = () => {
    if (canProceed) {
      onAccept();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 max-h-[90vh] bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Terms of Service</h2>
              <p className="text-sm text-gray-600">Please review and accept to continue</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDecline}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Quick Summary Sidebar */}
          {showSummary && (
            <div className="lg:w-80 p-6 bg-blue-50 border-r border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Quick Summary</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Ecological Platform</div>
                      <div className="text-gray-600">Voluntary restoration & financing platform</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Not Investment Advice</div>
                      <div className="text-gray-600">Tokens represent participation, not securities</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Scale className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">
                        <TechTermTooltip 
                          term="DAO Governance" 
                          definition="Decentralized Autonomous Organization governance where token holders collectively make decisions through voting"
                        />
                      </div>
                      <div className="text-gray-600">Wyoming DAO LLC with token-based decisions</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Risks Involved</div>
                      <div className="text-gray-600">Smart contracts, market & regulatory risks</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-200">
                  <div className="text-xs text-blue-800 mb-2">Key Points:</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• You must be 18+ years old</li>
                    <li>• Secure your own wallet/keys</li>
                    <li>• Accept governance decisions</li>
                    <li>• No guaranteed returns</li>
                    <li>• Use at your own risk</li>
                  </ul>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowFullTerms(!showFullTerms)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {showFullTerms ? 'Hide' : 'Show'} Full Terms
                </Button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 p-6">
            {!showFullTerms ? (
              /* Condensed View */
              <div className="space-y-6">
                <div className="text-center">
                  <Badge variant="outline" className="mb-4">
                    <Clock className="w-3 h-3 mr-1" />
                    Last Updated: January 2024
                  </Badge>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome to Orenna DAO
                  </h3>
                  <p className="text-gray-600">
                    By connecting your wallet and participating, you agree to our terms and acknowledge the associated risks.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Platform Purpose</h4>
                        <p className="text-sm text-gray-600">
                          Voluntary ecological restoration and financing through DAO governance
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Token Nature</h4>
                        <p className="text-sm text-gray-600">
                          Governance participation, not securities or investment contracts
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <Scale className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Governance</h4>
                        <p className="text-sm text-gray-600">
                          Wyoming DAO LLC with binding token-holder decisions
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Risk Acknowledgment</h4>
                        <p className="text-sm text-gray-600">
                          Smart contract, market, regulatory, and ecological risks
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-900 mb-2">Important Disclaimers</h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• Services provided "as is" with no warranties</li>
                        <li>• You're responsible for wallet security and private keys</li>
                        <li>• Ecological outcomes are not guaranteed</li>
                        <li>• Governed by Wyoming law with binding arbitration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Terms View */
              <div 
                className="h-96 overflow-y-auto pr-4"
                onScroll={handleScroll}
              >
                <div className="prose prose-sm max-w-none">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Orenna DAO – Terms of Service</h1>
                    <Badge variant="outline">Last Updated: January 2024</Badge>
                  </div>

                  <p className="text-gray-700 mb-6">
                    Welcome to <strong>Orenna DAO</strong> ("Orenna," "we," "our," "us").
                    By accessing or using our platform (the "Services"), including connecting a wallet, purchasing or holding Orenna tokens, or otherwise participating in the Orenna ecosystem, you ("you," "user," or "participant") agree to be bound by these Terms of Service (the "Terms").
                  </p>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
                  <p className="text-gray-700 mb-4">
                    By connecting a wallet, purchasing, holding, or using Orenna tokens, or participating in Orenna DAO governance, you agree to be bound by these Terms, our Privacy Policy, and any rules adopted by Orenna DAO. If you do not agree, you may not use the Services.
                  </p>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Eligibility</h2>
                  <ul className="text-gray-700 mb-4 space-y-1">
                    <li>• You must be at least 18 years old (or the age of majority in your jurisdiction).</li>
                    <li>• You may not use the Services if you are a resident of, or located in, a jurisdiction where participation in decentralized autonomous organizations, token-based ecosystems, or similar activities is restricted or illegal.</li>
                    <li>• By using the Services, you represent and warrant that you meet these eligibility requirements.</li>
                  </ul>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Nature of Participation</h2>
                  <ul className="text-gray-700 mb-4 space-y-1">
                    <li>• Orenna is a <strong>voluntary ecological restoration and financing platform</strong>.</li>
                    <li>• Orenna tokens (including governance tokens and Lift Tokens) represent participation in governance or ecological lift outcomes.</li>
                    <li>• Tokens are <strong>not securities, investment contracts, or guarantees of financial return</strong>.</li>
                    <li>• Nothing in the Services constitutes financial, legal, or investment advice.</li>
                  </ul>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. User Responsibilities</h2>
                  <p className="text-gray-700 mb-2">You agree to:</p>
                  <ul className="text-gray-700 mb-4 space-y-1">
                    <li>• Use the Services only for lawful purposes and in compliance with these Terms.</li>
                    <li>• Maintain control and security of your wallet and private keys. Orenna cannot recover lost private keys.</li>
                    <li>• Provide accurate information when required (e.g., for compliance or verification).</li>
                    <li>• Respect DAO governance outcomes, including majority decisions.</li>
                  </ul>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. DAO Governance</h2>
                  <ul className="text-gray-700 mb-4 space-y-1">
                    <li>• Orenna operates as a <strong>Wyoming DAO LLC</strong> with decision-making distributed among token holders.</li>
                    <li>• Proposals and votes may affect your participation, rights, and responsibilities.</li>
                    <li>• By using the Services, you accept that governance decisions are binding and may result in changes to platform rules, token mechanics, or other features.</li>
                  </ul>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6. Risks</h2>
                  <p className="text-gray-700 mb-2">Participation involves significant risks, including but not limited to:</p>
                  <ul className="text-gray-700 mb-4 space-y-1">
                    <li>• <strong>Smart Contract Risks:</strong> vulnerabilities, bugs, or exploits may result in loss of tokens or funds.</li>
                    <li>• <strong>Market Risks:</strong> token values may fluctuate or become illiquid.</li>
                    <li>• <strong>Regulatory Risks:</strong> laws may change, potentially restricting participation or requiring compliance actions.</li>
                    <li>• <strong>Ecological Risks:</strong> restoration outcomes may vary and are not guaranteed.</li>
                  </ul>
                  <p className="text-gray-700 mb-4">By accepting these Terms, you acknowledge and assume all such risks.</p>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7. No Warranties</h2>
                  <p className="text-gray-700 mb-4">
                    The Services are provided <strong>"as is"</strong> and <strong>"as available."</strong>
                    Orenna makes no warranties of any kind, whether express or implied, regarding the Services, tokens, or outcomes.
                  </p>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8. Limitation of Liability</h2>
                  <p className="text-gray-700 mb-2">To the maximum extent permitted by law:</p>
                  <ul className="text-gray-700 mb-4 space-y-1">
                    <li>• Orenna, its DAO LLC members, contributors, partners, or affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of funds, profits, data, or ecological outcomes.</li>
                    <li>• Your sole and exclusive remedy for dissatisfaction with the Services is to discontinue use.</li>
                  </ul>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">9. Termination</h2>
                  <p className="text-gray-700 mb-4">
                    Orenna may restrict or terminate your access to the Services if you violate these Terms or applicable laws. You may cease participation at any time by discontinuing use of the Services and disposing of your tokens.
                  </p>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">10. Governing Law & Disputes</h2>
                  <ul className="text-gray-700 mb-4 space-y-1">
                    <li>• These Terms are governed by the laws of the State of Wyoming, U.S.A., without regard to conflicts of law principles.</li>
                    <li>• Any dispute shall be resolved through binding arbitration in Wyoming, unless otherwise required by law.</li>
                  </ul>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">11. Changes to Terms</h2>
                  <p className="text-gray-700 mb-4">
                    Orenna may update these Terms from time to time. Updated Terms will be posted, and your continued use of the Services constitutes acceptance of the revised Terms.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Acknowledgment</h3>
                    <p className="text-blue-800 text-sm">
                      By clicking "I Agree" you acknowledge that you understand the nature of participation in Orenna DAO, accept the risks outlined above, and agree to be bound by these Terms of Service.
                    </p>
                  </div>

                  {!scrolledToBottom && (
                    <div className="text-center mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Please scroll to the bottom to continue
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Acceptance Checkboxes */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="read-terms"
                  checked={hasReadTerms}
                  onCheckedChange={(checked) => setHasReadTerms(checked as boolean)}
                  disabled={showFullTerms && !scrolledToBottom}
                />
                <label htmlFor="read-terms" className="text-sm text-gray-700 leading-5">
                  I have read and understand the Terms of Service
                  {showFullTerms && !scrolledToBottom && (
                    <span className="text-yellow-600 ml-1">(scroll to bottom to enable)</span>
                  )}
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="accept-terms"
                  checked={hasAcceptedTerms}
                  onCheckedChange={(checked) => setHasAcceptedTerms(checked as boolean)}
                  disabled={!hasReadTerms}
                />
                <label htmlFor="accept-terms" className="text-sm text-gray-700 leading-5">
                  I agree to be bound by the Terms of Service and accept that Orenna tokens represent governance participation, not securities or investment contracts
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="accept-risks"
                  checked={hasAcceptedRisks}
                  onCheckedChange={(checked) => setHasAcceptedRisks(checked as boolean)}
                  disabled={!hasReadTerms}
                />
                <label htmlFor="accept-risks" className="text-sm text-gray-700 leading-5">
                  I acknowledge and assume all risks including smart contract, market, regulatory, and ecological risks, and understand that services are provided "as is" with no warranties
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button 
                onClick={handleAccept}
                disabled={!canProceed}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I Agree - Continue to Orenna
              </Button>
              <Button 
                variant="outline" 
                onClick={onDecline}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            <div className="mt-4 text-center">
              <a 
                href="/privacy-policy" 
                target="_blank"
                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                View Privacy Policy
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}