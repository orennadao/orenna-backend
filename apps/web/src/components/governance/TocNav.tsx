'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Heading {
  id: string
  text: string
  level: number
}

interface TocNavProps {
  headingsSelector?: string
}

export function TocNav({ headingsSelector = 'article h2, article h3, article h4' }: TocNavProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const elements = document.querySelectorAll(headingsSelector)
    const headingsList: Heading[] = []

    elements.forEach((element) => {
      if (element.id) {
        headingsList.push({
          id: element.id,
          text: element.textContent || '',
          level: parseInt(element.tagName.charAt(1))
        })
      }
    })

    setHeadings(headingsList)
  }, [headingsSelector])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0% -80% 0%',
        threshold: 0
      }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <nav className="sticky top-24 h-fit">
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Table of Contents</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden p-1 h-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className={`space-y-1 ${isCollapsed ? 'hidden lg:block' : ''}`}>
          {headings.map((heading) => (
            <div key={heading.id}>
              <button
                onClick={() => scrollToHeading(heading.id)}
                className={`
                  w-full text-left text-sm py-1 px-2 rounded hover:bg-accent transition-colors
                  ${activeId === heading.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'}
                  ${heading.level === 3 ? 'ml-4' : ''}
                  ${heading.level === 4 ? 'ml-8' : ''}
                `}
              >
                {heading.text}
              </button>
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}