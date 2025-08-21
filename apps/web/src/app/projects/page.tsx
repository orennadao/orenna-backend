'use client'

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectDashboard } from "@/components/projects/project-dashboard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    <ProtectedRoute 
      allowGuest={true}
      guestMessage="Browse projects publicly. Connect your wallet to create projects and access advanced features."
    >
      <MainLayout
        title="Projects"
        description="Browse and manage regenerative finance projects"
        actions={
          <Button onClick={handleCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      >
        <ProjectDashboard 
          onCreateProject={handleCreateProject}
          onViewProject={handleViewProject}
          onEditProject={handleEditProject}
        />
      </MainLayout>
    </ProtectedRoute>
  );
}