'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import { Plus, Download } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { AnimatedNumber } from '@/components/motion/animated-number';

export const LeaveManagementView = () => {
  const { currentUser, leaveRequests, activeRole, reviewLeave, exportAttendanceExcel } = useStore();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedReviewLeaveId, setSelectedReviewLeaveId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const selectedReviewLeave = leaveRequests.find(l => l.id === selectedReviewLeaveId);

  const viewableRequests = activeRole === 'ADMIN'
    ? leaveRequests
    : leaveRequests.filter(l => l.employeeId === currentUser?.employeeId);

  const filteredRequests = viewableRequests.filter(req => {
    return statusFilter === 'ALL' || req.status === statusFilter;
  });

  const handleReviewAction = (status) => {
    if (!selectedReviewLeaveId) return;
    reviewLeave(selectedReviewLeaveId, status, adminNote);
    setSelectedReviewLeaveId(null);
    setAdminNote('');
  };

  const pendingCount = leaveRequests.filter(l => l.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Leave Management Center</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {activeRole === 'ADMIN' ? 'Review and manage company-wide employee leave applications' : 'Track your leave balance and apply for time off'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportAttendanceExcel} variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5" /> Export Excel Ledger (.csv)
          </Button>
          <Button onClick={() => setIsApplyModalOpen(true)} size="sm" className="text-xs">
            <Plus className="w-3.5 h-3.5" /> Apply For Leave
          </Button>
        </div>
      </div>

      {/* 4 Identical Quota & Pending Cards with BEUI AnimatedNumber */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-stretch">
        <Card className="p-4 h-full flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase">Casual Leave Balance</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            <AnimatedNumber value={currentUser?.leaveBalance.casual || 0} /> <span className="text-xs font-normal text-neutral-400">days</span>
          </p>
        </Card>
        <Card className="p-4 h-full flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase">Sick Leave Balance</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            <AnimatedNumber value={currentUser?.leaveBalance.sick || 0} /> <span className="text-xs font-normal text-neutral-400">days</span>
          </p>
        </Card>
        <Card className="p-4 h-full flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase">Annual Paid Leave</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            <AnimatedNumber value={currentUser?.leaveBalance.annual || 0} /> <span className="text-xs font-normal text-neutral-400">days</span>
          </p>
        </Card>
        <Card className="p-4 h-full flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase">Total Pending Requests</span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            <AnimatedNumber value={pendingCount} />
          </p>
        </Card>
      </div>

      <div className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === st
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {st} {st === 'PENDING' && `(${leaveRequests.filter(l => l.status === 'PENDING').length})`}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leave Application Ledger</CardTitle>
              <CardDescription>Comprehensive audit log of submitted leave applications</CardDescription>
            </div>
            <Button onClick={exportAttendanceExcel} variant="ghost" size="sm" className="text-xs">
              <Download className="w-3.5 h-3.5" /> Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 text-neutral-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-4 font-normal">Applicant</th>
                  <th className="py-3 px-4 font-normal">Leave Type</th>
                  <th className="py-3 px-4 font-normal">Dates &amp; Duration</th>
                  <th className="py-3 px-4 font-normal">Reason</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={req.avatar} name={req.employeeName} size="md" />
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-white">{req.employeeName}</p>
                            <p className="text-[10px] text-neutral-400">{req.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                        {req.leaveType}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-neutral-900 dark:text-white block">{req.startDate} → {req.endDate}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">({req.totalDays} days)</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-neutral-600 dark:text-neutral-300 truncate">
                        "{req.reason}"
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'}>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {activeRole === 'ADMIN' && req.status === 'PENDING' ? (
                          <Button onClick={() => setSelectedReviewLeaveId(req.id)} size="sm" className="text-xs py-1">
                            Review Request
                          </Button>
                        ) : (
                          <span className="text-[11px] text-neutral-400">
                            {req.reviewedBy ? `Reviewed by ${req.reviewedBy}` : 'No Action Needed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">No leave requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ApplyLeaveModal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} />

      <Modal
        isOpen={!!selectedReviewLeaveId}
        onClose={() => setSelectedReviewLeaveId(null)}
        title="Review Leave Application"
        description="Admin decision center &amp; offline discussion schedule"
      >
        {selectedReviewLeave && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1 text-xs">
              <p><strong>Applicant:</strong> {selectedReviewLeave.employeeName} ({selectedReviewLeave.department})</p>
              <p><strong>Leave Period:</strong> {selectedReviewLeave.startDate} to {selectedReviewLeave.endDate} ({selectedReviewLeave.totalDays} days)</p>
              <p className="italic text-neutral-600 dark:text-neutral-300">"{selectedReviewLeave.reason}"</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Admin Approval Note / Offline Discussion Notes</label>
              <textarea
                rows={3}
                placeholder="Optional notes to applicant regarding coverage or schedule..."
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500 resize-none"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
              <Button type="button" variant="outline" onClick={() => setSelectedReviewLeaveId(null)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={() => handleReviewAction('REJECTED')}>
                Reject Request
              </Button>
              <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleReviewAction('APPROVED')}>
                Approve Leave
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
