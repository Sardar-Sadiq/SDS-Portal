'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export const ApplyLeaveModal = ({ isOpen, onClose }) => {
  const { applyLeave, currentUser, leaveBalances, showToast } = useStore();
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const casualBal = leaveBalances?.casual ?? currentUser?.leaveBalance?.casual ?? 12;
  const sickBal = leaveBalances?.sick ?? currentUser?.leaveBalance?.sick ?? 8;
  const annualBal = leaveBalances?.annual ?? currentUser?.leaveBalance?.annual ?? 15;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!reason.trim()) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const typeKey = leaveType.toLowerCase();
    let currentAvailable = 999;
    if (typeKey === 'casual') currentAvailable = casualBal;
    else if (typeKey === 'sick') currentAvailable = sickBal;
    else if (typeKey === 'annual') currentAvailable = annualBal;

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
      endDate,
      totalDays: diffDays,
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
            Casual: {casualBal}d | Sick: {sickBal}d | Annual: {annualBal}d
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Leave Category</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
          >
            <option value="CASUAL">Casual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="ANNUAL">Annual Paid Leave</option>
            <option value="UNPAID">Unpaid Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Start Date *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
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
          <Button type="submit">Submit Application</Button>
        </div>
      </form>
    </Modal>
  );
};
