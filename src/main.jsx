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

// Farcaster SDK ready check script (legacy support)
window.checkFarcasterReady = function() {
  console.log('🔍 Checking Farcaster SDK readiness...');

  // Check different possible SDK global names
  const sdk = window.farcaster || window.farcasterSDK || window.sdk || window.FarcasterSDK;

  if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
    console.log('✅ Farcaster SDK is ready, calling actions.ready()');
    try {
      sdk.actions.ready();
      console.log('✅ Successfully called farcaster.actions.ready()');
      return true;
    } catch (error) {
      console.error('❌ Error in farcaster.actions.ready():', error);
      return false;
    }
  } else {
    console.log('⏳ Farcaster SDK not ready yet, will retry...');
    return false;
  }
};

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

// Try to initialize immediately (legacy support)
if (document.readyState === 'complete') {
  window.checkFarcasterReady();
} else {
  // Wait for DOM and then check
  document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all scripts are loaded
    setTimeout(window.checkFarcasterReady, 100);
  });

  // Also check on window load
  window.addEventListener('load', function() {
    setTimeout(window.checkFarcasterReady, 50);
  });
}

// Periodic check for SDK (in case it loads asynchronously)
let sdkCheckInterval = setInterval(function() {
  if (window.checkFarcasterReady()) {
    clearInterval(sdkCheckInterval);
  }
}, 500);

// Clear interval after 10 seconds to avoid infinite checking
setTimeout(function() {
  clearInterval(sdkCheckInterval);
}, 10000);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
