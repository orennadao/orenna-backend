'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, BookOpen, Users, Leaf, Globe } from 'lucide-react';

export function HelpHero() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const popularTopics = [
    { label: 'Getting Started', icon: BookOpen, href: '#getting-started' },
    { label: 'Lift Tokens', icon: Leaf, href: '#concepts' },
    { label: 'Governance', icon: Users, href: '#governance' },
    { label: 'Project Funding', icon: Globe, href: '#participation' },
  ];

  return (
    <div className="text-center mb-12">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          📘 Orenna Help Center
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Learn how to participate in ecological restoration through blockchain technology. 
          Find guides, tutorials, and answers to common questions.
        </p>
      </div>

      {/* Search Bar */}
      <Card className="max-w-2xl mx-auto p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">
            Search
          </Button>
        </form>
      </Card>

      {/* Popular Topics */}
      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-medium text-gray-700 mb-4">Popular Topics:</p>
        <div className="flex flex-wrap justify-center gap-3">
          {popularTopics.map((topic) => (
            <a
              key={topic.label}
              href={topic.href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <topic.icon className="h-4 w-4" />
              {topic.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}