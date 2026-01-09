/**
 * Analytics utility for tracking user statistics
 */

const API_BASE = import.meta.env.VITE_ANALYTICS_API_BASE || '';
export const ADMIN_WALLET = '0x35895ba5c7646A0599419F0339b9C4355b5FF736';

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

/**
 * Check if wallet is admin
 * @param {string|null} wallet - Wallet address
 * @returns {boolean}
 */
export function isAdminWallet(wallet) {
  if (!wallet) return false;
  return wallet.toLowerCase() === ADMIN_WALLET.toLowerCase();
}

/**
 * Get all admin stats (requires admin wallet)
 * @param {string} wallet - Admin wallet address
 * @returns {Promise<Array|null>}
 */
export async function getAdminStats(wallet) {
  if (!API_BASE) {
    return null;
  }
  
  if (!isAdminWallet(wallet)) {
    throw new Error('Unauthorized: Admin wallet required');
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/stats?wallet=${encodeURIComponent(wallet)}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Unauthorized: Admin wallet required');
      }
      throw new Error(`Admin stats API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to get admin stats:', error);
    }
    throw error;
  }
}

/**
 * Export admin stats as CSV (requires admin wallet)
 * @param {string} wallet - Admin wallet address
 * @returns {Promise<Blob|null>}
 */
export async function exportAdminCSV(wallet) {
  if (!API_BASE) {
    return null;
  }
  
  if (!isAdminWallet(wallet)) {
    throw new Error('Unauthorized: Admin wallet required');
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/export.csv?wallet=${encodeURIComponent(wallet)}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Unauthorized: Admin wallet required');
      }
      throw new Error(`Export CSV API error: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to export admin CSV:', error);
    }
    throw error;
  }
}

