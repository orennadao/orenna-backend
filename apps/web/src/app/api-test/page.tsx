"use client";

import { useState } from 'react';

export default function ApiTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState('Ready to test...');

  const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    setResults(prev => [...prev, logEntry]);
    console.log(message, data);
  };

  const updateStatus = (message: string, success?: boolean) => {
    setStatus(message);
  };

  const testHealth = async () => {
    log('🔍 Testing API Health Check...');
    updateStatus('Testing API health...');
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      log('✅ Health Check Success:', data);
      updateStatus(`API Status: ${data.status} | DB: ${data.database?.connected ? 'Connected' : 'Disconnected'}`);
      return data;
    } catch (error: any) {
      log(`❌ Health Check Failed: ${error.message}`);
      updateStatus('Health check failed');
      throw error;
    }
  };

  const testDatabase = async () => {
    log('🔍 Testing Database Connection...');
    updateStatus('Testing database connection...');
    
    try {
      const response = await fetch('/api/db-test');
      const data = await response.json();
      
      log('✅ Database Test Success:', data);
      updateStatus(`DB Version: ${data.database?.version} | Connected: ${data.database?.connected}`);
      return data;
    } catch (error: any) {
      log(`❌ Database Test Failed: ${error.message}`);
      updateStatus('Database test failed');
      throw error;
    }
  };

  const testDirectAPI = async () => {
    log('🔍 Testing Direct API Connection...');
    updateStatus('Testing direct API...');
    
    try {
      const response = await fetch('https://orenna-api.vercel.app/api/health');
      const data = await response.json();
      
      log('✅ Direct API Success:', data);
      updateStatus('Direct API connection working');
      return data;
    } catch (error: any) {
      log(`❌ Direct API Failed: ${error.message}`);
      updateStatus('Direct API failed');
      throw error;
    }
  };

  const runAllTests = async () => {
    setResults([]);
    log('🚀 Running All API Tests...');
    
    const tests = [
      { name: 'Proxied API Health', fn: testHealth },
      { name: 'Database Connection', fn: testDatabase },
      { name: 'Direct API Connection', fn: testDirectAPI }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        await test.fn();
        passed++;
      } catch (error) {
        failed++;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    log(`📊 Test Summary: ${passed} passed, ${failed} failed`);
    updateStatus(`Tests completed: ${passed} passed, ${failed} failed`);
  };

  const clearResults = () => {
    setResults([]);
    setStatus('Ready to test...');
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      maxWidth: '800px', 
      margin: '2rem auto', 
      padding: '2rem',
      background: '#f8fafc'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀 Orenna API Test</h1>
        <p>Test the connection between frontend and deployed API</p>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        marginBottom: '2rem' 
      }}>
        <h2 style={{ marginBottom: '1rem' }}>API Tests</h2>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={testHealth}
            style={{ 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              margin: '0.5rem',
              fontSize: '14px'
            }}
          >
            Test Proxied API
          </button>
          <button 
            onClick={testDatabase}
            style={{ 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              margin: '0.5rem',
              fontSize: '14px'
            }}
          >
            Test Database
          </button>
          <button 
            onClick={testDirectAPI}
            style={{ 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              margin: '0.5rem',
              fontSize: '14px'
            }}
          >
            Test Direct API
          </button>
          <button 
            onClick={runAllTests}
            style={{ 
              background: '#059669', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              margin: '0.5rem',
              fontSize: '14px'
            }}
          >
            Run All Tests
          </button>
          <button 
            onClick={clearResults}
            style={{ 
              background: '#6b7280', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              margin: '0.5rem',
              fontSize: '14px'
            }}
          >
            Clear
          </button>
        </div>
        
        <div style={{ 
          background: '#f1f5f9', 
          padding: '1rem', 
          borderRadius: '4px', 
          minHeight: '2rem',
          marginBottom: '1rem'
        }}>
          <strong>Status:</strong> {status}
        </div>

        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '4px', 
          maxHeight: '400px', 
          overflowY: 'auto' 
        }}>
          {results.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No test results yet...</p>
          ) : (
            results.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '1rem', 
                paddingBottom: '1rem', 
                borderBottom: '1px solid #e5e7eb' 
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {result.timestamp}
                </div>
                <div style={{ 
                  color: result.message.includes('✅') ? '#059669' : 
                        result.message.includes('❌') ? '#dc2626' : '#0891b2',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  {result.message}
                </div>
                {result.data && (
                  <pre style={{ 
                    background: '#f1f5f9', 
                    padding: '0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    overflow: 'auto' 
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Configuration Info</h3>
        <p><strong>Frontend URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Unknown'}</p>
        <p><strong>API Proxy:</strong> /api/* → https://orenna-api.vercel.app/api/*</p>
        <p><strong>Direct API:</strong> https://orenna-api.vercel.app</p>
        <p><strong>Database:</strong> Neon PostgreSQL</p>
      </div>
    </div>
  );
}