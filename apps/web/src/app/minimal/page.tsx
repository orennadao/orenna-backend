'use client';

export default function MinimalPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Minimal Test Page</h1>
      <p>This page uses no custom components or hooks.</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  );
}