'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RiskItem {
  title: string
  risk: string
  safeguards: string[]
}

interface RiskAccordionProps {
  items: RiskItem[]
}

export function RiskAccordion({ items }: RiskAccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <Button
            variant="ghost"
            onClick={() => toggleItem(index)}
            className="w-full justify-between p-4 h-auto text-left font-normal hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <span className="font-medium">{item.title}</span>
            </div>
            {expandedItems.has(index) ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
          </Button>
          
          {expandedItems.has(index) && (
            <CardContent className="pt-0 px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risk Description
                  </h4>
                  <p className="text-sm text-muted-foreground">{item.risk}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-green-700 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Safeguards
                  </h4>
                  <ul className="space-y-1">
                    {item.safeguards.map((safeguard, safeguardIndex) => (
                      <li key={safeguardIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{safeguard}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}