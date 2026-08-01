'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Save, Plus, Pencil, Trash2, Calendar, MapPin, Clock } from 'lucide-react';

export const SettingsView = () => {
  const { officeSettings, updateSettings, addHoliday, editHoliday, deleteHoliday } = useStore();

  const [startTime, setStartTime] = useState(officeSettings.officeStartTime);
  const [endTime, setEndTime] = useState(officeSettings.officeEndTime);
  const [gracePeriod, setGracePeriod] = useState(officeSettings.gracePeriodMinutes);
  const [radius, setRadius] = useState(officeSettings.geoFence.radiusMeters);
  const [address, setAddress] = useState(officeSettings.geoFence.address);
  const [lat, setLat] = useState(officeSettings.geoFence.lat);
  const [lng, setLng] = useState(officeSettings.geoFence.lng);

  const [savedMsg, setSavedMsg] = useState('');

  // Holiday Modal State
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayType, setHolidayType] = useState('PUBLIC');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({
      officeStartTime: startTime,
      officeEndTime: endTime,
      gracePeriodMinutes: Number(gracePeriod),
      geoFence: {
        address,
        lat: Number(lat),
        lng: Number(lng),
        radiusMeters: Number(radius)
      }
    });
    setSavedMsg('Settings saved successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleOpenAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayName('');
    setHolidayDate('');
    setHolidayType('PUBLIC');
    setIsHolidayModalOpen(true);
  };

  const handleOpenEditHoliday = (holiday, index) => {
    setEditingHoliday({ ...holiday, targetId: holiday.id || index });
    setHolidayName(holiday.name);
    setHolidayDate(holiday.date);
    setHolidayType(holiday.type || 'PUBLIC');
    setIsHolidayModalOpen(true);
  };

  const handleSaveHolidaySubmit = (e) => {
    e.preventDefault();
    if (!holidayName.trim() || !holidayDate) return;

    if (editingHoliday) {
      editHoliday(editingHoliday.targetId, {
        name: holidayName,
        date: holidayDate,
        type: holidayType
      });
    } else {
      addHoliday({
        name: holidayName,
        date: holidayDate,
        type: holidayType
      });
    }

    setIsHolidayModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">System Settings &amp; SLA Configurations</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Configure geofencing rules, SLA working hours, and official holiday calendar</p>
        </div>
        {savedMsg && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            {savedMsg}
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" /> Attendance &amp; Working Hours SLA
              </CardTitle>
              <CardDescription>Shift start/end times and late grace period thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Office Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Office End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={gracePeriod}
                  onChange={e => setGracePeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Check-ins after {startTime} + {gracePeriod} mins are flagged as LATE.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-400" /> GPS Geofence Configuration
              </CardTitle>
              <CardDescription>GPS coordinates and allowed check-in radius</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Office Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Radius (Meters)</label>
                  <input
                    type="number"
                    value={radius}
                    onChange={e => setRadius(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="w-3.5 h-3.5" /> Save SLA &amp; GPS Settings
          </Button>
        </div>
      </form>

      {/* Editable Holiday Calendar Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" /> Holiday Calendar (2026)
              </CardTitle>
              <CardDescription>Official Spirit Data Solutions paid holidays and office closures (Admin can add &amp; edit)</CardDescription>
            </div>
            <Button onClick={handleOpenAddHoliday} size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5" /> Add Holiday
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {officeSettings.holidayCalendar.map((holiday, idx) => (
              <div
                key={holiday.id || idx}
                className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">{holiday.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-neutral-400 font-mono">{holiday.date}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{holiday.type || 'PUBLIC'}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditHoliday(holiday, idx)}
                    className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    title="Edit Holiday"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteHoliday(holiday.id || idx)}
                    className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Holiday Modal */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title={editingHoliday ? "Edit Official Holiday" : "Add New Official Holiday"}
        description="Configure company holidays and paid office closures"
      >
        <form onSubmit={handleSaveHolidaySubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Holiday Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Labor Day, Annual Founders Day"
              value={holidayName}
              onChange={e => setHolidayName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Date *</label>
              <input
                type="date"
                required
                value={holidayDate}
                onChange={e => setHolidayDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono focus:outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Holiday Type</label>
              <select
                value={holidayType}
                onChange={e => setHolidayType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
              >
                <option value="PUBLIC">PUBLIC (National Holiday)</option>
                <option value="COMPANY">COMPANY (Company Paid Off)</option>
                <option value="OPTIONAL">OPTIONAL (Floating Holiday)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setIsHolidayModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingHoliday ? "Update Holiday" : "Add Holiday"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
