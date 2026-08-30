import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

// Suppress benign ResizeObserver errors and log genuine errors to Analytics
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.stopImmediatePropagation();
    return;
  }

  if (analytics) {
    logEvent(analytics, 'exception', {
      description: `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`,
      fatal: true,
    });
  }
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  if (analytics) {
    logEvent(analytics, 'exception', {
      description: `Unhandled Promise Rejection: ${e.reason?.message || e.reason || 'Unknown'}`,
      fatal: true,
    });
  }
});

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
