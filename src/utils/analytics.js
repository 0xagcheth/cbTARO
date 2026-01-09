/**
 * Analytics utility for tracking user statistics
 */

import { updateStreakOnVisit, getDayKeyWithCutoff } from './streak.js';

const API_BASE = import.meta.env.VITE_ANALYTICS_API_BASE || '';
export const ADMIN_WALLET = '0x35895ba5c7646A0599419F0339b9C4355b5FF736';

// Local storage key for stats
const STATS_STORAGE_KEY = 'cbTARO_stats_v1';

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

// ============================================================================
// Local Storage Statistics (for offline tracking and CSV export)
// ============================================================================

/**
 * Get stats key for a user
 * @param {number|null} fid - Farcaster ID
 * @param {string|null} wallet - Wallet address
 * @returns {string} - Storage key
 */
export function getStatsKey(fid, wallet) {
  if (fid) {
    return `fid:${fid}`;
  }
  if (wallet) {
    return `wallet:${wallet.toLowerCase()}`;
  }
  return 'anon:default';
}

/**
 * Load stats from localStorage
 * @returns {Object} - Stats object with version and rows
 */
export function loadStats() {
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (!stored) {
      return { version: 1, rows: {} };
    }
    const parsed = JSON.parse(stored);
    return {
      version: parsed.version || 1,
      rows: parsed.rows || {}
    };
  } catch (error) {
    console.warn('Failed to load stats from localStorage:', error);
    return { version: 1, rows: {} };
  }
}

/**
 * Save stats to localStorage
 * @param {Object} stats - Stats object with version and rows
 */
export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('Failed to save stats to localStorage:', error);
  }
}

/**
 * Track visit event (local storage)
 * @param {Object} options - Visit options
 * @param {number|null} options.fid - Farcaster ID
 * @param {string|null} options.wallet - Wallet address
 */
export function trackVisit({ fid = null, wallet = null }) {
  try {
    const stats = loadStats();
    const key = getStatsKey(fid, wallet);
    const now = Date.now();
    const dayKey = getDayKeyWithCutoff();
    
    // Update streak
    const streak = updateStreakOnVisit();
    
    // Get or create user row
    const existing = stats.rows[key] || {
      fid: null,
      wallet: null,
      readings_total: 0,
      readings_one: 0,
      readings_three: 0,
      readings_custom: 0,
      streak: 0,
      last_visit_day_key: null,
      last_seen_ts: null
    };
    
    // Update visit data
    stats.rows[key] = {
      ...existing,
      fid: fid || existing.fid,
      wallet: (wallet || existing.wallet)?.toLowerCase() || null,
      streak: streak,
      last_visit_day_key: dayKey,
      last_seen_ts: now
    };
    
    saveStats(stats);
    
    if (import.meta.env.DEV) {
      console.debug('Tracked visit:', { key, streak, dayKey });
    }
  } catch (error) {
    console.warn('Failed to track visit:', error);
  }
}

/**
 * Track reading event (local storage)
 * @param {Object} options - Reading options
 * @param {number|null} options.fid - Farcaster ID
 * @param {string|null} options.wallet - Wallet address
 * @param {string} options.type - Reading type: 'one' | 'three' | 'custom'
 */
export function trackReading({ fid = null, wallet = null, type }) {
  if (!['one', 'three', 'custom'].includes(type)) {
    console.warn('Invalid reading type:', type);
    return;
  }
  
  try {
    const stats = loadStats();
    const key = getStatsKey(fid, wallet);
    const now = Date.now();
    
    // Get or create user row
    const existing = stats.rows[key] || {
      fid: null,
      wallet: null,
      readings_total: 0,
      readings_one: 0,
      readings_three: 0,
      readings_custom: 0,
      streak: 0,
      last_visit_day_key: null,
      last_seen_ts: null
    };
    
    // Update reading counts
    stats.rows[key] = {
      ...existing,
      fid: fid || existing.fid,
      wallet: (wallet || existing.wallet)?.toLowerCase() || null,
      readings_total: (existing.readings_total || 0) + 1,
      readings_one: type === 'one' ? (existing.readings_one || 0) + 1 : (existing.readings_one || 0),
      readings_three: type === 'three' ? (existing.readings_three || 0) + 1 : (existing.readings_three || 0),
      readings_custom: type === 'custom' ? (existing.readings_custom || 0) + 1 : (existing.readings_custom || 0),
      last_seen_ts: now
    };
    
    saveStats(stats);
    
    if (import.meta.env.DEV) {
      console.debug('Tracked reading:', { key, type });
    }
  } catch (error) {
    console.warn('Failed to track reading:', error);
  }
}

/**
 * Get all stats rows
 * @returns {Array} - Array of stat rows
 */
export function getStatsRows() {
  const stats = loadStats();
  return Object.entries(stats.rows).map(([key, row]) => ({
    key,
    ...row
  }));
}

/**
 * Build CSV from stats rows
 * @param {Array} rows - Stats rows
 * @returns {string} - CSV string
 */
export function buildCsv(rows) {
  const headers = [
    'key',
    'fid',
    'wallet',
    'readings_total',
    'readings_one',
    'readings_three',
    'readings_custom',
    'streak',
    'last_visit_day_key',
    'last_seen_ts'
  ];
  
  const csvRows = [headers.join(',')];
  
  // Sort by last_seen_ts desc
  const sorted = [...rows].sort((a, b) => {
    const tsA = a.last_seen_ts || 0;
    const tsB = b.last_seen_ts || 0;
    return tsB - tsA;
  });
  
  for (const row of sorted) {
    const values = [
      `"${row.key || ''}"`,
      row.fid || '',
      `"${row.wallet || ''}"`,
      row.readings_total || 0,
      row.readings_one || 0,
      row.readings_three || 0,
      row.readings_custom || 0,
      row.streak || 0,
      `"${row.last_visit_day_key || ''}"`,
      row.last_seen_ts || ''
    ];
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Download stats CSV
 * @param {Object} options - Download options
 * @param {boolean} [options.onlyAdminRow] - Only include admin row (not used, for compatibility)
 */
export function downloadStatsCsv({ onlyAdminRow = false } = {}) {
  try {
    const rows = getStatsRows();
    const csv = buildCsv(rows);
    
    // Generate filename with date
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const filename = `cbTARO_stats_${dateStr}.csv`;
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (import.meta.env.DEV) {
      console.debug('Downloaded stats CSV:', filename, rows.length, 'rows');
    }
  } catch (error) {
    console.error('Failed to download stats CSV:', error);
    throw error;
  }
}

