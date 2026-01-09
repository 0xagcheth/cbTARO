/**
 * Analytics utility for tracking user statistics
 */

const API_BASE = import.meta.env.VITE_ANALYTICS_API_BASE || '';

/**
 * Get user identity from Farcaster Mini App context
 * @returns {Promise<{fid: number|null, wallet: string|null}>}
 */
export async function getUserIdentity() {
  try {
    // Try to get Farcaster Mini App SDK
    const sdk = window.farcaster || window.farcasterSDK || window.sdk || window.FarcasterSDK;
    
    if (sdk?.context) {
      const context = await (typeof sdk.context === 'function' ? sdk.context() : sdk.context);
      const user = context?.user || context?.viewer;
      
      if (user?.fid || user?.userFid) {
        return {
          fid: user.fid || user.userFid,
          wallet: user.walletAddress || user.wallet || null
        };
      }
    }
    
    // Try getContext if available
    if (sdk?.getContext) {
      const context = await sdk.getContext();
      const user = context?.user || context?.viewer;
      
      if (user?.fid || user?.userFid) {
        return {
          fid: user.fid || user.userFid,
          wallet: user.walletAddress || user.wallet || null
        };
      }
    }
    
    // Try user property directly
    if (sdk?.user) {
      const user = sdk.user;
      if (user?.fid || user?.userFid) {
        return {
          fid: user.fid || user.userFid,
          wallet: user.walletAddress || user.wallet || null
        };
      }
    }
    
    // Fallback: check if we have FID from other sources (e.g., from auth hook)
    // This is a fallback - ideally FID should come from SDK
    return { fid: null, wallet: null };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Failed to get user identity:', error);
    }
    return { fid: null, wallet: null };
  }
}

/**
 * Track event
 * @param {string} event - 'visit' | 'reading'
 * @param {string|null} readingType - 'one' | 'three' | 'custom' | null
 * @param {string|null} wallet - Wallet address (optional, will try to get from identity)
 */
export async function trackEvent(event, readingType = null, wallet = null) {
  if (!API_BASE) {
    if (import.meta.env.DEV) {
      console.debug('Analytics API not configured, skipping track');
    }
    return null;
  }
  
  try {
    const identity = await getUserIdentity();
    
    // Skip if no FID
    if (!identity.fid) {
      if (import.meta.env.DEV) {
        console.debug('No FID available, skipping analytics');
      }
      return null;
    }
    
    // Use provided wallet or identity wallet
    const finalWallet = wallet || identity.wallet;
    
    const response = await fetch(`${API_BASE}/api/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fid: identity.fid,
        wallet: finalWallet,
        event,
        readingType,
        clientTs: Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (import.meta.env.DEV) {
      console.debug('Analytics tracked:', { event, readingType, data });
    }
    
    return data;
  } catch (error) {
    // Fail silently in production, log in dev
    if (import.meta.env.DEV) {
      console.warn('Failed to track analytics:', error);
    }
    return null;
  }
}

/**
 * Get user stats
 * @returns {Promise<object|null>}
 */
export async function getUserStats() {
  if (!API_BASE) {
    return null;
  }
  
  try {
    const identity = await getUserIdentity();
    
    if (!identity.fid) {
      return null;
    }
    
    const response = await fetch(`${API_BASE}/api/stats?fid=${identity.fid}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Failed to get user stats:', error);
    }
    return null;
  }
}

