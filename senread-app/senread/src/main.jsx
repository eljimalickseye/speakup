import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'

// Automatic Deployment Update Checker
if (typeof window !== 'undefined') {
  const checkForAppUpdates = async () => {
    try {
      const res = await fetch('/index.html?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const text = await res.text();
      
      const scriptElements = Array.from(document.querySelectorAll('script[src*="assets/"]'));
      const currentScriptSrc = scriptElements[0]?.src || '';
      const currentHash = currentScriptSrc.split('/').pop();

      const match = text.match(/assets\/index-[a-zA-Z0-9_-]+\.js/);
      if (match && currentHash) {
        const remoteHash = match[0].split('/').pop();
        if (remoteHash && remoteHash !== currentHash) {
          console.log('New app deployment detected! Reloading for fresh updates...');
          window.location.reload(true);
        }
      }
    } catch (err) {
      // Ignore network errors when offline
    }
  };

  window.addEventListener('focus', checkForAppUpdates);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdates();
    }
  });
}

let rootElement = document.getElementById('root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
