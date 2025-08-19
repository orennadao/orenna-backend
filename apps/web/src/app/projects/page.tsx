'use client'

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProjectDashboard } from "@/components/projects/project-dashboard";
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const router = useRouter();

  const handleCreateProject = () => {
    router.push('/projects/create');
  };

  const handleViewProject = (projectId: number) => {
    router.push(`/projects/${projectId}`);
  };

  const handleEditProject = (projectId: number) => {
    router.push(`/projects/${projectId}/edit`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <ProjectDashboard 
                onCreateProject={handleCreateProject}
                onViewProject={handleViewProject}
                onEditProject={handleEditProject}
              />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}