/**
 * geofence.js — Attendance module geofencing utilities
 *
 * Responsibilities:
 *   1. Haversine distance calculation between two GPS coordinates
 *   2. Fetching active office locations from Supabase (DB-backed, never hardcoded)
 *   3. Resolving the nearest office across multiple branches
 *   4. Acquiring the device GPS position with production-grade error handling
 *
 * Design note — why DB-backed?
 *   Office coordinates live in the `office_locations` table so Admin can
 *   update them from Settings without a code change or redeploy.
 *   This also supports multi-branch: add a row per branch, no schema change.
 */

import { supabase } from '@/lib/supabaseClient';

// ─── Named constants — no magic numbers ──────────────────────────────────────

/** WGS-84 mean Earth radius used in the Haversine formula */
const EARTH_RADIUS_METERS = 6371000;

/**
 * GPS accuracy threshold above which we warn the user.
 * If the browser reports ±100m accuracy, the user's true position could be
 * up to 100m away from reported — enough to cross a 150m geofence boundary.
 */
export const GPS_ACCURACY_WARN_THRESHOLD_METERS = 100;

/** How long to wait for GPS before giving up. 10 s is reasonable for mobile. */
const GPS_TIMEOUT_MS = 10_000;

// ─── Session-scoped in-memory cache ──────────────────────────────────────────
// Avoids a Supabase round-trip every time the check-in modal opens.
// Cleared on page reload, which is acceptable — office locations rarely change
// mid-session. Call clearOfficeLocationsCache() if Admin updates them live.
let _officeLocationsCache = null;

// ─── Haversine ───────────────────────────────────────────────────────────────

/**
 * Calculates the great-circle distance between two GPS points using the
 * Haversine formula. Used to determine whether a user is within an office
 * geofence radius before allowing a check-in.
 *
 * @param {number} lat1 - User latitude
 * @param {number} lon1 - User longitude
 * @param {number} lat2 - Office latitude
 * @param {number} lon2 - Office longitude
 * @returns {number} Distance in meters (rounded to nearest metre)
 * @throws {Error} If any argument is null, undefined, or NaN
 */
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const args = { lat1, lon1, lat2, lon2 };
  for (const [name, val] of Object.entries(args)) {
    if (val == null || typeof val !== 'number' || Number.isNaN(val)) {
      throw new Error(
        `geofence.getDistanceMeters: invalid argument "${name}" — received ${JSON.stringify(val)}`
      );
    }
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

// ─── Office location fetching ─────────────────────────────────────────────────

/**
 * Fetches active office locations from the `office_locations` Supabase table.
 *
 * Results are cached in memory for the session lifetime to avoid repeated
 * DB round-trips on every check-in attempt.
 *
 * Forward-compatible with multi-branch: multiple `is_active = true` rows
 * are supported transparently — no code change needed when SDS opens a
 * second office. Add a row to the table and this function returns both.
 *
 * @returns {Promise<Array<{id: string, name: string, latitude: number, longitude: number, radius_meters: number}>>}
 * @throws {Error} On Supabase error or if no active office locations exist
 */
export async function fetchActiveOfficeLocations() {
  if (_officeLocationsCache !== null) {
    return _officeLocationsCache;
  }

  const { data, error } = await supabase
    .from('office_locations')
    .select('id, name, latitude, longitude, radius_meters')
    .eq('is_active', true);

  if (error) {
    throw new Error(
      `geofence.fetchActiveOfficeLocations: Supabase error — ${error.message}`
    );
  }

  if (!data || data.length === 0) {
    throw new Error(
      'geofence.fetchActiveOfficeLocations: No active office locations found. ' +
        'Ask your Admin to add an entry to the office_locations table.'
    );
  }

  // Coerce DB strings to numbers — Supabase numeric columns come back as strings
  // when using the JS client with certain column types.
  _officeLocationsCache = data.map((loc) => ({
    ...loc,
    latitude: Number(loc.latitude),
    longitude: Number(loc.longitude),
    radius_meters: Number(loc.radius_meters),
  }));

  return _officeLocationsCache;
}

/**
 * Clears the in-memory office location cache.
 *
 * Call this if Admin updates office coordinates mid-session so the next
 * check-in attempt re-fetches fresh data from the DB.
 */
export function clearOfficeLocationsCache() {
  _officeLocationsCache = null;
}

// ─── Nearest office resolution ────────────────────────────────────────────────

/**
 * Resolves which active office is nearest to the user's GPS coordinates and
 * whether they are within its allowed radius.
 *
 * Multi-branch aware: iterates ALL active office_locations rows and picks
 * the nearest one. This matters the moment SDS has more than one branch —
 * we never want someone near Branch B to fail because Branch A (further away)
 * was checked first. The nearest office is the right one to evaluate against.
 *
 * @param {number} userLat - User's latitude from GPS
 * @param {number} userLon - User's longitude from GPS
 * @returns {Promise<{
 *   office: object,
 *   distanceMeters: number,
 *   isWithinRadius: boolean
 * }>}
 * @throws {Error} On invalid coordinates or DB fetch failure
 */
export async function resolveNearestOffice(userLat, userLon) {
  const parsedLat = Number(userLat);
  const parsedLon = Number(userLon);

  if (userLat == null || Number.isNaN(parsedLat)) {
    throw new Error(
      `geofence.resolveNearestOffice: invalid userLat — received ${JSON.stringify(userLat)}`
    );
  }
  if (userLon == null || Number.isNaN(parsedLon)) {
    throw new Error(
      `geofence.resolveNearestOffice: invalid userLon — received ${JSON.stringify(userLon)}`
    );
  }

  const locations = await fetchActiveOfficeLocations();

  let nearestOffice = null;
  let nearestDistance = Infinity;

  for (const loc of locations) {
    const dist = getDistanceMeters(parsedLat, parsedLon, loc.latitude, loc.longitude);
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearestOffice = loc;
    }
  }

  return {
    office: nearestOffice,
    distanceMeters: nearestDistance,
    // <= is intentional: boundary exactly equals radius_meters counts as inside.
    // This matches the SQL enforcement function: <= radius_meters
    isWithinRadius: nearestDistance <= nearestOffice.radius_meters,
  };
}

// ─── GPS acquisition ──────────────────────────────────────────────────────────

/**
 * Acquires the device's current GPS position via the browser Geolocation API.
 *
 * Configuration rationale:
 *   enableHighAccuracy: true  — request the GPS chip, not WiFi/cell triangulation
 *   timeout: 10_000           — 10 s is enough for a cold GPS fix in most conditions
 *   maximumAge: 0             — never use a cached position; stale GPS can place
 *                               the user at their previous location, bypassing geofencing
 *
 * Returns a native GeolocationPosition on success.
 * Rejects with a structured { code, message } object on failure so the caller
 * can render distinct, actionable UI per error type — not a generic "error" banner.
 *
 * @returns {Promise<GeolocationPosition>}
 * @throws {{ code: number, message: string }}
 */
export function acquireGPSPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      // code -1 is custom — not a GeolocationPositionError code
      reject({
        code: -1,
        message:
          'Your browser does not support GPS location. ' +
          'Try Chrome or Safari on a GPS-enabled device.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,

      (err) => {
        /**
         * Map all three W3C GeolocationPositionError codes to distinct,
         * actionable messages. Each tells the user exactly what happened
         * and what to do — not a generic "Something went wrong."
         *
         * Code 1 — PERMISSION_DENIED: user or OS blocked location access
         * Code 2 — POSITION_UNAVAILABLE: device cannot determine location
         * Code 3 — TIMEOUT: GPS did not respond within GPS_TIMEOUT_MS
         */
        const MESSAGES = {
          1:
            'Location access was blocked. Open your browser site settings, ' +
            'allow location for this site, then try again. ' +
            'If this keeps happening, contact Admin — your device may have GPS ' +
            'disabled at the OS level.',
          2:
            'Your device cannot determine its current location right now. ' +
            'Move to an open area or near a window and try again.',
          3:
            `GPS signal timed out after ${GPS_TIMEOUT_MS / 1000} seconds. ` +
            'Move closer to a window, enable your device GPS, then retry.',
        };

        reject({
          code: err.code,
          message:
            MESSAGES[err.code] ??
            `Location error (code ${err.code}): ${err.message}`,
        });
      },

      {
        enableHighAccuracy: true,
        timeout: GPS_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  });
}
