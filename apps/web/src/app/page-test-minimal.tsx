'use client';

import { useState, useEffect } from 'react';

export default function MinimalTestPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Orenna DAO - Test Page</h1>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Minimal Test</h2>
          <p className="text-xl text-gray-600 mb-8">
            Testing without Web3 components
          </p>
          <div className="space-y-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Test Button 1
            </button>
            <br />
            <button className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Test Button 2
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}