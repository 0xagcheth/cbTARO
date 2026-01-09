import React from 'react'
import ReactDOM from 'react-dom/client'
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
 */
async function bootstrapMiniApp() {
  try {
    // Try to get SDK from window (loaded via CDN in index.html)
    const sdk = window.farcaster || window.farcasterSDK || window.sdk || window.FarcasterSDK;
    
    if (!sdk) {
      if (import.meta.env.DEV) {
        console.debug('Mini App SDK not found, running in regular browser');
      }
      return { isInMiniApp: false, sdk: null };
    }
    
    // Check if we're in Mini App environment
    const isInMiniApp = sdk.isInMiniApp && typeof sdk.isInMiniApp === 'function' 
      ? sdk.isInMiniApp() 
      : true; // Assume true if method doesn't exist (legacy SDK)
    
    if (isInMiniApp && sdk.actions && typeof sdk.actions.ready === 'function') {
      try {
        await sdk.actions.ready();
        if (import.meta.env.DEV) {
          console.log('✅ Mini App SDK ready() called successfully');
        }
      } catch (error) {
        console.warn('Failed to call SDK ready():', error);
      }
    }
    
    // Store SDK globally for use in app
    window.miniAppSDK = sdk;
    window.isInMiniApp = isInMiniApp;
    
    return { isInMiniApp, sdk };
  } catch (error) {
    console.warn('Error bootstrapping Mini App:', error);
    return { isInMiniApp: false, sdk: null };
  }
}

// Bootstrap Mini App on load
if (document.readyState === 'complete') {
  bootstrapMiniApp();
} else {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(bootstrapMiniApp, 100);
  });
  window.addEventListener('load', function() {
    setTimeout(bootstrapMiniApp, 50);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
