'use client'

import React from 'react'
import { Calendar, GitCommit } from 'lucide-react'
import { format } from 'date-fns'

interface LastUpdatedProps {
  date: string | Date
  hash?: string
  className?: string
}

export function LastUpdated({ date, hash, className = '' }: LastUpdatedProps) {
  const formattedDate = typeof date === 'string' ? new Date(date) : date
  const humanizedDate = format(formattedDate, 'PPP')

  return (
    <div className={`flex items-center gap-4 text-sm text-muted-foreground ${className}`}>
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        <span>Updated {humanizedDate}</span>
      </div>
      
      {hash && (
        <div className="flex items-center gap-1">
          <GitCommit className="h-4 w-4" />
          <a
            href={`https://github.com/orenna/governance/commit/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors font-mono"
          >
            {hash.slice(0, 7)}
          </a>
        </div>
      )}
    </div>
  )
}