/**
 * Farcaster Mini App SDK Utilities
 * Complete integration following https://miniapps.farcaster.xyz/
 */

let sdkInstance = null;
let isInitialized = false;

/**
 * Get or initialize the Farcaster Mini App SDK
 * @returns {Promise<Object|null>} SDK instance or null if not in Mini App
 */
export async function getMiniAppSDK() {
  if (sdkInstance) {
    return sdkInstance;
  }

  try {
    const mod = await import("@farcaster/miniapp-sdk");
    sdkInstance = mod.default || mod.sdk || mod;
    
    if (!sdkInstance) {
      console.debug('[miniapp] SDK not available');
      return null;
    }

    return sdkInstance;
  } catch (error) {
    console.warn('[miniapp] Failed to load SDK:', error);
    return null;
  }
}

/**
 * Check if app is running in Farcaster Mini App environment
 * @returns {Promise<boolean>}
 */
export async function isInMiniApp() {
  const sdk = await getMiniAppSDK();
  if (!sdk) return false;
  
  return typeof sdk?.isInMiniApp === 'function' 
    ? sdk.isInMiniApp() 
    : false;
}

/**
 * Initialize Mini App - call ready() to hide splash screen
 * Must be called after app is loaded
 * @returns {Promise<boolean>} Success status
 */
export async function initMiniApp() {
  if (isInitialized) {
    console.debug('[miniapp] Already initialized');
    return true;
  }

  const sdk = await getMiniAppSDK();
  if (!sdk) return false;

  const inMiniApp = await isInMiniApp();
  if (!inMiniApp) {
    console.debug('[miniapp] Not in Mini App environment');
    return false;
  }

  try {
    if (typeof sdk?.actions?.ready === 'function') {
      await sdk.actions.ready();
      isInitialized = true;
      console.log('[miniapp] ✅ Initialized and ready() called');
      return true;
    }
  } catch (error) {
    console.error('[miniapp] Failed to call ready():', error);
  }

  return false;
}

/**
 * Get current user context (FID, username, profile picture)
 * @returns {Promise<Object|null>} User context or null
 */
export async function getUserContext() {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.context) return null;

  try {
    const context = await sdk.context.getContext();
    console.log('[miniapp] User context:', context);
    return {
      fid: context?.user?.fid || null,
      username: context?.user?.username || null,
      displayName: context?.user?.displayName || null,
      pfpUrl: context?.user?.pfpUrl || null,
      address: context?.user?.address || null, // Custody address
      theme: context?.client?.theme || 'light', // 'light' | 'dark'
    };
  } catch (error) {
    console.error('[miniapp] Failed to get user context:', error);
    return null;
  }
}

/**
 * Trigger haptic feedback (vibration)
 * @param {string} style - 'light', 'medium', 'heavy', 'success', 'warning', 'error'
 */
export async function triggerHaptic(style = 'light') {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.actions?.haptic) return;

  try {
    await sdk.actions.haptic(style);
  } catch (error) {
    console.debug('[miniapp] Haptic not supported:', error);
  }
}

/**
 * Open a URL in external browser or in-app browser
 * @param {string} url - URL to open
 * @returns {Promise<boolean>} Success status
 */
export async function openUrl(url) {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.actions?.openUrl) {
    // Fallback to window.open
    window.open(url, '_blank');
    return false;
  }

  try {
    await sdk.actions.openUrl(url);
    return true;
  } catch (error) {
    console.error('[miniapp] Failed to open URL:', error);
    window.open(url, '_blank');
    return false;
  }
}

/**
 * Compose a new cast with pre-filled text and embeds
 * @param {Object} options - Cast options
 * @param {string} options.text - Cast text
 * @param {Array<string>} options.embeds - URLs to embed
 * @returns {Promise<boolean>} Success status
 */
export async function composeCast({ text = '', embeds = [] }) {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.actions?.composeCast) {
    // Fallback to Warpcast compose URL
    const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(composeUrl, '_blank');
    return false;
  }

  try {
    await sdk.actions.composeCast({
      text,
      embeds: embeds.filter(Boolean), // Remove empty values
    });
    return true;
  } catch (error) {
    console.error('[miniapp] Failed to compose cast:', error);
    return false;
  }
}

/**
 * Close the Mini App
 * @returns {Promise<boolean>} Success status
 */
export async function closeMiniApp() {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.actions?.close) return false;

  try {
    await sdk.actions.close();
    return true;
  } catch (error) {
    console.error('[miniapp] Failed to close Mini App:', error);
    return false;
  }
}

/**
 * Send a notification to the user
 * Requires backend implementation - see https://miniapps.farcaster.xyz/docs/guides/notifications
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.targetUrl - URL to open when clicked
 * @returns {Promise<boolean>} Success status
 */
export async function sendNotification({ title, body, targetUrl }) {
  // This is a client-side placeholder
  // Actual notifications must be sent from your backend using Farcaster Notifications API
  console.log('[miniapp] Notification would be sent:', { title, body, targetUrl });
  console.log('[miniapp] To enable notifications, implement backend endpoint following:');
  console.log('[miniapp] https://miniapps.farcaster.xyz/docs/guides/notifications');
  return false;
}

/**
 * Navigate back in Mini App history
 * @returns {Promise<boolean>} Success status
 */
export async function navigateBack() {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.actions?.back) {
    window.history.back();
    return false;
  }

  try {
    await sdk.actions.back();
    return true;
  } catch (error) {
    console.error('[miniapp] Failed to navigate back:', error);
    window.history.back();
    return false;
  }
}

/**
 * Quick Auth - Fetch with automatic authentication
 * Adds Farcaster auth headers to fetch requests
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function quickAuthFetch(url, options = {}) {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.quickAuth?.fetch) {
    // Fallback to regular fetch without auth
    return fetch(url, options);
  }

  try {
    return await sdk.quickAuth.fetch(url, options);
  } catch (error) {
    console.error('[miniapp] Quick Auth fetch failed:', error);
    throw error;
  }
}

/**
 * Sign in with Farcaster
 * Returns SIWE (Sign-In with Ethereum) credentials
 * @returns {Promise<Object|null>} SIWE credentials or null
 */
export async function signIn() {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.actions?.signIn) {
    console.warn('[miniapp] signIn not available');
    return null;
  }

  try {
    const credentials = await sdk.actions.signIn();
    console.log('[miniapp] Sign-in successful:', credentials);
    return credentials;
  } catch (error) {
    console.error('[miniapp] Sign-in failed:', error);
    return null;
  }
}


/**
 * Listen to SDK events
 * @param {string} event - Event name ('primaryButtonClicked', etc.)
 * @param {Function} callback - Event handler
 * @returns {Function} Unsubscribe function
 */
export async function addEventListener(event, callback) {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.events?.on) {
    return () => {}; // No-op unsubscribe
  }

  try {
    return sdk.events.on(event, callback);
  } catch (error) {
    console.error('[miniapp] Failed to add event listener:', error);
    return () => {};
  }
}

/**
 * Set primary action button
 * @param {Object} options - Button options
 * @param {string} options.text - Button text
 * @param {Function} options.onClick - Click handler
 * @param {boolean} options.isVisible - Button visibility
 * @param {boolean} options.isEnabled - Button enabled state
 */
export async function setPrimaryButton({ text, onClick, isVisible = true, isEnabled = true }) {
  const sdk = await getMiniAppSDK();
  if (!sdk || !sdk.actions?.setPrimaryButton) {
    console.debug('[miniapp] Primary button not supported');
    return;
  }

  try {
    await sdk.actions.setPrimaryButton({
      text,
      isVisible,
      isEnabled,
    });

    // Listen for button clicks
    if (onClick) {
      addEventListener('primaryButtonClicked', onClick);
    }
  } catch (error) {
    console.error('[miniapp] Failed to set primary button:', error);
  }
}

// Export all utilities
export default {
  getMiniAppSDK,
  isInMiniApp,
  initMiniApp,
  getUserContext,
  triggerHaptic,
  openUrl,
  composeCast,
  closeMiniApp,
  sendNotification,
  navigateBack,
  quickAuthFetch,
  signIn,
  addEventListener,
  setPrimaryButton,
};
