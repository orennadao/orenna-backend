'use client';

import dynamic from 'next/dynamic';
import { useCreateProject } from '@orenna/api-client';
import { ProjectForm } from '@orenna/ui';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const ProtectedRoute = dynamic(
  () => import('@/components/auth/protected-route').then(mod => ({ default: mod.ProtectedRoute })),
  { ssr: false }
);

export default function CreateProjectPage() {
  const createProjectMutation = useCreateProject();

  const handleSubmit = async (data: { name: string; description: string; budget: number; location: string }) => {
    try {
      await createProjectMutation.mutateAsync({
        name: data.name,
        description: data.description,
        budget: data.budget.toString(),
        location: data.location,
      });
      // TODO: Navigate to projects list or show success message
    } catch (error) {
      console.error('Failed to create project:', error);
      // TODO: Show error toast
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
                <p className="text-muted-foreground mt-2">
                  Set up a new project to begin tracking your environmental impact.
                </p>
              </div>
              
              <ProjectForm
                onSubmit={handleSubmit}
                isSubmitting={createProjectMutation.isPending}
              />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}