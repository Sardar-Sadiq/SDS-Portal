'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  SignalLow,
  RefreshCw,
} from 'lucide-react';
import {
  acquireGPSPosition,
  resolveNearestOffice,
  GPS_ACCURACY_WARN_THRESHOLD_METERS,
} from '../geofence';

// ─── State enums ─────────────────────────────────────────────────────────────
// Using plain objects instead of TypeScript enums — matches project's JS convention.
// Explicit enum prevents scattered string literals from drifting out of sync.

/** Tracks GPS acquisition lifecycle */
const GPS_STATE = Object.freeze({
  IDLE: 'IDLE',           // Not yet attempted
  ACQUIRING: 'ACQUIRING', // navigator.geolocation in flight — UI should show spinner
  READY: 'READY',         // Good fix acquired (accuracy <= threshold)
  WEAK: 'WEAK',           // Fix acquired but accuracy is poor — warn, don't block
});

/** Feedback banner variants */
const FB = Object.freeze({
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
});

// ─── Component ────────────────────────────────────────────────────────────────

export const GeoCheckInModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    officeSettings,
    attendanceRecords,
    checkIn,
    checkOut,
  } = useStore();

  // GPS lifecycle
  const [gpsState, setGpsState] = useState(GPS_STATE.IDLE);
  const [gpsPosition, setGpsPosition] = useState(null);     // GeolocationPosition
  const [officeResult, setOfficeResult] = useState(null);   // resolveNearestOffice result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: '' });

  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayRecord = attendanceRecords.find(
    (a) => a.employeeId === currentUser?.employeeId && a.date === todayStr
  );

  // Reset all transient state when the modal closes so the next open is fresh
  useEffect(() => {
    if (!isOpen) {
      setGpsState(GPS_STATE.IDLE);
      setGpsPosition(null);
      setOfficeResult(null);
      setFeedback({ type: null, message: '' });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  /**
   * Acquires GPS and resolves the nearest office.
   *
   * Separated from the actual check-in action so the user can see their
   * distance and accuracy before committing — informed consent over silent magic.
   */
  const handleAcquireGPS = useCallback(async () => {
    setGpsState(GPS_STATE.ACQUIRING);
    setFeedback({ type: null, message: '' });
    setOfficeResult(null);
    setGpsPosition(null);

    try {
      const position = await acquireGPSPosition();
      const { latitude, longitude, accuracy } = position.coords;

      // Accuracy check: warn if reported accuracy is worse than our threshold.
      // We don't block — the user might still be well within the radius —
      // but we surface it honestly so they can choose to retry with better GPS.
      const isWeakSignal = accuracy > GPS_ACCURACY_WARN_THRESHOLD_METERS;
      setGpsState(isWeakSignal ? GPS_STATE.WEAK : GPS_STATE.READY);
      setGpsPosition(position);

      // Resolve against the DB-backed office_locations table (multi-branch aware)
      const result = await resolveNearestOffice(latitude, longitude);
      setOfficeResult(result);

      if (isWeakSignal) {
        setFeedback({
          type: FB.WARNING,
          message:
            `Your GPS accuracy is ±${Math.round(accuracy)}m — the signal is weak. ` +
            'Try moving near a window or enabling GPS on your device for a more reliable reading. ' +
            'You can still proceed if you are within the office radius.',
        });
      }
    } catch (err) {
      // err is { code, message } from acquireGPSPosition — already user-readable
      setGpsState(GPS_STATE.IDLE);
      setFeedback({ type: FB.ERROR, message: err.message ?? 'Failed to acquire GPS location.' });
    }
  }, []);

  /**
   * Executes check-in after GPS is confirmed.
   *
   * Client-side radius check is a UX gate — it shows an actionable error
   * before even attempting the DB insert. The real enforcement is the
   * `is_within_office_radius` trigger on the attendance table in Supabase,
   * which rejects inserts from fabricated coordinates that pass client checks.
   */
  const handleCheckIn = useCallback(async () => {
    if (!gpsPosition || !officeResult) return;

    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    const { latitude, longitude, accuracy } = gpsPosition.coords;

    // Client-side UX check — reject outside radius with exact overage
    // so the message is actionable, not vague ("you are outside the office")
    if (!officeResult.isWithinRadius) {
      const overage = officeResult.distanceMeters - officeResult.office.radius_meters;
      setFeedback({
        type: FB.ERROR,
        message:
          `You are ${officeResult.distanceMeters}m from ${officeResult.office.name}, ` +
          `which is ${overage}m beyond the allowed ${officeResult.office.radius_meters}m radius. ` +
          'Move closer to the office and re-acquire GPS to try again.',
      });
      setIsSubmitting(false);
      return;
    }

    // Pass enriched coords to store checkIn — includes accuracy & distance for audit trail.
    // The store also runs its own distance check against officeSettings (belt-and-suspenders).
    const result = checkIn({
      lat: latitude,
      lng: longitude,
      accuracyMeters: Math.round(accuracy),
      distanceFromOfficeMeters: officeResult.distanceMeters,
      officeName: officeResult.office.name,
    });

    setFeedback({
      type: result.success ? FB.SUCCESS : FB.ERROR,
      message: result.message,
    });
    setIsSubmitting(false);
  }, [gpsPosition, officeResult, checkIn]);

  /** Records check-out. No GPS required — user is leaving, not arriving. */
  const handleCheckOut = useCallback(() => {
    setIsSubmitting(true);
    const result = checkOut();
    setFeedback({
      type: result.success ? FB.SUCCESS : FB.ERROR,
      message: result.message,
    });
    setIsSubmitting(false);
  }, [checkOut]);

  // Derived display values — fall back to local officeSettings while DB hasn't loaded yet
  const displayOfficeName = officeResult?.office?.name ?? officeSettings.geoFence.address;
  const displayRadius = officeResult?.office?.radius_meters ?? officeSettings.geoFence.radiusMeters;
  const gpsInFlight = gpsState === GPS_STATE.ACQUIRING;
  const gpsAcquired = gpsState === GPS_STATE.READY || gpsState === GPS_STATE.WEAK;
  const accuracyMeters = gpsPosition ? Math.round(gpsPosition.coords.accuracy) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GPS Attendance Verification"
      description="Real-time geofence check-in with live location validation"
    >
      <div className="space-y-4">

        {/* ── Office Info ────────────────────────────────────────────────── */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 truncate">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              {displayOfficeName}
            </span>
            <Badge variant="accent" className="shrink-0">Radius: {displayRadius}m</Badge>
          </div>
          <div className="text-xs text-neutral-500 space-y-0.5">
            <p>
              <strong>Office Hours:</strong>{' '}
              {officeSettings.officeStartTime} – {officeSettings.officeEndTime}
            </p>
            <p>
              <strong>Grace Period:</strong> {officeSettings.gracePeriodMinutes} mins
            </p>
          </div>
        </div>

        {/* ── Today's Status ─────────────────────────────────────────────── */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">
              Today's Status
            </span>
            <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
              {userTodayRecord?.checkIn ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Checked In · {userTodayRecord.checkIn}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Not Checked In Yet</span>
              )}
            </p>
            {userTodayRecord?.checkOut && (
              <p className="text-xs text-neutral-500 mt-0.5">
                Checked out: {userTodayRecord.checkOut} · {userTodayRecord.workingHours} hrs logged
              </p>
            )}
          </div>
          <Badge
            variant={
              userTodayRecord?.isLate
                ? 'warning'
                : userTodayRecord?.checkIn
                ? 'success'
                : 'neutral'
            }
          >
            {userTodayRecord?.status || 'PENDING'}
          </Badge>
        </div>

        {/* ── GPS Acquisition Panel (only for check-in / before checkout) ── */}
        {!userTodayRecord?.checkOut && (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card space-y-3">
            {/* Status row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                GPS Location Status
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                  gpsState === GPS_STATE.READY
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : gpsState === GPS_STATE.WEAK
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : gpsState === GPS_STATE.ACQUIRING
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {gpsState === GPS_STATE.ACQUIRING
                  ? 'ACQUIRING…'
                  : gpsState === GPS_STATE.READY
                  ? 'LOCKED ✓'
                  : gpsState === GPS_STATE.WEAK
                  ? 'WEAK SIGNAL ⚠'
                  : 'NOT ACQUIRED'}
              </span>
            </div>

            {/* Distance & accuracy details — shown after GPS is acquired */}
            {officeResult && (
              <div className="space-y-1.5 text-xs border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Distance from {officeResult.office.name}:</span>
                  <span
                    className={`font-mono font-bold ${
                      officeResult.isWithinRadius
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {officeResult.distanceMeters}m
                    {officeResult.isWithinRadius ? ' · Within radius ✓' : ' · Outside radius ✗'}
                  </span>
                </div>
                {accuracyMeters !== null && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>GPS Accuracy:</span>
                    <span
                      className={`font-mono font-bold ${
                        accuracyMeters > GPS_ACCURACY_WARN_THRESHOLD_METERS
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      ±{accuracyMeters}m
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* GPS in-flight spinner */}
            {gpsInFlight && (
              <div className="flex items-center justify-center gap-2 py-1 text-xs text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Acquiring GPS signal — hold still…</span>
              </div>
            )}

            {/* Acquire / Re-acquire button */}
            {!gpsInFlight && (
              <Button
                onClick={handleAcquireGPS}
                variant="outline"
                className="w-full text-xs"
                disabled={gpsInFlight}
              >
                {gpsAcquired ? (
                  <><RefreshCw className="w-3.5 h-3.5" /> Re-Acquire GPS</>
                ) : (
                  <><MapPin className="w-3.5 h-3.5" /> Acquire GPS Location</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* ── Feedback Banner ────────────────────────────────────────────── */}
        {feedback.message && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 leading-relaxed ${
              feedback.type === FB.SUCCESS
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : feedback.type === FB.WARNING
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {feedback.type === FB.SUCCESS ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : feedback.type === FB.WARNING ? (
              <SignalLow className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          {!userTodayRecord?.checkIn ? (
            // Check-in: requires GPS to be acquired first
            <Button
              onClick={handleCheckIn}
              disabled={!officeResult || gpsInFlight || isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Verify Location &amp; Check In</>
              )}
            </Button>
          ) : !userTodayRecord.checkOut ? (
            // Check-out: no GPS needed — the user is already recorded as at the office
            <Button
              onClick={handleCheckOut}
              disabled={isSubmitting}
              className="w-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</>
              ) : (
                <><Clock className="w-4 h-4" /> Record Check Out</>
              )}
            </Button>
          ) : (
            <Button onClick={onClose} variant="secondary" className="w-full">
              Done — All Recorded
            </Button>
          )}
        </div>

      </div>
    </Modal>
  );
};
