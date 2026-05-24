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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/hk-mahjong-web">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
