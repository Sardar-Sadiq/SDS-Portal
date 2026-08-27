'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export const ApplyLeaveModal = ({ isOpen, onClose }) => {
  const { applyLeave, currentUser, leaveBalances, calculateEmployeeLeaveBalances, showToast } = useStore();
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [durationMode, setDurationMode] = useState('FULL'); // 'FULL' or 'HALF'
  const [halfDaySlot, setHalfDaySlot] = useState('FIRST_HALF'); // 'FIRST_HALF' or 'SECOND_HALF'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentBal = calculateEmployeeLeaveBalances ? calculateEmployeeLeaveBalances(currentUser) : leaveBalances;
  const casualBal = currentBal?.casual ?? leaveBalances?.casual ?? currentUser?.leaveBalance?.casual ?? 12;
  const sickBal = currentBal?.sick ?? leaveBalances?.sick ?? currentUser?.leaveBalance?.sick ?? 12;
  const emergencyBal = currentBal?.emergency ?? leaveBalances?.emergency ?? leaveBalances?.annual ?? currentUser?.leaveBalance?.emergency ?? currentUser?.leaveBalance?.annual ?? 10;

  const isHalfDay = durationMode === 'HALF';
  const effectiveEndDate = isHalfDay ? startDate : endDate;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!reason.trim()) return;

    const start = new Date(startDate);
    const end = new Date(effectiveEndDate);

    if (end < start) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    let diffDays = 0.5;
    if (!isHalfDay) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const typeKey = leaveType.toLowerCase();
    let currentAvailable = 999;
    if (typeKey === 'casual') currentAvailable = casualBal;
    else if (typeKey === 'sick') currentAvailable = sickBal;
    else if (typeKey === 'emergency' || typeKey === 'annual') currentAvailable = emergencyBal;

    if (leaveType !== 'UNPAID' && diffDays > currentAvailable) {
      const msg = `Insufficient ${leaveType} leave balance. Requested ${diffDays} day(s), but only ${currentAvailable} day(s) available.`;
      setErrorMsg(msg);
      showToast({
        title: "Leave Request Error",
        description: msg,
        status: "error"
      });
      return;
    }

    applyLeave({
      leaveType,
      startDate,
      endDate: effectiveEndDate,
      totalDays: diffDays,
      isHalfDay,
      halfDaySlot: isHalfDay ? halfDaySlot : null,
      reason
    });

    onClose();
    setReason('');
    setErrorMsg('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply For Leave"
      description="Submit a leave application for manager &amp; admin approval"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs flex justify-between">
          <span className="text-neutral-500 font-medium">Your Balance Remaining:</span>
          <span className="font-bold text-neutral-900 dark:text-white">
            Casual: {casualBal}d | Sick: {sickBal}d | Emergency: {emergencyBal}d
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Leave Category</label>
            <select
              value={leaveType}
              onChange={(e) => {
                const val = e.target.value;
                setLeaveType(val);
              }}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            >
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EMERGENCY">Emergency Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Leave Duration</label>
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs h-[38px]">
              <button
                type="button"
                onClick={() => setDurationMode('FULL')}
                className={`flex-1 py-1 rounded-lg font-medium transition-colors text-center ${
                  durationMode === 'FULL'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Full Day
              </button>
              <button
                type="button"
                onClick={() => setDurationMode('HALF')}
                className={`flex-1 py-1 rounded-lg font-medium transition-colors text-center ${
                  durationMode === 'HALF'
                    ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Half Day (0.5d)
              </button>
            </div>
          </div>
        </div>

        {durationMode === 'HALF' && (
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-2">
            <label className="font-semibold text-emerald-800 dark:text-emerald-300 block">Select Half-Day Session</label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                halfDaySlot === 'FIRST_HALF'
                  ? 'bg-white dark:bg-neutral-800 border-emerald-500 text-neutral-900 dark:text-white shadow-sm'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-white/50'
              }`}>
                <input
                  type="radio"
                  name="halfDaySlot"
                  value="FIRST_HALF"
                  checked={halfDaySlot === 'FIRST_HALF'}
                  onChange={() => setHalfDaySlot('FIRST_HALF')}
                  className="accent-emerald-600"
                />
                <div>
                  <p className="font-semibold text-[11px]">First Half</p>
                  <p className="text-[10px] text-neutral-400">Morning Slot</p>
                </div>
              </label>

              <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                halfDaySlot === 'SECOND_HALF'
                  ? 'bg-white dark:bg-neutral-800 border-emerald-500 text-neutral-900 dark:text-white shadow-sm'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-white/50'
              }`}>
                <input
                  type="radio"
                  name="halfDaySlot"
                  value="SECOND_HALF"
                  checked={halfDaySlot === 'SECOND_HALF'}
                  onChange={() => setHalfDaySlot('SECOND_HALF')}
                  className="accent-emerald-600"
                />
                <div>
                  <p className="font-semibold text-[11px]">Second Half</p>
                  <p className="text-[10px] text-neutral-400">Afternoon Slot</p>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className={`grid ${durationMode === 'HALF' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              {durationMode === 'HALF' ? 'Leave Date *' : 'Start Date *'}
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                if (durationMode === 'HALF') setEndDate(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
          {durationMode === 'FULL' && (
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Reason for Leave *</label>
          <textarea
            required
            rows={3}
            placeholder="Please provide clear context for your manager..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500 resize-none"
          />
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">
            {durationMode === 'HALF' ? 'Submit Half Day Request (0.5d)' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
