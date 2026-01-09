/**
 * Daily streak utility
 * Handles dayKey calculation with UTC cutoff and streak management
 */

const STREAK_KEY = "cbTARO_streak";
const LAST_VISIT_KEY = "cbTARO_lastVisitDayKey";
const CUTOFF_HOUR_UTC = 1;

/**
 * Get dayKey with UTC cutoff (day boundary at 01:00 UTC)
 * @param {Date} dateNow - Current date (defaults to now)
 * @param {number} cutoffHourUTC - Hour for day cutoff (defaults to 1)
 * @returns {string} - Day key in format "YYYY-MM-DD"
 */
export function getDayKeyWithCutoff(dateNow = new Date(), cutoffHourUTC = CUTOFF_HOUR_UTC) {
  // Shift time back by cutoff hours to adjust day boundary
  const shifted = new Date(dateNow.getTime() - cutoffHourUTC * 3600 * 1000);
  
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Calculate days between two dayKeys (b - a)
 * @param {string} a - First dayKey (YYYY-MM-DD)
 * @param {string} b - Second dayKey (YYYY-MM-DD)
 * @returns {number} - Number of days (b - a)
 */
export function daysBetweenDayKeys(a, b) {
  const parseDayKey = (dayKey) => {
    const [year, month, day] = dayKey.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };
  
  const dateA = parseDayKey(a);
  const dateB = parseDayKey(b);
  
  const diffMs = dateB.getTime() - dateA.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Update streak on visit
 * @returns {number} - Current streak value
 */
export function updateStreakOnVisit() {
  const currentDayKey = getDayKeyWithCutoff();
  
  // Read from localStorage
  const savedStreak = localStorage.getItem(STREAK_KEY);
  const savedLastVisit = localStorage.getItem(LAST_VISIT_KEY);
  
  let streak = savedStreak ? parseInt(savedStreak, 10) : 0;
  const lastVisitDayKey = savedLastVisit || null;
  
  // First visit ever
  if (!lastVisitDayKey) {
    streak = 1;
    localStorage.setItem(STREAK_KEY, streak.toString());
    localStorage.setItem(LAST_VISIT_KEY, currentDayKey);
    
    if (import.meta.env.DEV) {
      console.debug('Streak: First visit, streak = 1');
    }
    return streak;
  }
  
  // Same day - no change
  if (lastVisitDayKey === currentDayKey) {
    if (import.meta.env.DEV) {
      console.debug('Streak: Same day, streak unchanged =', streak);
    }
    return streak;
  }
  
  // Calculate days difference
  const daysDiff = daysBetweenDayKeys(lastVisitDayKey, currentDayKey);
  
  if (daysDiff === 1) {
    // Consecutive day - increment streak
    streak += 1;
    localStorage.setItem(STREAK_KEY, streak.toString());
    localStorage.setItem(LAST_VISIT_KEY, currentDayKey);
    
    if (import.meta.env.DEV) {
      console.debug('Streak: Consecutive day, streak =', streak);
    }
  } else if (daysDiff > 1) {
    // Gap of more than 1 day - reset streak
    streak = 1;
    localStorage.setItem(STREAK_KEY, streak.toString());
    localStorage.setItem(LAST_VISIT_KEY, currentDayKey);
    
    if (import.meta.env.DEV) {
      console.debug('Streak: Gap detected, reset to 1');
    }
  } else {
    // daysDiff < 0 (shouldn't happen, but handle gracefully)
    if (import.meta.env.DEV) {
      console.debug('Streak: Unexpected dayKey order');
    }
  }
  
  return streak;
}

/**
 * Get current streak without updating
 * @returns {number} - Current streak value
 */
export function getCurrentStreak() {
  const savedStreak = localStorage.getItem(STREAK_KEY);
  return savedStreak ? parseInt(savedStreak, 10) : 0;
}

