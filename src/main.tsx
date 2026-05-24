// Suppress known third-party deprecation warnings from three.js internals
const _originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Clock: This module has been deprecated') ||
    msg.includes('PCFSoftShadowMap has been deprecated')
  ) {
    return;
  }
  _originalWarn(...args);
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler for uncaught synchronous errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[GlobalError] Uncaught error:', {
    message,
    source,
    lineno,
    colno,
    stack: error instanceof Error ? error.stack : undefined,
  });
  return false;
};

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  console.error('[GlobalError] Unhandled promise rejection:', {
    reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/hk-mahjong-web">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);
