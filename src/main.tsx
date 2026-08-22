import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import './app/globals.css';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{background:'#0a0a0a',color:'#ff4444',fontFamily:'monospace',padding:'2rem',minHeight:'100vh'}}>
          <h1 style={{color:'#ffe600',fontSize:'1.5rem',marginBottom:'1rem'}}>⚠ Julie — Runtime Error</h1>
          <pre style={{whiteSpace:'pre-wrap',color:'#ff6b6b',fontSize:'0.85rem'}}>{this.state.error.message}</pre>
          <pre style={{whiteSpace:'pre-wrap',color:'#555',fontSize:'0.75rem',marginTop:'1rem'}}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}
