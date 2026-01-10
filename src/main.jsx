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
 * CRITICAL: Call ready() immediately to hide splash screen
 * According to: https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display
 */

// Import SDK and call ready() immediately
// Using dynamic import to handle environments where SDK is not available
(async () => {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    await sdk.actions.ready();
    console.log('[miniapp] ✅ ready() called');
  } catch (error) {
    console.warn('[miniapp] ready() not called (not in Mini App or SDK not available):', error);
  }
})();

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

// No additional initialization needed - ready() already called above
