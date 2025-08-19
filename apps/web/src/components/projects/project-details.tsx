'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@orenna/ui';
import { useProjectAnalytics, usePaymentAnalytics, useLiftTokenAnalytics } from '@/hooks/use-analytics';
import { useProjectMetrics, useProjectVerification, useUpdateProjectState } from '@orenna/api-client';
import { useWebSocket } from '@/hooks/use-websocket';
import { 
  ArrowLeft,
  Edit,
  Share2,
  Download,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Droplets,
  Leaf,
  Zap,
  Building,
  FileText,
  TrendingUp,
  Activity,
  Shield,
  ShoppingCart,
  Coins,
  TrendingDown
} from 'lucide-react';
import type { Project } from '@orenna/api-client';

interface ProjectDetailsProps {
  project: Project;
  onBack?: () => void;
  onEdit?: () => void;
}

export function ProjectDetails({ project, onBack, onEdit }: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);
  
  // Fetch analytics data for the project
  const { data: projectAnalytics, isLoading: analyticsLoading } = useProjectAnalytics(Number(project.id));
  const { data: paymentData } = usePaymentAnalytics({ projectId: Number(project.id) });
  const { data: liftTokenData } = useLiftTokenAnalytics(Number(project.id));
  
  // Fetch real project data
  const { data: projectMetrics, isLoading: metricsLoading } = useProjectMetrics(Number(project.id));
  const { data: verificationData, isLoading: verificationLoading } = useProjectVerification(Number(project.id));
  
  // State management
  const updateStateMutation = useUpdateProjectState();
  
  const projectStates = [
    { value: 'DRAFT', label: 'Draft', color: 'gray' },
    { value: 'BASELINED', label: 'Baselined', color: 'blue' },
    { value: 'ACTIVE_FUNDRAISING', label: 'Active Fundraising', color: 'green' },
    { value: 'IMPLEMENTATION', label: 'Implementation', color: 'orange' },
    { value: 'MONITORING', label: 'Monitoring', color: 'purple' },
    { value: 'VERIFIED_ROUND', label: 'Verified', color: 'emerald' },
    { value: 'ARCHIVED', label: 'Archived', color: 'gray' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' }
  ];
  
  const currentStateConfig = projectStates.find(s => s.value === project.state) || projectStates[0];
  
  const getNextPossibleStates = (currentState: string) => {
    const stateTransitions: { [key: string]: string[] } = {
      'DRAFT': ['BASELINED', 'CANCELLED'],
      'BASELINED': ['ACTIVE_FUNDRAISING', 'CANCELLED'],
      'ACTIVE_FUNDRAISING': ['IMPLEMENTATION', 'CANCELLED'],
      'IMPLEMENTATION': ['MONITORING', 'CANCELLED'],
      'MONITORING': ['VERIFIED_ROUND', 'CANCELLED'],
      'VERIFIED_ROUND': ['MONITORING', 'ARCHIVED'],
      'ARCHIVED': [],
      'CANCELLED': []
    };
    return stateTransitions[currentState] || [];
  };
  
  const handleStateChange = async (newState: string) => {
    try {
      await updateStateMutation.mutateAsync({ id: Number(project.id), state: newState });
      // Add real-time update
      setRealtimeUpdates(prev => [{
        id: Date.now(),
        type: 'state_change',
        message: `Project state changed to ${projectStates.find(s => s.value === newState)?.label}`,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 4)]); // Keep only 5 most recent
    } catch (error) {
      console.error('Failed to update project state:', error);
    }
  };

  // Set up WebSocket for real-time updates (currently disabled, so using polling fallback)
  const { lastMessage } = useWebSocket({
    url: `ws://localhost:3000/ws`,
    onMessage: (message) => {
      if (message.type === 'indexer' && message.data?.projectId === Number(project.id)) {
        setRealtimeUpdates(prev => [{
          id: Date.now(),
          type: 'blockchain_event',
          message: `Blockchain event: ${message.data.eventName}`,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 4)]);
      }
    }
  });

  // Polling fallback for real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      // Simulate checking for updates (in a real app, this would poll an endpoint)
      if (Math.random() < 0.1) { // 10% chance of update each interval
        const updateTypes = ['verification_progress', 'payment_received', 'token_minted'];
        const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
        
        setRealtimeUpdates(prev => [{
          id: Date.now(),
          type: randomType,
          message: `Update: ${randomType.replace('_', ' ')} for project`,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 4)]);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [project.id]);

  const getProjectTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'water': case 'conservation': case 'restoration':
        return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'carbon': case 'forest': case 'reforestation':
        return <Leaf className="h-5 w-5 text-green-600" />;
      case 'energy': case 'renewable':
        return <Zap className="h-5 w-5 text-yellow-600" />;
      default:
        return <Building className="h-5 w-5 text-purple-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <div className="flex items-center space-x-3">
              {getProjectTypeIcon(project.type)}
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {project.type && (
                <span className="capitalize">{project.type} Project</span>
              )}
              {project.location && (
                <span> • {project.location}</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onEdit && (
            <Button size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Project State Management */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Project Lifecycle</h3>
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${currentStateConfig.color}-100 text-${currentStateConfig.color}-800`}>
                  {currentStateConfig.label}
                </div>
                <span className="text-sm text-muted-foreground">
                  Current project state
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {getNextPossibleStates(project.state || 'DRAFT').map(nextState => {
                const stateConfig = projectStates.find(s => s.value === nextState);
                return stateConfig ? (
                  <Button
                    key={nextState}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStateChange(nextState)}
                    disabled={updateStateMutation.isPending}
                    className={`border-${stateConfig.color}-300 text-${stateConfig.color}-700 hover:bg-${stateConfig.color}-50`}
                  >
                    {updateStateMutation.isPending ? 'Updating...' : `Move to ${stateConfig.label}`}
                  </Button>
                ) : null;
              })}
            </div>
          </div>
          
          {/* State Requirements */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-medium mb-2">State Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Current Requirements Met:</p>
                <ul className="mt-1 space-y-1">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Project created with metadata</span>
                  </li>
                  {project.state !== 'DRAFT' && (
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Baseline documentation completed</span>
                    </li>
                  )}
                  {['ACTIVE_FUNDRAISING', 'IMPLEMENTATION', 'MONITORING', 'VERIFIED_ROUND', 'ARCHIVED'].includes(project.state || '') && (
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Fundraising criteria established</span>
                    </li>
                  )}
                  {verificationData?.rounds && verificationData.rounds.length > 0 && (
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Verification completed</span>
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Next Steps:</p>
                <ul className="mt-1 space-y-1">
                  {getNextPossibleStates(project.state || 'DRAFT').map(nextState => {
                    const stateConfig = projectStates.find(s => s.value === nextState);
                    return stateConfig ? (
                      <li key={nextState} className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Ready to move to {stateConfig.label}</span>
                      </li>
                    ) : null;
                  })}
                  {getNextPossibleStates(project.state || 'DRAFT').length === 0 && (
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Project lifecycle complete</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketplace Actions */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Lift Token Marketplace</h3>
              <p className="text-sm text-muted-foreground">
                Invest in this project's environmental impact through tokenized carbon units and forward contracts.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => window.open(`/marketplace/tokens/${project.id}`, '_blank')}
              >
                <Coins className="h-4 w-4 mr-2" />
                Buy Tokens
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => window.open(`/marketplace/forwards/${project.id}`, '_blank')}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Buy Forward
              </Button>
            </div>
          </div>
          
          {/* Market Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Token Price</p>
              <p className="text-xl font-bold text-green-600">$25.50</p>
              <p className="text-xs text-muted-foreground">per tCO2e</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Forward Price</p>
              <p className="text-xl font-bold text-blue-600">$22.00</p>
              <p className="text-xs text-muted-foreground">delivery in 12 months</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Available Supply</p>
              <p className="text-xl font-bold">1,250</p>
              <p className="text-xs text-muted-foreground">tCO2e units</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Banner */}
      {project.status === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                This project is pending approval and review.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">
                  {metricsLoading ? '...' : (projectMetrics?.progress || project.progress || 0)}%
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <Progress value={projectMetrics?.progress || project.progress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funds Raised</p>
                <p className="text-2xl font-bold">
                  {metricsLoading ? '...' : (
                    projectMetrics?.fundsRaised 
                      ? `$${parseInt(projectMetrics.fundsRaised).toLocaleString()}` 
                      : (project.budget ? `$${project.budget.toLocaleString()}` : 'N/A')
                  )}
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                <p className="text-lg font-bold">
                  {project.timeline?.duration || 'Ongoing'}
                </p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lift Minted</p>
                <p className="text-2xl font-bold text-green-600">
                  {metricsLoading ? '...' : (projectMetrics?.liftMinted || 0)}
                </p>
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Updates */}
      {realtimeUpdates.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Real-time Updates</span>
            </CardTitle>
            <CardDescription className="text-green-600">
              Live activity and blockchain events for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realtimeUpdates.map((update) => (
                <div key={update.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-green-800">{update.message}</p>
                      <p className="text-xs text-green-600">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {update.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.description || 'No description available.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {project.location || 'Location not specified'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {project.category && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{project.category}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {project.stakeholders || 'Stakeholders not specified'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {project.expectedImpact && (
            <Card>
              <CardHeader>
                <CardTitle>Expected Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.expectedImpact}
                </p>
              </CardContent>
            </Card>
          )}

          {project.methodology && (
            <Card>
              <CardHeader>
                <CardTitle>Methodology</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.methodology}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lift Tokens */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-green-600" />
                  <span>Lift Tokens</span>
                </CardTitle>
                <CardDescription>
                  Verified carbon credits tokenized on blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                    <p className="text-2xl font-bold text-green-600">$25.50</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">24h Change</p>
                    <p className="text-2xl font-bold text-green-600">+2.5%</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Available Supply</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">1,250 / 2,500 tCO2e</span>
                    <span className="text-sm text-muted-foreground">50% sold</span>
                  </div>
                  <Progress value={50} className="mt-2" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => window.open(`/marketplace/tokens/${project.id}/buy`, '_blank')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`/marketplace/tokens/${project.id}`, '_blank')}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Forward Contracts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                  <span>Forward Contracts</span>
                </CardTitle>
                <CardDescription>
                  Purchase future carbon credits at today's price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Forward Price</p>
                    <p className="text-2xl font-bold text-blue-600">$22.00</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery</p>
                    <p className="text-2xl font-bold">12 months</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Forward Inventory</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">750 / 1,500 tCO2e</span>
                    <span className="text-sm text-muted-foreground">50% reserved</span>
                  </div>
                  <Progress value={50} className="mt-2" />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Discount:</strong> Save $3.50 per tCO2e vs. spot price
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(`/marketplace/forwards/${project.id}/buy`, '_blank')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Forward
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`/marketplace/forwards/${project.id}`, '_blank')}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Trading Activity</CardTitle>
              <CardDescription>
                Latest transactions for this project's carbon credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Token Purchase</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">50 tCO2e @ $25.50</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Forward Contract</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">100 tCO2e @ $22.00</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Token Purchase</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">25 tCO2e @ $25.25</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Lift Token Metrics</CardTitle>
                <CardDescription>
                  Environmental credits and retirement activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {liftTokenData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Supply</p>
                        <p className="text-2xl font-bold">{liftTokenData.activeTokens + liftTokenData.retiredTokens}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Retired</p>
                        <p className="text-2xl font-bold text-green-600">{liftTokenData.retiredTokens}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Retirement Progress</p>
                      <Progress 
                        value={(liftTokenData.retiredTokens / (liftTokenData.activeTokens + liftTokenData.retiredTokens)) * 100} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((liftTokenData.retiredTokens / (liftTokenData.activeTokens + liftTokenData.retiredTokens)) * 100)}% of tokens retired
                      </p>
                    </div>

                    <div className="space-y-2">
                      {liftTokenData.statusDistribution.map((status) => (
                        <div key={status.status} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{status.status}</span>
                          <Badge variant={status.status === 'retired' ? 'default' : 'secondary'}>
                            {status.count} ({status.percentage}%)
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading token metrics...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Impact</CardTitle>
                <CardDescription>
                  Payment volume and funding metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                        <p className="text-2xl font-bold">
                          {(parseInt(paymentData.totalVolume) / 1e18).toFixed(2)} ETH
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Payment Types</p>
                      {paymentData.typeDistribution.map((type) => (
                        <div key={type.type} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{type.type.replace('_', ' ')}</span>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{type.count} payments</p>
                            <p className="text-xs text-muted-foreground">
                              {(parseInt(type.volume) / 1e18).toFixed(2)} ETH
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {paymentData.growthMetrics && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Growth Metrics</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Volume Growth</p>
                            <p className={`text-sm font-semibold ${paymentData.growthMetrics.periodOverPeriod.volume.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {paymentData.growthMetrics.periodOverPeriod.volume.growth >= 0 ? '+' : ''}{paymentData.growthMetrics.periodOverPeriod.volume.growth.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Payment Growth</p>
                            <p className={`text-sm font-semibold ${paymentData.growthMetrics.periodOverPeriod.count.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {paymentData.growthMetrics.periodOverPeriod.count.growth >= 0 ? '+' : ''}{paymentData.growthMetrics.periodOverPeriod.count.growth.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading financial metrics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Issuance Timeline Chart */}
          {liftTokenData?.issuanceTimeline && (
            <Card>
              <CardHeader>
                <CardTitle>Token Issuance Timeline</CardTitle>
                <CardDescription>
                  Historical issuance and retirement patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liftTokenData.issuanceTimeline.map((period, index) => (
                    <div key={period.date} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{new Date(period.date).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-green-600">+{period.issued} issued</p>
                          <p className="text-sm text-red-600">-{period.retired} retired</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{period.cumulative} total</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>
                Project verification and validation information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading verification data...</p>
                </div>
              ) : verificationData?.rounds && verificationData.rounds.length > 0 ? (
                <div className="space-y-6">
                  {/* Current Status */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-800">Verified</h4>
                        <p className="text-sm text-green-600">
                          Latest verification: Round {Math.max(...verificationData.rounds.map((r: any) => r.round))}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      {verificationData.rounds.length} Round{verificationData.rounds.length > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Verification History */}
                  <div>
                    <h4 className="font-semibold mb-4">Verification History</h4>
                    <div className="space-y-4">
                      {verificationData.rounds
                        .sort((a: any, b: any) => b.round - a.round)
                        .map((round: any) => (
                        <div key={round.round} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-green-600">R{round.round}</span>
                              </div>
                              <div>
                                <p className="font-medium">Verification Round {round.round}</p>
                                <p className="text-sm text-muted-foreground">
                                  Attested by {round.attestor} • {new Date(round.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Verified
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-muted-foreground">Report Hash</p>
                              <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                                {round.reportHash}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Report URI</p>
                              <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                                <a href={round.reportURI} target="_blank" rel="noopener noreferrer">
                                  View Report
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Next Verification</h4>
                        <p className="text-sm text-muted-foreground">
                          Schedule next verification round to maintain project validity
                        </p>
                      </div>
                      <Button variant="outline">
                        Schedule Verification
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Verification Pending</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This project has not yet undergone verification.
                  </p>
                  <div className="space-y-3">
                    <Button>
                      Start Verification Process
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Verification is required before issuing Lift Tokens
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Requirements</CardTitle>
              <CardDescription>
                Requirements for project verification and token issuance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Project baseline documentation completed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Implementation methodology verified</span>
                </div>
                <div className="flex items-center space-x-3">
                  {verificationData?.rounds && verificationData.rounds.length > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="text-sm">Third-party verification assessment</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm">Monitoring and outcome verification (ongoing)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>
                Key milestones and project phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Project Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {project.timeline?.startDate && (
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Implementation Start</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.timeline.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {project.timeline?.endDate && (
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div>
                      <p className="font-medium">Expected Completion</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.timeline.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>
                Supporting documentation and files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No documents have been uploaded for this project yet.
                </p>
                <Button variant="outline">
                  Upload Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}