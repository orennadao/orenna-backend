'use client';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@orenna/ui';
import { type VerificationMethod } from '@orenna/api-client';
import { Settings, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

interface VerificationMethodsListProps {
  methods?: VerificationMethod[];
  isLoading: boolean;
  onSelectMethod: (method: VerificationMethod) => void;
}

export function VerificationMethodsList({ 
  methods, 
  isLoading, 
  onSelectMethod 
}: VerificationMethodsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Available Verification Methods</span>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Method
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : methods && methods.length > 0 ? (
          <div className="space-y-4">
            {methods.map((method) => (
              <div
                key={method.methodId}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {method.active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <h3 className="font-medium">{method.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {method.methodologyType} • v{method.version || '1.0'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSelectMethod(method)}
                    disabled={!method.active}
                  >
                    Use Method
                  </Button>
                </div>

                {method.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {method.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Required Evidence:</p>
                    <ul className="text-muted-foreground mt-1">
                      {method.criteria.requiredEvidenceTypes.slice(0, 3).map((type) => (
                        <li key={type} className="text-xs">
                          • {type.replace(/_/g, ' ').toLowerCase()}
                        </li>
                      ))}
                      {method.criteria.requiredEvidenceTypes.length > 3 && (
                        <li className="text-xs">
                          • +{method.criteria.requiredEvidenceTypes.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Requirements:</p>
                    <div className="text-muted-foreground mt-1 space-y-1">
                      <p className="text-xs">
                        Min. Confidence: {(method.criteria.minimumConfidence * 100).toFixed(0)}%
                      </p>
                      {method.criteria.validationPeriod && (
                        <p className="text-xs">
                          Valid for: {method.criteria.validationPeriod} days
                        </p>
                      )}
                      {method.approvedValidators && method.approvedValidators.length > 0 && (
                        <p className="text-xs">
                          Approved validators: {method.approvedValidators.length}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Method Status Indicator */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      method.active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {method.active ? 'Active' : 'Inactive'}
                    </span>
                    {method.chainId && (
                      <span className="text-muted-foreground">
                        Chain ID: {method.chainId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2" />
            <p>No verification methods available</p>
            <p className="text-sm">Contact your administrator to set up verification methods</p>
            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Register New Method
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}