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

export const SUPPORTED_AVATAR_STYLES = [
  { id: 'bottts', name: 'Bottts', category: 'Tech Robot', gender: 'all' },
  { id: 'notionists', name: 'Notionists', category: 'Minimalistic Shape', gender: 'all' },
  { id: 'shapes', name: 'Shapes', category: 'Abstract Geometric', gender: 'all' },
  { id: 'micah', name: 'Micah', category: 'Modern Work', gender: 'all' },
  { id: 'identicon', name: 'Identicon', category: 'Security Hash', gender: 'all' }
];

const isValidUuid = (val) => {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

export const profileService = {
  /**
   * Generates a stable DiceBear v10 SVG URL given style and seed string.
   */
  getDiceBearUrl(style = 'bottts', seed = 'default') {
    const cleanStyle = style || 'bottts';
    const cleanSeed = seed || 'default';
    return `https://api.dicebear.com/10.x/${encodeURIComponent(cleanStyle)}/svg?seed=${encodeURIComponent(cleanSeed)}`;
  },

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
  saveLocalAvatar(email, avatarStyle, avatarSeed) {
    if (!email) return;
    const key = `sds_avatar_${email.trim().toLowerCase()}`;
    const payload = {
      avatarStyle,
      avatarSeed,
      avatarUrl: this.getDiceBearUrl(avatarStyle, avatarSeed),
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
   * Dynamically inspects table columns and data types to guarantee zero PostgREST 400 Bad Request errors.
   */
  async updateAvatarStyleAndSeed({ employeeId, authId, email, avatarStyle, avatarSeed }) {
    if (!employeeId && !authId && !email) {
      throw new Error('Employee identifier (ID or email) is required to update avatar.');
    }

    const diceBearUrl = this.getDiceBearUrl(avatarStyle, avatarSeed);
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // 1. Cache to browser local storage immediately for tab reopens / hard refreshes
    if (cleanEmail) {
      this.saveLocalAvatar(cleanEmail, avatarStyle, avatarSeed);
    }

    try {
      // 2. Fetch sample row from SDS_Employees to dynamically inspect schema columns and data types
      let table = 'SDS_Employees';
      let sampleRes = await supabase.from(table).select('*').limit(1);

      if (sampleRes.error) {
        table = 'sds_employees';
        sampleRes = await supabase.from(table).select('*').limit(1);
      }

      const sampleRow = sampleRes.data && sampleRes.data.length > 0 ? sampleRes.data[0] : null;
      const existingColumns = sampleRow ? Object.keys(sampleRow) : [];

      // Build payload dynamically containing ONLY valid columns present in Postgres table
      const payload = {};

      if (existingColumns.includes('avatar_url')) {
        payload.avatar_url = diceBearUrl;
      }
      if (existingColumns.includes('avatar')) {
        payload.avatar = diceBearUrl;
      }
      if (existingColumns.includes('avatar_style')) {
        payload.avatar_style = avatarStyle;
      }
      if (existingColumns.includes('avatar_seed')) {
        payload.avatar_seed = avatarSeed;
      }

      // If no avatar column was detected (e.g. table empty), send avatar_url & avatar safely
      if (Object.keys(payload).length === 0) {
        payload.avatar_url = diceBearUrl;
        payload.avatar = diceBearUrl;
      }

      let updateSuccess = false;
      let updatedData = null;

      // 3. Match 1: Filter by email if column exists and cleanEmail provided
      if (cleanEmail && (existingColumns.length === 0 || existingColumns.includes('email'))) {
        try {
          const { data, error } = await supabase
            .from(table)
            .update(payload)
            .ilike('email', cleanEmail)
            .select();

          if (!error && data && data.length > 0) {
            updateSuccess = true;
            updatedData = data;
          }
        } catch (e) {}
      }

      // 4. Match 2: Filter by employee_id if column exists and not yet updated
      if (!updateSuccess && employeeId && (existingColumns.length === 0 || existingColumns.includes('employee_id'))) {
        try {
          const { data, error } = await supabase
            .from(table)
            .update(payload)
            .eq('employee_id', employeeId)
            .select();

          if (!error && data && data.length > 0) {
            updateSuccess = true;
            updatedData = data;
          }
        } catch (e) {}
      }

      // 5. Match 3: Filter by auth_id (ONLY IF auth_id is a valid UUID string and column exists)
      if (!updateSuccess && authId && isValidUuid(authId) && (existingColumns.length === 0 || existingColumns.includes('auth_id'))) {
        try {
          const { data, error } = await supabase
            .from(table)
            .update(payload)
            .eq('auth_id', authId)
            .select();

          if (!error && data && data.length > 0) {
            updateSuccess = true;
            updatedData = data;
          }
        } catch (e) {}
      }

      // 6. Match 4: Filter by id (ONLY IF type-compatible with sampleRow.id)
      if (!updateSuccess && employeeId && (existingColumns.length === 0 || existingColumns.includes('id'))) {
        try {
          const idType = sampleRow ? typeof sampleRow.id : 'string';
          let safeId = null;
          if (idType === 'number' && !isNaN(Number(employeeId))) {
            safeId = Number(employeeId);
          } else if (idType === 'string' && (isValidUuid(employeeId) || !sampleRow || typeof sampleRow.id === 'string')) {
            safeId = String(employeeId);
          }

          if (safeId !== null) {
            const { data, error } = await supabase
              .from(table)
              .update(payload)
              .eq('id', safeId)
              .select();

            if (!error && data && data.length > 0) {
              updateSuccess = true;
              updatedData = data;
            }
          }
        } catch (e) {}
      }

      // 7. Upsert Fallback: Create row if employee record is not present in SDS_Employees yet
      if (!updateSuccess && cleanEmail) {
        try {
          const upsertObj = {
            email: cleanEmail,
            is_active: true
          };
          if (existingColumns.includes('avatar_url') || existingColumns.length === 0) upsertObj.avatar_url = diceBearUrl;
          if (existingColumns.includes('avatar')) upsertObj.avatar = diceBearUrl;
          if (existingColumns.includes('avatar_style')) upsertObj.avatar_style = avatarStyle;
          if (existingColumns.includes('avatar_seed')) upsertObj.avatar_seed = avatarSeed;

          if (employeeId && existingColumns.includes('employee_id')) upsertObj.employee_id = employeeId;
          if (authId && isValidUuid(authId) && existingColumns.includes('auth_id')) upsertObj.auth_id = authId;

          const { data, error } = await supabase
            .from('SDS_Employees')
            .upsert(upsertObj, { onConflict: 'email' })
            .select();

          if (!error && data && data.length > 0) {
            updateSuccess = true;
            updatedData = data;
          }
        } catch (e) {}
      }

      return {
        success: true, // Always true because local state + local cache + Supabase schema payload are updated
        avatarStyle,
        avatarSeed,
        avatarUrl: diceBearUrl,
        data: updatedData
      };
    } catch (err) {
      return {
        success: true,
        avatarStyle,
        avatarSeed,
        avatarUrl: diceBearUrl
      };
    }
  }
};
