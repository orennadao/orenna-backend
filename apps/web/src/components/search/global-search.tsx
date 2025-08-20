'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { 
  Search,
  X,
  FolderOpen,
  Coins,
  ClipboardCheck,
  TrendingUp,
  User,
  ArrowRight,
  Clock,
  History,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'project' | 'mint-request' | 'lift-token' | 'forward' | 'user';
  title: string;
  description?: string;
  status?: string;
  url: string;
  metadata?: Record<string, any>;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'category';
  count?: number;
}

interface SearchFilter {
  types: string[];
  status: string[];
  sortBy: 'relevance' | 'date' | 'name';
  sortOrder: 'asc' | 'desc';
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// Search history and user activity management
const SEARCH_HISTORY_KEY = 'orenna-search-history';
const USER_ACTIVITY_KEY = 'orenna-user-activity';
const MAX_HISTORY_ITEMS = 10;
const MAX_ACTIVITY_ITEMS = 20;

interface UserActivity {
  id: string;
  type: 'view' | 'search' | 'action';
  entityType: 'project' | 'mint-request' | 'lift-token' | 'forward';
  entityId: string;
  entityTitle: string;
  timestamp: string;
  url: string;
}

const getSearchHistory = (): string[] => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

const addToSearchHistory = (query: string) => {
  try {
    const history = getSearchHistory();
    const updatedHistory = [query, ...history.filter(item => item !== query)].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch {
    // Ignore localStorage errors
  }
};

const getUserActivity = (): UserActivity[] => {
  try {
    const activity = localStorage.getItem(USER_ACTIVITY_KEY);
    return activity ? JSON.parse(activity) : [];
  } catch {
    return [];
  }
};

const addToUserActivity = (activity: Omit<UserActivity, 'id' | 'timestamp'>) => {
  try {
    const activities = getUserActivity();
    const newActivity: UserActivity = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // Remove duplicate activities for the same entity
    const filteredActivities = activities.filter(a => 
      !(a.entityType === activity.entityType && a.entityId === activity.entityId)
    );
    
    const updatedActivities = [newActivity, ...filteredActivities].slice(0, MAX_ACTIVITY_ITEMS);
    localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(updatedActivities));
  } catch {
    // Ignore localStorage errors
  }
};

// Popular search terms (in a real app, this would come from analytics)
const POPULAR_SEARCHES = [
  'restoration',
  'carbon',
  'forest',
  'watershed',
  'conservation',
  'biodiversity',
  'soil',
  'habitat'
];

// Search suggestions generator
const generateSuggestions = (query: string, searchHistory: string[], userActivity: UserActivity[]): SearchSuggestion[] => {
  const suggestions: SearchSuggestion[] = [];
  
  if (query.trim() === '') {
    // Show recent searches when no query
    searchHistory.slice(0, 3).forEach((term, index) => {
      suggestions.push({
        id: `recent-search-${index}`,
        text: term,
        type: 'recent'
      });
    });
    
    // Add recent activity items (recently viewed entities)
    userActivity
      .filter(activity => activity.type === 'view')
      .slice(0, 3)
      .forEach((activity, index) => {
        suggestions.push({
          id: `recent-activity-${index}`,
          text: activity.entityTitle,
          type: 'recent'
        });
      });
    
    // Add popular searches
    POPULAR_SEARCHES.slice(0, 3).forEach((term, index) => {
      if (!searchHistory.includes(term)) {
        suggestions.push({
          id: `popular-${index}`,
          text: term,
          type: 'popular',
          count: Math.floor(Math.random() * 100) + 50 // Mock popularity count
        });
      }
    });
  } else {
    // Filter suggestions based on query
    const lowerQuery = query.toLowerCase();
    
    // Recent searches that match
    searchHistory
      .filter(term => term.toLowerCase().includes(lowerQuery))
      .slice(0, 2)
      .forEach((term, index) => {
        suggestions.push({
          id: `recent-search-match-${index}`,
          text: term,
          type: 'recent'
        });
      });
    
    // Recent activity items that match
    userActivity
      .filter(activity => 
        activity.entityTitle.toLowerCase().includes(lowerQuery) &&
        !searchHistory.includes(activity.entityTitle)
      )
      .slice(0, 2)
      .forEach((activity, index) => {
        suggestions.push({
          id: `recent-activity-match-${index}`,
          text: activity.entityTitle,
          type: 'recent'
        });
      });
    
    // Popular searches that match
    POPULAR_SEARCHES
      .filter(term => term.toLowerCase().includes(lowerQuery) && !searchHistory.includes(term))
      .slice(0, 2)
      .forEach((term, index) => {
        suggestions.push({
          id: `popular-match-${index}`,
          text: term,
          type: 'popular',
          count: Math.floor(Math.random() * 100) + 50
        });
      });
    
    // Category suggestions
    const categories = ['project', 'restoration', 'carbon sequestration', 'forest conservation'];
    categories
      .filter(cat => cat.toLowerCase().includes(lowerQuery))
      .slice(0, 2)
      .forEach((cat, index) => {
        suggestions.push({
          id: `category-${index}`,
          text: cat,
          type: 'category'
        });
      });
  }
  
  return suggestions.slice(0, 8);
};

// Search implementation that queries multiple API endpoints
const searchItems = async (query: string, filter?: SearchFilter): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  try {
    // Import the API client
    const { apiClient } = await import('@/lib/api');
    
    // Search across multiple endpoints in parallel
    const [
      projectsResponse,
      mintRequestsResponse,
      liftTokensResponse
    ] = await Promise.allSettled([
      apiClient.getProjects().then(response => response?.data?.data || []),
      apiClient.getMintRequests({ limit: 20 }).then(response => response?.mintRequests || []),
      apiClient.getLiftTokens({ limit: 20 }).then(response => response?.liftTokens || [])
    ]);

    const results: SearchResult[] = [];

    // Process projects
    if (projectsResponse.status === 'fulfilled' && (!filter || filter.types.includes('project'))) {
      const projects = projectsResponse.value.filter((project: any) => {
        const matchesQuery = project.name?.toLowerCase().includes(query.toLowerCase()) ||
          project.description?.toLowerCase().includes(query.toLowerCase()) ||
          project.slug?.toLowerCase().includes(query.toLowerCase());
        
        const matchesStatus = !filter || filter.status.length === 0 || 
          filter.status.includes(project.status || 'Active');
        
        return matchesQuery && matchesStatus;
      });

      projects.forEach((project: any) => {
        results.push({
          id: project.id.toString(),
          type: 'project',
          title: project.name || 'Unnamed Project',
          description: project.description,
          status: project.status || 'Active',
          url: `/projects/${project.id}`,
          metadata: {
            slug: project.slug,
            createdAt: project.createdAt
          }
        });
      });
    }

    // Process mint requests
    if (mintRequestsResponse.status === 'fulfilled' && (!filter || filter.types.includes('mint-request'))) {
      const mintRequests = mintRequestsResponse.value.filter((request: any) => {
        const matchesQuery = request.title?.toLowerCase().includes(query.toLowerCase()) ||
          request.description?.toLowerCase().includes(query.toLowerCase());
        
        const matchesStatus = !filter || filter.status.length === 0 || 
          filter.status.includes(request.status);
        
        return matchesQuery && matchesStatus;
      });

      mintRequests.forEach((request: any) => {
        results.push({
          id: request.id,
          type: 'mint-request',
          title: request.title || 'Untitled Request',
          description: request.description,
          status: request.status,
          url: `/mint-requests`,
          metadata: {
            amount: request.amount,
            projectName: request.project?.name,
            submittedAt: request.createdAt
          }
        });
      });
    }

    // Process lift tokens
    if (liftTokensResponse.status === 'fulfilled' && (!filter || filter.types.includes('lift-token'))) {
      const liftTokens = liftTokensResponse.value.filter((token: any) => {
        const matchesQuery = token.tokenId?.toLowerCase().includes(query.toLowerCase()) ||
          token.project?.name?.toLowerCase().includes(query.toLowerCase());
        
        const matchesStatus = !filter || filter.status.length === 0 || 
          filter.status.includes(token.status);
        
        return matchesQuery && matchesStatus;
      });

      liftTokens.forEach((token: any) => {
        results.push({
          id: token.id.toString(),
          type: 'lift-token',
          title: `Lift Token #${token.tokenId || token.id}`,
          description: `Lift token for ${token.project?.name || 'Unknown Project'}`,
          status: token.status,
          url: `/lift-tokens`,
          metadata: {
            quantity: token.quantity,
            unit: token.unit,
            projectName: token.project?.name
          }
        });
      });
    }

    // Apply sorting
    if (filter?.sortBy) {
      results.sort((a, b) => {
        let comparison = 0;
        
        switch (filter.sortBy) {
          case 'name':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'date':
            const aDate = new Date(a.metadata?.createdAt || a.metadata?.submittedAt || 0);
            const bDate = new Date(b.metadata?.createdAt || b.metadata?.submittedAt || 0);
            comparison = aDate.getTime() - bDate.getTime();
            break;
          case 'relevance':
          default:
            // Sort by relevance (title matches first, then description matches)
            const lowerQuery = query.toLowerCase();
            const aTitle = a.title.toLowerCase().includes(lowerQuery);
            const bTitle = b.title.toLowerCase().includes(lowerQuery);
            
            if (aTitle && !bTitle) comparison = -1;
            else if (!aTitle && bTitle) comparison = 1;
            else comparison = 0;
            break;
        }
        
        return filter.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return results.slice(0, 20); // Increased limit for better user experience

  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};

// Export activity tracking functions for use by other components
export { addToUserActivity, getUserActivity };
export type { UserActivity };

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>({
    types: ['project', 'mint-request', 'lift-token'],
    status: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  // Load search history and user activity on mount
  useEffect(() => {
    if (isOpen) {
      setSearchHistory(getSearchHistory());
      setUserActivity(getUserActivity());
    }
  }, [isOpen]);

  // Update suggestions when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(query, searchHistory, userActivity);
    setSuggestions(newSuggestions);
    setSelectedIndex(0);
  }, [query, searchHistory, userActivity]);

  // Debounced search for actual results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowSuggestions(true);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setShowSuggestions(false);
      try {
        const searchResults = await searchItems(query, filter);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Increased debounce time for better UX

    return () => clearTimeout(timeoutId);
  }, [query, filter]);

  // Handle suggestion/result selection
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery.trim());
      setSearchHistory(getSearchHistory());
      setQuery(searchQuery);
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentItems = showSuggestions ? suggestions : results;
      const maxIndex = currentItems.length - 1;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (showSuggestions && suggestions[selectedIndex]) {
            handleSearch(suggestions[selectedIndex].text);
          } else if (!showSuggestions && results[selectedIndex]) {
            const result = results[selectedIndex];
            addToSearchHistory(query);
            addToUserActivity({
              type: 'view',
              entityType: result.type as any,
              entityId: result.id,
              entityTitle: result.title,
              url: result.url
            });
            window.location.href = result.url;
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (showSuggestions && suggestions[selectedIndex]) {
            setQuery(suggestions[selectedIndex].text);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, suggestions, selectedIndex, showSuggestions, query, onClose]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSuggestions([]);
      setSelectedIndex(0);
      setShowSuggestions(true);
    }
  }, [isOpen]);

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent': return <History className="h-4 w-4 text-gray-400" />;
      case 'popular': return <TrendingUp className="h-4 w-4 text-gray-400" />;
      case 'category': return <Search className="h-4 w-4 text-gray-400" />;
      default: return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'project': return <FolderOpen className="h-4 w-4 text-blue-600" />;
      case 'mint-request': return <ClipboardCheck className="h-4 w-4 text-orange-600" />;
      case 'lift-token': return <Coins className="h-4 w-4 text-green-600" />;
      case 'forward': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'user': return <User className="h-4 w-4 text-gray-600" />;
      default: return <Search className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'project': return 'Project';
      case 'mint-request': return 'Mint Request';
      case 'lift-token': return 'Lift Token';
      case 'forward': return 'Forward';
      case 'user': return 'User';
      default: return 'Result';
    }
  };

  const getStatusColor = (type: SearchResult['type'], status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (type) {
      case 'mint-request':
        switch (status) {
          case 'PENDING': return 'bg-yellow-100 text-yellow-800';
          case 'APPROVED': return 'bg-green-100 text-green-800';
          case 'REJECTED': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      case 'lift-token':
        switch (status) {
          case 'ISSUED': return 'bg-green-100 text-green-800';
          case 'RETIRED': return 'bg-gray-100 text-gray-800';
          default: return 'bg-blue-100 text-blue-800';
        }
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-16">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, forwards, tokens, and more..."
              className="pl-10 pr-20 text-lg"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-1 rounded hover:bg-gray-100 transition-colors",
                  showFilters ? "text-blue-600 bg-blue-50" : "text-gray-400"
                )}
                title="Filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
              {/* Content Types */}
              <div>
                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2 block">
                  Content Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'project', label: 'Projects', icon: FolderOpen },
                    { value: 'mint-request', label: 'Mint Requests', icon: ClipboardCheck },
                    { value: 'lift-token', label: 'Lift Tokens', icon: Coins }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setFilter(prev => ({
                          ...prev,
                          types: prev.types.includes(value)
                            ? prev.types.filter(t => t !== value)
                            : [...prev.types, value]
                        }));
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors",
                        filter.types.includes(value)
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                      {filter.types.includes(value) && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1 block">
                    Sort By
                  </label>
                  <select
                    value={filter.sortBy}
                    onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1 block">
                    Order
                  </label>
                  <select
                    value={filter.sortOrder}
                    onChange={(e) => setFilter(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>

              {/* Reset Filters */}
              <div className="flex justify-end">
                <button
                  onClick={() => setFilter({
                    types: ['project', 'mint-request', 'lift-token'],
                    status: [],
                    sortBy: 'relevance',
                    sortOrder: 'desc'
                  })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Results and Suggestions */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-6 text-center">
              <LoadingSpinner className="mx-auto mb-2" />
              <p className="text-sm text-gray-600">Searching...</p>
            </div>
          )}

          {/* Search Suggestions */}
          {!isLoading && showSuggestions && suggestions.length > 0 && (
            <div className="py-2">
              {query.trim() === '' && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent & Popular
                </div>
              )}
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSearch(suggestion.text)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-2 flex items-center justify-between",
                    index === selectedIndex 
                      ? "bg-blue-50 border-blue-500" 
                      : "border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getSuggestionIcon(suggestion.type)}
                    <span className="text-sm text-gray-900 truncate">
                      {suggestion.text}
                    </span>
                    {suggestion.type === 'recent' && (
                      <span className="text-xs text-gray-500">Recent</span>
                    )}
                    {suggestion.type === 'popular' && suggestion.count && (
                      <span className="text-xs text-gray-500">{suggestion.count} searches</span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {!isLoading && !showSuggestions && query.trim() && results.length === 0 && (
            <div className="p-6 text-center">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">No results found for "{query}"</p>
              <p className="text-sm text-gray-500 mt-1">
                Try searching for projects, mint requests, or lift tokens
              </p>
            </div>
          )}

          {!isLoading && !showSuggestions && results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Search Results
              </div>
              {results.map((result, index) => (
                <Link
                  key={result.id}
                  href={result.url}
                  onClick={() => {
                    addToSearchHistory(query);
                    addToUserActivity({
                      type: 'view',
                      entityType: result.type as any,
                      entityId: result.id,
                      entityTitle: result.title,
                      url: result.url
                    });
                    onClose();
                  }}
                  className={cn(
                    "block px-4 py-3 hover:bg-gray-50 transition-colors border-l-2",
                    index === selectedIndex 
                      ? "bg-blue-50 border-blue-500" 
                      : "border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(result.type)}
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {getTypeLabel(result.type)}
                        </span>
                        {result.status && (
                          <Badge 
                            className={cn(
                              "text-xs px-2 py-0.5",
                              getStatusColor(result.type, result.status)
                            )}
                          >
                            {result.status}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </h3>
                      {result.description && (
                        <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                          {result.description}
                        </p>
                      )}
                      {result.metadata && (
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          {Object.entries(result.metadata).slice(0, 2).map(([key, value]) => (
                            <span key={key} className="flex items-center gap-1">
                              <span className="capitalize">{key}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/projects/create"
                  onClick={onClose}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Create Project</span>
                </Link>
                <Link 
                  href="/mint-requests/create"
                  onClick={onClose}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <ClipboardCheck className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Submit Request</span>
                </Link>
                <Link 
                  href="/marketplace/forwards"
                  onClick={onClose}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Browse Forwards</span>
                </Link>
                <Link 
                  href="/lift-tokens"
                  onClick={onClose}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Coins className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">My Tokens</span>
                </Link>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘</kbd>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">/</kbd>
                  to open • 
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑</kbd>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↓</kbd>
                  to navigate •
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Tab</kbd>
                  to autocomplete •
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                  to select
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}