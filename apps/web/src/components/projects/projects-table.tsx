'use client';

import { useProjects } from '@orenna/api-client';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@orenna/ui';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Project } from '@orenna/api-client';

interface ProjectsTableProps {
  onCreateProject?: () => void;
}

export function ProjectsTable({ onCreateProject }: ProjectsTableProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useProjects({ page, limit: 10 });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error loading projects</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Manage your regenerative finance projects
            </CardDescription>
          </div>
          {onCreateProject && (
            <Button onClick={onCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!data?.data?.length ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold">No projects found</h3>
            <p className="text-sm text-muted-foreground">
              Create your first project to get started
            </p>
            {onCreateProject && (
              <Button onClick={onCreateProject} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {data.data.map((project: Project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-semibold">{project.name}</h4>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        project.status === 'active'
                          ? 'bg-success'
                          : project.status === 'pending'
                          ? 'bg-warning'
                          : 'bg-muted'
                      }`}
                    />
                    <span className="text-xs text-muted-foreground capitalize">
                      {project.status}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
            
            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}