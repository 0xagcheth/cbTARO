import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './wagmi'
import App from './App.jsx'
import './index.css'

// Create QueryClient for wagmi
const queryClient = new QueryClient()

// Mobile WebView fixes script
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  // Debug logging for mobile WebView issues
  if (window.location.search.includes('debug=1')) {
    console.log(`📱 Viewport: ${window.innerWidth}x${window.innerHeight}, --vh: ${vh}px`);
    console.log(`📱 Safe areas: top=${getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')}, bottom=${getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')}`);
  }
}

// Set initial value
setVH();

// Update on resize/orientation change
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', function() {
  // Delay to account for mobile browser UI changes
  setTimeout(setVH, 100);
});

/**
 * Bootstrap Mini App SDK
 * Uses utility module for complete SDK integration
 */
import { initMiniApp, isInMiniApp as checkIsInMiniApp, getMiniAppSDK } from './utils/miniapp';

async function bootstrapMiniApp() {
  try {
    const inMiniApp = await checkIsInMiniApp();
    
    if (!inMiniApp) {
      if (import.meta.env.DEV) {
        console.debug('[miniapp] Not in Mini App environment');
      }
      return { isInMiniApp: false };
    }

    // Initialize Mini App (calls ready())
    const success = await initMiniApp();
    
    if (success) {
      // Store SDK globally for backwards compatibility
      const sdk = await getMiniAppSDK();
      window.miniAppSDK = sdk;
      window.isInMiniApp = true;
      
      console.log('[miniapp] ✅ Mini App initialized successfully');
      return { isInMiniApp: true, sdk };
    } else {
      console.warn('[miniapp] Failed to initialize Mini App');
      return { isInMiniApp: false };
    }
  } catch (error) {
    console.warn('[miniapp] Error bootstrapping Mini App:', error);
    return { isInMiniApp: false };
  }
}

// Render React app with QueryClientProvider + WagmiProvider
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Bootstrap Mini App after DOM is ready and React has rendered
// Wait for DOMContentLoaded, then give React time to render
function initMiniApp() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Small delay to ensure React has rendered
      setTimeout(bootstrapMiniApp, 200);
    });
  } else {
    // DOM already ready, wait for React to render
    setTimeout(bootstrapMiniApp, 200);
  }
}

// Start initialization
initMiniApp();
