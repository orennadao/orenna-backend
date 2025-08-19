'use client';

import { useState } from 'react';

export default function CleanPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', lineHeight: 1.6 }}>
      <h1>Clean Test Page</h1>
      <p>This page only uses React built-ins, no custom imports.</p>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Counter Test</h2>
        <p>Count: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007acc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          Increment
        </button>
        <button 
          onClick={() => setCount(0)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#666', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Form Test</h2>
        <input 
          type="text" 
          placeholder="Type something..."
          style={{ 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            marginRight: '8px'
          }}
        />
        <button 
          onClick={() => alert('Form works!')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Alert
        </button>
      </div>
    </div>
  );
}