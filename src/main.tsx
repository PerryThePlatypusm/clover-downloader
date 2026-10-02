import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Intercept and suppress any Firebase / Firestore console logs or connection errors
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const text = args.map(a => String(a || '')).join(' ');
    if (text.includes('firebase') || text.includes('firestore') || text.includes('INVALID_ARGUMENT') || text.includes('GrpcConnection')) {
      return;
    }
    originalError(...args);
  };

  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const text = args.map(a => String(a || '')).join(' ');
    if (text.includes('firebase') || text.includes('firestore') || text.includes('INVALID_ARGUMENT') || text.includes('GrpcConnection')) {
      return;
    }
    originalWarn(...args);
  };

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

  // In dev / sandbox iframe environments, ensure any broken or stale ServiceWorker is cleaned up
  if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV || window.location.hostname.includes('run.app') || window.location.hostname === 'localhost') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    } else {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
      });
    }
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (mountErr) {
    console.error('Failed to mount root:', mountErr);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background-color: #0b0813; color: #eae5f8; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 420px; text-align: center; background: #150c29; border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 20px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="font-size: 32px; margin-bottom: 12px;">🍀</div>
          <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: bold; color: white;">Clover Downloader</h2>
          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px;">Please tap below to reload and initialize your session.</p>
          <button onclick="window.location.reload()" style="background: linear-gradient(135deg, #9333ea, #6366f1); color: white; border: none; border-radius: 12px; padding: 12px 24px; font-size: 13px; font-weight: 600; cursor: pointer; width: 100%;">Reload Application</button>
        </div>
      </div>
    `;
  }
}
