'use client';

import { MainLayout } from '@/components/layout/main-layout';

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📘 Orenna Help Center
          </h1>
          <p className="text-xl text-gray-600">
            Learn how to participate in ecological restoration through blockchain technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
            <p className="text-gray-600 mb-4">
              Learn the basics of connecting your wallet and setting up your account.
            </p>
            <a href="/auth" className="text-blue-600 hover:text-blue-700 font-medium">
              Connect Wallet →
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Browse Projects</h2>
            <p className="text-gray-600 mb-4">
              Explore active ecological restoration projects and find ones to support.
            </p>
            <a href="/projects" className="text-blue-600 hover:text-blue-700 font-medium">
              View Projects →
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Key Concepts</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">Lift Tokens:</strong> Digital representations of verified ecological improvements
              </div>
              <div>
                <strong className="text-gray-900">Lift Forwards:</strong> Pre-funding agreements for restoration work
              </div>
              <div>
                <strong className="text-gray-900">Project NFTs:</strong> Digital containers organizing project tokens
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">FAQ</h2>
            <div className="space-y-3 text-sm">
              <details className="group">
                <summary className="cursor-pointer font-medium text-gray-900 group-open:text-blue-600">
                  Can I sell Lift Tokens?
                </summary>
                <p className="mt-2 text-gray-600">
                  Yes. Lift Tokens can be transferred or sold before retirement, but retirement is required to claim ecological outcomes.
                </p>
              </details>
              
              <details className="group">
                <summary className="cursor-pointer font-medium text-gray-900 group-open:text-blue-600">
                  What if a project fails?
                </summary>
                <p className="mt-2 text-gray-600">
                  Funds are released through milestone-based escrow. If a project fails early, unspent funds may be returned or redirected by DAO vote.
                </p>
              </details>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-3">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="https://discord.gg/orenna" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-900 mb-1">Discord Community</div>
              <div className="text-sm text-gray-600">24/7 community support</div>
            </a>
            
            <a 
              href="mailto:support@orennadao.com"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-900 mb-1">Email Support</div>
              <div className="text-sm text-gray-600">Get personalized help</div>
            </a>
            
            <a 
              href="/docs"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-900 mb-1">Documentation</div>
              <div className="text-sm text-gray-600">Technical guides</div>
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}