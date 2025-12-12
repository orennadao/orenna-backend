'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects } from '@/hooks/use-projects';
import type { Project } from '@/types/api';
import { 
  Plus,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  MoreHorizontal,
  Search,
  Calendar,
  MapPin,
  Droplets,
  Leaf,
  Zap
} from 'lucide-react';

interface ProjectDashboardProps {
  onCreateProject?: () => void;
  onViewProject?: (projectId: number) => void;
  onEditProject?: (projectId: number) => void;
}

export function ProjectDashboard({
  onCreateProject,
  onViewProject,
  onEditProject
}: ProjectDashboardProps) {
  const { projects, isLoading, error, refetch } = useProjects();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Ensure hydration safety by only formatting dates on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  type ExtendedProject = Project & {
    status?: string;
    state?: string;
    location?: string;
    type?: string;
    progress?: number;
    metadata?: Record<string, any>;
  };

  const getDashboardStatus = (project: ExtendedProject) => {
    const rawStatus = (project.status || project.state || '').toString().toLowerCase();

    if (['draft', 'baselined', 'pending'].includes(rawStatus)) return 'pending';
    if ([
      'active',
      'active_fundraising',
      'implementation',
      'monitoring',
      'in_progress'
    ].includes(rawStatus)) return 'active';
    if (['completed', 'verified_round', 'archived'].includes(rawStatus)) return 'completed';

    return 'active';
  };

  // Calculate dashboard metrics
  const metrics = projects.reduce(
    (acc, project) => {
      const status = getDashboardStatus(project as ExtendedProject);
      acc.total += 1;
      if (status === 'active') acc.active += 1;
      if (status === 'pending') acc.pending += 1;
      if (status === 'completed') acc.completed += 1;
      return acc;
    },
    { total: 0, active: 0, pending: 0, completed: 0 }
  );

  const getProjectTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'water': case 'conservation': case 'restoration':
        return <Droplets className="h-4 w-4" />;
      case 'carbon': case 'forest': case 'reforestation':
        return <Leaf className="h-4 w-4" />;
      case 'energy': case 'renewable':
        return <Zap className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProjects = projects.filter((project) => {
    const status = getDashboardStatus(project as ExtendedProject);
    const matchesFilter = filter === 'all' || status === filter;
    const matchesSearch = !searchTerm ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesFilter && matchesSearch;
  }) as ExtendedProject[];

  return (
    <div className="space-y-6">
      {/* Remove header since it's now handled by MainLayout */}

      {isLoading && (
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-6 bg-red-50 border-red-200 text-red-800">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Unable to load projects</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button variant="outline" onClick={refetch}>Retry</Button>
          </div>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Total Projects</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
          <p className="text-xs text-gray-600">All project types</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{metrics.active}</div>
          <p className="text-xs text-gray-600">Currently running</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{metrics.pending}</div>
          <p className="text-xs text-gray-600">Awaiting approval</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Completed</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{metrics.completed}</div>
          <p className="text-xs text-gray-600">Successfully finished</p>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Completed
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-8 pr-4 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            >
              {view === 'grid' ? 'List' : 'Grid'} View
            </Button>
          </div>
        </div>
      </Card>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No projects found</h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first project to get started'
              }
            </p>
            {onCreateProject && !searchTerm && filter === 'all' && (
              <Button onClick={onCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-2 mb-2">
                      {getProjectTypeIcon(project.type || project.metadata?.type)}
                      <h3 className="text-base font-semibold text-gray-900 truncate">{project.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(getDashboardStatus(project))}>
                        {project.status || project.state || getDashboardStatus(project)}
                      </Badge>
                      {(project.type || project.metadata?.type) && (
                        <Badge variant="outline" className="text-xs">
                          {project.type || project.metadata?.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {(project.location || project.metadata?.location) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      {project.location || project.metadata?.location}
                    </div>
                  )}

                  {project.createdAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      Created {isClient ? new Date(project.createdAt).toLocaleDateString() : 'Loading...'}
                    </div>
                  )}

                  {/* Progress indicator */}
                  {project.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {onViewProject && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewProject(project.id)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    {onEditProject && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEditProject(project.id)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <div className="divide-y">
            {filteredProjects.map((project) => (
              <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {getProjectTypeIcon(project.type || project.metadata?.type)}
                      <div className={`w-3 h-3 rounded-full ${
                        getDashboardStatus(project) === 'active' ? 'bg-green-500' :
                        getDashboardStatus(project) === 'pending' ? 'bg-yellow-500' :
                        getDashboardStatus(project) === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold truncate">{project.name}</h4>
                        <Badge className={getStatusColor(getDashboardStatus(project))}>
                          {project.status || project.state || getDashboardStatus(project)}
                        </Badge>
                        {(project.type || project.metadata?.type) && (
                          <Badge variant="outline" className="text-xs">
                            {project.type || project.metadata?.type}
                          </Badge>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 truncate">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                        {(project.location || project.metadata?.location) && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {project.location || project.metadata?.location}
                          </div>
                        )}
                        {project.createdAt && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {isClient ? new Date(project.createdAt).toLocaleDateString() : 'Loading...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {project.progress !== undefined && (
                      <div className="w-20">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{project.progress}%</span>
                      </div>
                    )}
                    
                    {onViewProject && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewProject(project.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    {onEditProject && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEditProject(project.id)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}