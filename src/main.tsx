import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Gracefully handle and suppress benign Vite HMR WebSocket disconnects in sandboxed iframes
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonText = String(event.reason || '');
    const messageText = String(event.reason?.message || '');
    if (
      reasonText.includes('WebSocket') ||
      messageText.includes('WebSocket') ||
      reasonText.includes('closed without opened') ||
      messageText.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const errorText = String(event.message || '');
    if (
      errorText.includes('WebSocket') ||
      errorText.includes('failed to connect to websocket') ||
      errorText.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  // Register Service Worker for offline capability
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
