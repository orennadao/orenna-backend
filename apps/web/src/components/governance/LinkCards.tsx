'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, Shield, BookOpen, Vote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const links = [
  {
    href: '/terms-of-service',
    icon: FileText,
    title: 'Terms of Service',
    description: 'Platform terms and conditions'
  },
  {
    href: '/privacy-notice',
    icon: Shield,
    title: 'Privacy Notice',
    description: 'Data handling and privacy policy'
  },
  {
    href: '/onboarding',
    icon: BookOpen,
    title: 'Onboarding Package',
    description: 'Get started with Orenna'
  },
  {
    href: '/governance',
    icon: Vote,
    title: 'Governance Portal',
    description: 'Active proposals and voting'
  }
]

export function LinkCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {links.map((link) => {
        const Icon = link.icon
        
        return (
          <Card key={link.href} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Button asChild variant="ghost" className="w-full h-auto p-0 flex flex-col items-center gap-2">
                <Link href={link.href}>
                  <Icon className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{link.title}</div>
                    <div className="text-xs text-muted-foreground">{link.description}</div>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}