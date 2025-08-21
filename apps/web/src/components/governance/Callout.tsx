'use client'

import React from 'react'
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CalloutProps {
  type: 'info' | 'warning' | 'success' | 'error'
  children: React.ReactNode
  title?: string
}

const calloutConfig = {
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-900',
    iconClassName: 'text-blue-600'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-orange-200 bg-orange-50 text-orange-900',
    iconClassName: 'text-orange-600'
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-900',
    iconClassName: 'text-green-600'
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-900',
    iconClassName: 'text-red-600'
  }
}

export function Callout({ type, children, title }: CalloutProps) {
  const config = calloutConfig[type]
  const Icon = config.icon

  return (
    <Alert className={config.className}>
      <Icon className={`h-4 w-4 ${config.iconClassName}`} />
      <AlertDescription className="flex flex-col gap-2">
        {title && <div className="font-medium">{title}</div>}
        <div>{children}</div>
      </AlertDescription>
    </Alert>
  )
}