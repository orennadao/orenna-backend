import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Welcome to Orenna DAO
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
              Regenerative finance platform for sustainable impact
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 sm:mb-12">
              <a href="/dashboard">
                <Button variant="primary" size="lg">
                  Get Started
                </Button>
              </a>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment System
                </h3>
                <p className="text-gray-600">
                  Secure blockchain-based payment processing
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Indexing Engine
                </h3>
                <p className="text-gray-600">
                  Real-time blockchain event monitoring
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Project Management
                </h3>
                <p className="text-gray-600">
                  Manage lift units and regenerative projects
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}