'use client';

import { useTermsAcceptance } from '@/hooks/use-terms-acceptance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Scale, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  AlertTriangle 
} from 'lucide-react';

export function TermsStatus() {
  const { 
    hasAccepted, 
    version, 
    currentVersion, 
    needsAcceptance, 
    isLoading,
    getAcceptanceDate 
  } = useTermsAcceptance();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
              <Scale className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const acceptanceDate = getAcceptanceDate();
  const isCurrentVersion = version === currentVersion;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="w-4 h-4 text-purple-600" />
          Terms of Service
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            {hasAccepted && isCurrentVersion ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Accepted
              </Badge>
            ) : needsAcceptance ? (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Required
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Clock className="w-3 h-3 mr-1" />
                Update Needed
              </Badge>
            )}
          </div>

          {version && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Version</span>
              <span className="text-sm font-mono text-gray-900">
                {version}
                {!isCurrentVersion && (
                  <span className="text-orange-600 ml-1">(outdated)</span>
                )}
              </span>
            </div>
          )}

          {acceptanceDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Accepted</span>
              <span className="text-sm text-gray-900">
                {acceptanceDate.toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                asChild
              >
                <a href="/terms-of-service" target="_blank" className="flex items-center gap-1">
                  View Current Terms
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
              
              {needsAcceptance && (
                <p className="text-xs text-orange-600 text-center">
                  You must accept the current terms to continue using the platform
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}