'use client';

export default function NewDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-4">Dashboard - Simplified</h1>
      <p className="text-muted-foreground mb-6">This is a simplified dashboard to test basic functionality.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Projects</h3>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 from last month</p>
        </div>
        
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">VWBA Units</h3>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">+1 from last month</p>
        </div>
        
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Impact</h3>
          <div className="text-2xl font-bold">2,480 ha</div>
          <p className="text-xs text-muted-foreground">+340 ha from last month</p>
        </div>
      </div>
      
      <div className="border border-border rounded-lg p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <h4 className="font-medium">Amazon Rainforest Conservation</h4>
              <p className="text-sm text-muted-foreground">Forest</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <h4 className="font-medium">Wetland Restoration Project</h4>
              <p className="text-sm text-muted-foreground">Wetland</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
              Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}