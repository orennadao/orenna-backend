'use client'

import { useProjects } from '@/hooks/use-projects'

export function ProjectList() {
  const { projects, isLoading, error, refetch } = useProjects()

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading projects: {error}</p>
        <button
          onClick={refetch}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <a
          href="/projects/create"
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Create Project
        </a>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No projects found.</p>
          <a
            href="/projects/create"
            className="mt-4 inline-block text-primary-600 hover:text-primary-800"
          >
            Create your first project
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.name}
                </h3>
                <span className="text-xs text-gray-500">
                  ID: {project.id}
                </span>
              </div>

              {project.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Slug:</span>
                  <span className="text-gray-900 font-mono">{project.slug}</span>
                </div>
                
                {project.chainId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Chain:</span>
                    <span className="text-gray-900">{project.chainId}</span>
                  </div>
                )}

                {project.contractAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Contract:</span>
                    <span className="text-gray-900 font-mono">
                      {project.contractAddress.slice(0, 6)}...{project.contractAddress.slice(-4)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Payment Config Status */}
              <div className="mb-4">
                {project.paymentConfig?.acceptsPayments ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Accepts Payments
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    No Payment Config
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <a
                  href={`/projects/${project.id}`}
                  className="flex-1 text-center bg-primary-100 text-primary-700 px-3 py-2 rounded-md text-sm hover:bg-primary-200"
                >
                  View Details
                </a>
                <a
                  href={`/projects/${project.id}/payments`}
                  className="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
                >
                  Payments
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}