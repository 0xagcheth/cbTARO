/**
 * Cloudflare Worker for cbTARO analytics
 * Tracks user statistics by FID
 */

const ALLOWED_ORIGIN = 'https://0xagcheth.github.io';
const CUTOFF_HOUR_UTC = 1;

/**
 * Get dayKey with UTC cutoff (day boundary at 01:00 UTC)
 */
function getDayKeyWithCutoff(dateNow = new Date()) {
  const shifted = new Date(dateNow.getTime() - CUTOFF_HOUR_UTC * 3600 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get previous day key
 */
function getPreviousDayKey(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  const prevYear = date.getUTCFullYear();
  const prevMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const prevDay = String(date.getUTCDate()).padStart(2, '0');
  return `${prevYear}-${prevMonth}-${prevDay}`;
}

/**
 * Calculate days between two dayKeys
 */
function daysBetweenDayKeys(a, b) {
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
 * Handle CORS
 */
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  const headers = new Headers();
  
  if (origin === ALLOWED_ORIGIN) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  return headers;
}

/**
 * Handle OPTIONS preflight
 */
function handleOptions() {
  const headers = handleCORS(new Request(''));
  return new Response(null, { headers, status: 204 });
}

/**
 * Track event
 */
async function handleTrack(request, env) {
  try {
    const body = await request.json();
    const { fid, wallet, event, readingType, clientTs } = body;
    
    // Validation
    if (!fid || typeof fid !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid fid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
      });
    }
    
    if (event !== 'visit' && event !== 'reading') {
      return new Response(JSON.stringify({ error: 'Invalid event' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
      });
    }
    
    if (event === 'reading' && !['one', 'three', 'custom'].includes(readingType)) {
      return new Response(JSON.stringify({ error: 'Invalid readingType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
      });
    }
    
    const now = Date.now();
    const dayKey = getDayKeyWithCutoff(new Date(now));
    
    // Get existing record
    const existing = await env.DB.prepare(
      'SELECT * FROM user_stats WHERE fid = ?'
    ).bind(fid).first();
    
    if (!existing) {
      // Create new record
      await env.DB.prepare(`
        INSERT INTO user_stats (
          fid, wallet, total_readings, one_card_count, three_card_count,
          custom_count, streak, last_visit_day_key, first_seen_ts, last_seen_ts
        ) VALUES (?, ?, 0, 0, 0, 0, 1, ?, ?, ?)
      `).bind(fid, wallet || null, dayKey, now, now).run();
      
      const newRecord = await env.DB.prepare(
        'SELECT * FROM user_stats WHERE fid = ?'
      ).bind(fid).first();
      
      return new Response(JSON.stringify({
        fid: newRecord.fid,
        wallet: newRecord.wallet,
        total_readings: newRecord.total_readings,
        one_card_count: newRecord.one_card_count,
        three_card_count: newRecord.three_card_count,
        custom_count: newRecord.custom_count,
        streak: newRecord.streak,
        last_visit_day_key: newRecord.last_visit_day_key
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
      });
    }
    
    // Update existing record
    let streak = existing.streak;
    let lastVisitDayKey = existing.last_visit_day_key;
    
    if (event === 'visit') {
      // Update streak logic
      if (lastVisitDayKey === dayKey) {
        // Same day - no change
        streak = existing.streak;
      } else {
        const daysDiff = daysBetweenDayKeys(lastVisitDayKey, dayKey);
        if (daysDiff === 1) {
          // Consecutive day
          streak = existing.streak + 1;
        } else if (daysDiff > 1) {
          // Gap detected - reset
          streak = 1;
        }
        lastVisitDayKey = dayKey;
      }
    }
    
    // Update reading counts if event is reading
    let totalReadings = existing.total_readings;
    let oneCardCount = existing.one_card_count;
    let threeCardCount = existing.three_card_count;
    let customCount = existing.custom_count;
    
    if (event === 'reading') {
      totalReadings = existing.total_readings + 1;
      if (readingType === 'one') {
        oneCardCount = existing.one_card_count + 1;
      } else if (readingType === 'three') {
        threeCardCount = existing.three_card_count + 1;
      } else if (readingType === 'custom') {
        customCount = existing.custom_count + 1;
      }
    }
    
    // Update wallet if provided and different
    const updatedWallet = wallet && wallet !== existing.wallet ? wallet : existing.wallet;
    
    // Update record
    await env.DB.prepare(`
      UPDATE user_stats SET
        wallet = ?,
        total_readings = ?,
        one_card_count = ?,
        three_card_count = ?,
        custom_count = ?,
        streak = ?,
        last_visit_day_key = ?,
        last_seen_ts = ?
      WHERE fid = ?
    `).bind(
      updatedWallet || null,
      totalReadings,
      oneCardCount,
      threeCardCount,
      customCount,
      streak,
      lastVisitDayKey,
      now,
      fid
    ).run();
    
    // Return updated record
    const updated = await env.DB.prepare(
      'SELECT * FROM user_stats WHERE fid = ?'
    ).bind(fid).first();
    
    return new Response(JSON.stringify({
      fid: updated.fid,
      wallet: updated.wallet,
      total_readings: updated.total_readings,
      one_card_count: updated.one_card_count,
      three_card_count: updated.three_card_count,
      custom_count: updated.custom_count,
      streak: updated.streak,
      last_visit_day_key: updated.last_visit_day_key
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
    });
    
  } catch (error) {
    console.error('Track error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
    });
  }
}

/**
 * Get stats
 */
async function handleGetStats(request, env) {
  try {
    const url = new URL(request.url);
    const fid = url.searchParams.get('fid');
    
    if (!fid) {
      return new Response(JSON.stringify({ error: 'Missing fid parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
      });
    }
    
    const record = await env.DB.prepare(
      'SELECT * FROM user_stats WHERE fid = ?'
    ).bind(parseInt(fid, 10)).first();
    
    if (!record) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
      });
    }
    
    return new Response(JSON.stringify({
      fid: record.fid,
      wallet: record.wallet,
      total_readings: record.total_readings,
      one_card_count: record.one_card_count,
      three_card_count: record.three_card_count,
      custom_count: record.custom_count,
      streak: record.streak,
      last_visit_day_key: record.last_visit_day_key,
      first_seen_ts: record.first_seen_ts,
      last_seen_ts: record.last_seen_ts
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...handleCORS(request) }
    });
  }
}

/**
 * Main handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    // Route handling
    if (url.pathname === '/api/track' && request.method === 'POST') {
      return handleTrack(request, env);
    }
    
    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleGetStats(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

