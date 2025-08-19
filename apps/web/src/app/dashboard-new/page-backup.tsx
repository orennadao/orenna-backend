'use client';

import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/app-layout';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@orenna/ui';

const ProtectedRoute = dynamic(
  () => import('@/components/auth/protected-route').then(mod => ({ default: mod.ProtectedRoute })),
  { ssr: false }
);

export default function NewDashboardPage() {
  const breadcrumbs = [
    { label: 'Dashboard' }
  ];

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm">
        Export
      </Button>
      <Button size="sm">
        Create Project
      </Button>
    </div>
  );

  return (
    <ProtectedRoute>
      <AppLayout
        breadcrumbs={breadcrumbs}
        title="Dashboard"
        description="Overview of your projects and environmental impact"
        actions={actions}
      >
        <div className="grid gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  VWBA Units
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">+1 from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,480 ha</div>
                <p className="text-xs text-muted-foreground">+340 ha from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Amazon Rainforest Conservation', status: 'Active', type: 'Forest' },
                  { name: 'Wetland Restoration Project', status: 'Pending', type: 'Wetland' },
                  { name: 'Grassland Biodiversity', status: 'Active', type: 'Grassland' },
                ].map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">{project.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        project.status === 'Active' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {project.status}
                      </span>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}