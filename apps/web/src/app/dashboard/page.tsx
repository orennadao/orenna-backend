import dynamic from 'next/dynamic'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const ProtectedRoute = dynamic(
  () => import("@/components/auth/protected-route").then(mod => ({ default: mod.ProtectedRoute })),
  { ssr: false }
)

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Dashboard
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Total Payments
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">$12,345</p>
                  <p className="text-sm text-green-600 mt-1">+5.2% from last month</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Active Projects
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-blue-600 mt-1">2 new this month</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Lift Units
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                  <p className="text-sm text-purple-600 mt-1">24 minted today</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Carbon Credits
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">2,340</p>
                  <p className="text-sm text-green-600 mt-1">+12.1% this week</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Payments
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {[
                        { id: '1', amount: '$1,234', status: 'completed', date: '2024-08-16' },
                        { id: '2', amount: '$567', status: 'pending', date: '2024-08-15' },
                        { id: '3', amount: '$890', status: 'completed', date: '2024-08-14' },
                      ].map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{payment.amount}</p>
                            <p className="text-sm text-gray-500">{payment.date}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Indexer Status
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Block</span>
                        <span className="font-medium text-gray-900">#18,234,567</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Events Indexed</span>
                        <span className="font-medium text-gray-900">1,245</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                          <span className="text-sm text-green-600">Running</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}