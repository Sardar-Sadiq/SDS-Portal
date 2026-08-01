'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle2, AlertTriangle, Clock, Navigation } from 'lucide-react';

export const GeoCheckInModal = ({ isOpen, onClose }) => {
  const { currentUser, officeSettings, attendanceRecords, checkIn, checkOut } = useStore();
  const [feedback, setFeedback] = useState({ type: null, message: '' });
  const [simulatedOffset, setSimulatedOffset] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayRecord = attendanceRecords.find(a => a.employeeId === currentUser?.employeeId && a.date === todayStr);

  const handleGeoCheckIn = () => {
    const latOffset = (simulatedOffset / 111000);
    const coords = {
      lat: officeSettings.geoFence.lat + latOffset,
      lng: officeSettings.geoFence.lng
    };

    const result = checkIn(coords);
    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleGeoCheckOut = () => {
    const result = checkOut();
    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GPS Attendance Verification"
      description="Real-time geofence check-in and location SLA validation"
    >
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {officeSettings.geoFence.address}
            </span>
            <Badge variant="accent">Radius: {officeSettings.geoFence.radiusMeters}m</Badge>
          </div>
          <div className="text-xs text-neutral-500 space-y-1">
            <p><strong>Office Hours SLA:</strong> {officeSettings.officeStartTime} AM – {officeSettings.officeEndTime} PM</p>
            <p><strong>Grace Period:</strong> {officeSettings.gracePeriodMinutes} mins</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">Today's Status</span>
            <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
              {userTodayRecord?.checkIn ? (
                <span className="text-emerald-600 dark:text-emerald-400">Checked In ({userTodayRecord.checkIn})</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Not Checked In Yet</span>
              )}
            </p>
            {userTodayRecord?.checkOut && (
              <p className="text-xs text-neutral-500 mt-1">Checked out at: {userTodayRecord.checkOut} ({userTodayRecord.workingHours} hrs)</p>
            )}
          </div>
          <Badge variant={userTodayRecord?.isLate ? 'warning' : userTodayRecord?.checkIn ? 'success' : 'neutral'}>
            {userTodayRecord?.status || 'PENDING'}
          </Badge>
        </div>

        <div className="space-y-2 p-3 rounded-xl bg-neutral-100/50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-blue-500" /> GPS Distance Simulator
            </span>
            <span className="font-mono text-neutral-900 dark:text-white font-bold">{simulatedOffset}m from office</span>
          </div>
          <input
            type="range"
            min="0"
            max="600"
            step="25"
            value={simulatedOffset}
            onChange={(e) => setSimulatedOffset(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
          />
          <div className="flex justify-between text-[10px] text-neutral-400">
            <span>Inside Office (0m)</span>
            <span className="text-rose-500 font-medium">Outside Radius (&gt;250m)</span>
          </div>
        </div>

        {feedback.message && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!userTodayRecord?.checkIn ? (
            <Button onClick={handleGeoCheckIn} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="w-4 h-4" /> Verify Location &amp; Check In
            </Button>
          ) : !userTodayRecord.checkOut ? (
            <Button onClick={handleGeoCheckOut} className="w-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Clock className="w-4 h-4" /> Record Check Out
            </Button>
          ) : (
            <Button onClick={onClose} variant="secondary" className="w-full">
              Done
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
