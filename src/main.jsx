import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from './wagmi'
import App from './App.jsx'

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
 * Checks if app is running in Farcaster/Base Mini App and calls ready()
 * Uses @farcaster/miniapp-sdk from npm
 */
let readyCalled = false; // Ensure ready() is called only once

async function bootstrapMiniApp() {
  // Prevent multiple calls
  if (readyCalled) {
    return;
  }

  try {
    // Import @farcaster/miniapp-sdk from npm
    const mod = await import("@farcaster/miniapp-sdk");
    const sdk = mod.default || mod.sdk || mod;
    
    if (!sdk) {
      if (import.meta.env.DEV) {
        console.debug('[miniapp] SDK not found, running in regular browser');
      }
      return { isInMiniApp: false, sdk: null };
    }
    
    // Check if we're in Mini App environment
    const isInMiniApp = typeof sdk?.isInMiniApp === 'function' 
      ? sdk.isInMiniApp() 
      : false;
    
    if (!isInMiniApp) {
      if (import.meta.env.DEV) {
        console.debug('[miniapp] Not in Mini App environment, skipping ready()');
      }
      return { isInMiniApp: false, sdk: null };
    }
    
    // Call ready() to hide splash screen
    if (typeof sdk?.actions?.ready === 'function') {
      try {
        await sdk.actions.ready();
        readyCalled = true;
        console.log('[miniapp] ready() called');
        
        // Store SDK globally for use in app
        window.miniAppSDK = sdk;
        window.isInMiniApp = true;
        
        return { isInMiniApp: true, sdk };
      } catch (error) {
        console.warn('[miniapp] Failed to call ready():', error);
        return { isInMiniApp: false, sdk: null };
      }
    } else {
      console.warn('[miniapp] sdk.actions.ready is not a function');
      return { isInMiniApp: false, sdk: null };
    }
  } catch (error) {
    console.warn('[miniapp] Error bootstrapping Mini App:', error);
    return { isInMiniApp: false, sdk: null };
  }
}

// Render React app with WagmiProvider
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <App />
    </WagmiProvider>
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
