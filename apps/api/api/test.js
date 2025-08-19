// API Test Page as serverless function
module.exports = (req, res) => {
  // Set content type to HTML
  res.setHeader('Content-Type', 'text/html');
  
  // Return the test page HTML
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orenna API Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background: #f8fafc;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .test-section {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            margin: 0.5rem;
            font-size: 14px;
        }
        .button:hover {
            background: #2563eb;
        }
        .button.success {
            background: #059669;
        }
        .button.success:hover {
            background: #047857;
        }
        .success { color: #059669; }
        .error { color: #dc2626; }
        .info { color: #0891b2; }
        pre {
            background: #f1f5f9;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
        .status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        .status.success {
            background: #d1fae5;
            color: #065f46;
        }
        .status.error {
            background: #fee2e2;
            color: #991b1b;
        }
        .results-area {
            max-height: 400px;
            overflow-y: auto;
            background: #f8fafc;
            padding: 1rem;
            border-radius: 4px;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Orenna API Connectivity Test</h1>
        <p>Test the connection between frontend and deployed API</p>
        <p><strong>API Base URL:</strong> https://orenna-api.vercel.app</p>
    </div>

    <div class="test-section">
        <h2>API Tests</h2>
        <button class="button" onclick="testHealth()">Test API Health</button>
        <button class="button" onclick="testDatabase()">Test Database</button>
        <button class="button" onclick="testCORS()">Test CORS</button>
        <button class="button success" onclick="runAllTests()">Run All Tests</button>
        <button class="button" onclick="clearResults()" style="background: #6b7280">Clear Results</button>
        
        <div id="status" style="background: #f1f5f9; padding: 1rem; border-radius: 4px; margin-top: 1rem; min-height: 2rem;">
            <strong>Status:</strong> Ready to test...
        </div>

        <div id="results" class="results-area">
            <p style="color: #6b7280;">Click "Run All Tests" to start testing your API connectivity...</p>
        </div>
    </div>

    <div class="test-section">
        <h2>Connection Info</h2>
        <p><strong>Test Page URL:</strong> https://orenna-api.vercel.app/api/test</p>
        <p><strong>API Health:</strong> https://orenna-api.vercel.app/api/health</p>
        <p><strong>Database Test:</strong> https://orenna-api.vercel.app/api/db-test</p>
        <p><strong>Database:</strong> Neon PostgreSQL (70+ tables)</p>
        <p><strong>Environment:</strong> Production</p>
    </div>

    <script>
        const API_BASE = 'https://orenna-api.vercel.app';
        const results = document.getElementById('results');
        const status = document.getElementById('status');

        function log(message, type = 'info') {
            console.log(message);
            const div = document.createElement('div');
            div.className = type;
            div.style.marginBottom = '1rem';
            div.style.paddingBottom = '1rem';
            div.style.borderBottom = '1px solid #e5e7eb';
            
            const timestamp = new Date().toLocaleTimeString();
            div.innerHTML = 
                '<div style="font-size: 12px; color: #6b7280; margin-bottom: 0.5rem;">' + timestamp + '</div>' +
                '<div style="color: ' + (type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#0891b2') + '; font-weight: 500; margin-bottom: 0.5rem;">' + 
                message + '</div>' + 
                (typeof arguments[2] !== 'undefined' ? '<pre style="background: #f1f5f9; padding: 0.5rem; border-radius: 4px; font-size: 12px; overflow: auto;">' + 
                JSON.stringify(arguments[2], null, 2) + '</pre>' : '');
            
            results.appendChild(div);
            results.scrollTop = results.scrollHeight;
        }

        function updateStatus(message, success = null) {
            status.innerHTML = '<strong>Status:</strong> ' + 
                (success === null ? message : 
                '<span class="status ' + (success ? 'success' : 'error') + '">' + (success ? '✅' : '❌') + '</span> ' + message);
        }

        async function testHealth() {
            log('🔍 Testing API Health Check...', 'info');
            updateStatus('Testing API health...');
            
            try {
                const response = await fetch(API_BASE + '/api/health');
                const data = await response.json();
                
                log('✅ Health Check Success', 'success', data);
                
                updateStatus('API Status: ' + data.status + ' | DB: ' + (data.database?.connected ? 'Connected' : 'Disconnected'), true);
                return data;
            } catch (error) {
                log('❌ Health Check Failed: ' + error.message, 'error');
                updateStatus('Health check failed', false);
                throw error;
            }
        }

        async function testDatabase() {
            log('🔍 Testing Database Connection...', 'info');
            updateStatus('Testing database connection...');
            
            try {
                const response = await fetch(API_BASE + '/api/db-test');
                const data = await response.json();
                
                log('✅ Database Test Success', 'success', data);
                
                updateStatus('DB Version: ' + data.database?.version + ' | Connected: ' + data.database?.connected, true);
                return data;
            } catch (error) {
                log('❌ Database Test Failed: ' + error.message, 'error');
                updateStatus('Database test failed', false);
                throw error;
            }
        }

        async function testCORS() {
            log('🔍 Testing CORS Configuration...', 'info');
            updateStatus('Testing CORS headers...');
            
            try {
                const response = await fetch(API_BASE + '/api/health', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                const headers = {};
                response.headers.forEach((value, key) => {
                    headers[key] = value;
                });
                
                const data = await response.json();
                log('✅ CORS Test Success (Status: ' + response.status + ')', 'success', {
                    status: response.status,
                    statusText: response.statusText,
                    corsHeaders: headers,
                    responseData: data
                });
                
                updateStatus('CORS configuration working', true);
                return data;
            } catch (error) {
                log('❌ CORS Test Failed: ' + error.message, 'error');
                updateStatus('CORS test failed', false);
                throw error;
            }
        }

        async function runAllTests() {
            results.innerHTML = '<p style="color: #0891b2;">🚀 Running comprehensive API tests...</p>';
            log('🚀 Running All API Tests...', 'info');
            
            const tests = [
                { name: 'Health Check', fn: testHealth },
                { name: 'Database Connection', fn: testDatabase },
                { name: 'CORS Configuration', fn: testCORS }
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
            
            const summary = '📊 Test Summary: ' + passed + ' passed, ' + failed + ' failed';
            log(summary, passed > failed ? 'success' : 'error');
            updateStatus('Tests completed: ' + passed + ' passed, ' + failed + ' failed', failed === 0);
            
            if (failed === 0) {
                log('🎉 All tests passed! Your API is fully connected and working.', 'success');
            } else {
                log('⚠️ Some tests failed. Check the results above for details.', 'error');
            }
        }

        function clearResults() {
            results.innerHTML = '<p style="color: #6b7280;">Results cleared. Click "Run All Tests" to start testing...</p>';
            updateStatus('Ready to test...');
        }

        // Auto-run health check on page load
        window.addEventListener('load', () => {
            setTimeout(testHealth, 1000);
        });
    </script>
</body>
</html>`);
};