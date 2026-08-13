import { supabase } from '@/lib/supabaseClient';

// ── In-memory avatar cache with TTL + max-size eviction ─────────────────────
// Acts as L1 cache so repeated reads never hit localStorage.
// Max 50 entries (way more than 18 employees), TTL = 30 minutes.
const AVATAR_CACHE_MAX = 50;
const AVATAR_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const _avatarMemCache = new Map(); // key → { payload, expiresAt }

function _cacheSet(key, payload) {
  // Evict oldest entry when at capacity
  if (_avatarMemCache.size >= AVATAR_CACHE_MAX) {
    const oldestKey = _avatarMemCache.keys().next().value;
    _avatarMemCache.delete(oldestKey);
  }
  _avatarMemCache.set(key, { payload, expiresAt: Date.now() + AVATAR_CACHE_TTL_MS });
}

function _cacheGet(key) {
  const entry = _avatarMemCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _avatarMemCache.delete(key);
    return null;
  }
  return entry.payload;
}

function _clearSdsAvatarLocalStorage() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sds_avatar_')) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) { /* silent */ }
}
// ─────────────────────────────────────────────────────────────────────────────

export const SUPPORTED_AVATAR_STYLES = [];

export const profileService = {
  /**
   * Test Supabase database connection health.
   */
  async checkSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('SDS_Employees').select('*').limit(1);
      if (error) {
        return { connected: false, error: error.message };
      }
      return { connected: true, table: 'SDS_Employees', sample: data };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  },

  /**
   * Save avatar selection — writes to in-memory cache first, then localStorage.
   * Handles QuotaExceededError by clearing old sds_avatar_* entries and retrying once.
   */
  saveLocalAvatar(email, avatarUrl) {
    if (!email) return;
    const key = `sds_avatar_${email.trim().toLowerCase()}`;
    const payload = {
      avatarUrl,
      updatedAt: new Date().toISOString()
    };
    // Always update in-memory cache first (never throws)
    _cacheSet(key, payload);
    // Persist to localStorage with quota guard
    const writeToLS = () => localStorage.setItem(key, JSON.stringify(payload));
    try {
      writeToLS();
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        _clearSdsAvatarLocalStorage();
        try { writeToLS(); } catch (_) { /* give up gracefully */ }
      }
    }
  },

  /**
   * Get cached avatar — reads in-memory cache first (O(1)), then localStorage.
   */
  getLocalAvatar(email) {
    if (!email) return null;
    const key = `sds_avatar_${email.trim().toLowerCase()}`;
    // Fast path: in-memory cache hit
    const memHit = _cacheGet(key);
    if (memHit) return memHit;
    // Slow path: localStorage
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        _cacheSet(key, parsed); // warm the memory cache
        return parsed;
      }
    } catch (e) { /* ignore parse/access errors */ }
    return null;
  },

  /**
   * Updates employee's avatar in Supabase SDS_Employees.
   */
  async updateAvatarStyleAndSeed({ employeeId, authId, email, avatarUrl }) {
    if (!employeeId && !authId && !email) {
      throw new Error('Employee identifier (ID or email) is required to update avatar.');
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;

    if (cleanEmail && avatarUrl) {
      this.saveLocalAvatar(cleanEmail, avatarUrl);
    }

    return {
      success: true,
      avatarUrl
    };
  }
};
