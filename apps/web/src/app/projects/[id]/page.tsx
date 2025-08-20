'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  DollarSign,
  FileText,
  Building,
  Droplets,
  Leaf,
  Zap,
  Activity
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description?: string;
  ownerAddress: string;
  state: string;
  tokenUri?: string;
  registryDataUri?: string;
  dataHash?: string;
  createdAt: string;
  chainId?: number;
  schemaVersion?: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        try {
          const data = await apiClient.request(`/projects/${projectId}`);
          setProject(data);
          return;
        } catch (apiError: any) {
          // For demo purposes, show a mock project if API project doesn't exist
          if (apiError.message?.includes('404') || apiError.message?.includes('Not found')) {
            const mockProjects = [
              {
                id: "1",
                name: "Amazon Rainforest Conservation",
                description: "Large-scale forest conservation project protecting 10,000 hectares of rainforest",
                ownerAddress: "0x1234567890123456789012345678901234567890",
                state: "DRAFT",
                tokenUri: "https://example.com/metadata/1.json",
                registryDataUri: "https://example.com/registry/1.json",
                dataHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                createdAt: "2024-01-15T00:00:00Z",
                chainId: 8453,
                schemaVersion: 1
              },
              {
                id: "2", 
                name: "Solar Energy Initiative",
                description: "Community solar installation providing clean energy to 500 households",
                ownerAddress: "0x2345678901234567890123456789012345678901",
                state: "BASELINED",
                tokenUri: "https://example.com/metadata/2.json",
                registryDataUri: "https://example.com/registry/2.json", 
                dataHash: "0xbcdef01234567890bcdef01234567890bcdef01234567890bcdef01234567890",
                createdAt: "2024-02-01T00:00:00Z",
                chainId: 8453,
                schemaVersion: 1
              },
              {
                id: "3",
                name: "Watershed Restoration", 
                description: "Restoring damaged watershed ecosystems and improving water quality",
                ownerAddress: "0x3456789012345678901234567890123456789012",
                state: "ACTIVE_FUNDRAISING",
                tokenUri: "https://example.com/metadata/3.json",
                registryDataUri: "https://example.com/registry/3.json",
                dataHash: "0xcdef012345678901cdef012345678901cdef012345678901cdef012345678901", 
                createdAt: "2023-12-01T00:00:00Z",
                chainId: 8453,
                schemaVersion: 1
              }
            ];
            
            const mockProject = mockProjects.find(p => p.id === projectId);
            if (mockProject) {
              setProject(mockProject);
              return;
            }
          }
          throw new Error('Project not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleBack = () => {
    router.push('/projects');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Project Not Found</h3>
              <p className="text-sm text-gray-600">
                The project you're looking for doesn't exist or you don't have access to it.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const getProjectTypeIcon = () => {
    return <Building className="h-5 w-5 text-purple-600" />;
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'BASELINED': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE_FUNDRAISING': return 'bg-green-100 text-green-800';
      case 'IMPLEMENTATION': return 'bg-orange-100 text-orange-800';
      case 'MONITORING': return 'bg-purple-100 text-purple-800';
      case 'VERIFIED_ROUND': return 'bg-emerald-100 text-emerald-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextSteps = (state: string) => {
    switch (state) {
      case 'DRAFT':
        return [
          'Complete project baseline documentation',
          'Submit for initial review',
          'Move to Baselined state'
        ];
      case 'BASELINED':
        return [
          'Set up fundraising parameters',
          'Define token economics',
          'Launch fundraising campaign'
        ];
      case 'ACTIVE_FUNDRAISING':
        return [
          'Reach funding target',
          'Begin project implementation',
          'Set up monitoring protocols'
        ];
      default:
        return ['Continue project development', 'Monitor progress', 'Maintain compliance'];
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              {getProjectTypeIcon()}
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge className={getStateColor(project.state)}>
                {project.state}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              Project ID: {project.id} • Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner for New Projects */}
      <Card className="border-green-200 bg-green-50">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Project Created Successfully!</h3>
              <p className="text-green-700 mt-1">
                Your project has been created and is now in DRAFT state. Follow the next steps below to advance your project.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Project State & Next Steps */}
      <Card className="border-blue-200 bg-blue-50">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">Project Lifecycle & Next Steps</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-blue-900">Current Status</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Project NFT metadata configured</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">On-chain registry data set up</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Project created in DRAFT state</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 text-blue-900">Next Steps</h4>
              <div className="space-y-3">
                {getNextSteps(project.state).map((step, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Project Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Description</p>
              <p className="text-gray-900 mt-1">
                {project.description || 'No description provided.'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Owner Address</p>
                <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                  {project.ownerAddress.slice(0, 6)}...{project.ownerAddress.slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Chain ID</p>
                <p className="text-sm mt-1">{project.chainId || 8453}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Blockchain Metadata</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Token URI</p>
              <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 break-all">
                {project.tokenUri || 'Not set'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600">Registry Data URI</p>
              <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 break-all">
                {project.registryDataUri || 'Not set'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600">Data Hash</p>
              <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 break-all">
                {project.dataHash || 'Not set'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Items */}
      <Card className="border-yellow-200 bg-yellow-50">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">Recommended Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-900">Documentation</h4>
              <p className="text-sm text-yellow-800">
                Complete baseline documentation and methodology details for your project.
              </p>
              <Button variant="outline" size="sm" className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                Upload Documents
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-900">Verification</h4>
              <p className="text-sm text-yellow-800">
                Set up third-party verification to enable token issuance.
              </p>
              <Button variant="outline" size="sm" className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                Start Verification
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-900">Marketplace</h4>
              <p className="text-sm text-yellow-800">
                Configure pricing and availability for carbon credit trading.
              </p>
              <Button variant="outline" size="sm" className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                Set Up Marketplace
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}