'use client'

import React, { useState } from 'react'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IPFSDocLinkProps {
  hash: string
  label?: string
  gateway?: string
  className?: string
}

export function IPFSDocLink({ 
  hash, 
  label = 'IPFS Document', 
  gateway = 'https://ipfs.io/ipfs',
  className = ''
}: IPFSDocLinkProps) {
  const [copied, setCopied] = useState(false)
  
  const shortHash = hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-6)}` : hash
  const fullUrl = `${gateway}/${hash}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy hash:', err)
    }
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-muted-foreground">{label}:</span>
      
      <div className="flex items-center gap-1">
        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
          {shortHash}
        </code>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-6 w-6 p-0"
          title="Copy full hash"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-6 w-6 p-0"
          title="View on IPFS"
        >
          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  )
}