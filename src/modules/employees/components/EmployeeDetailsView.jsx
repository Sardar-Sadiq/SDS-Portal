'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmployeeAvatar } from '@/modules/profile/components/EmployeeAvatar';
import { AddRemarkModal } from '@/modules/remarks/components/AddRemarkModal';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';

import { isRemarkForEmployee } from '@/modules/remarks/services/remarkService';

export const EmployeeDetailsView = ({ employeeId, onBack }) => {
  const { employees, attendanceRecords, remarks, activeRole, officeSettings, deleteRemark } = useStore();
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [editingRemark, setEditingRemark] = useState(null);

  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId) || employees[0] || {};

  const empAttendance = emp?.employeeId ? attendanceRecords.filter(a => a.employeeId === emp.employeeId) : [];
  const empRemarks = emp ? remarks.filter(r => isRemarkForEmployee(r, emp)).slice(0, 2) : [];

  const handleOpenAddRemark = () => {
    setEditingRemark(null);
    setIsRemarkModalOpen(true);
  };

  const handleOpenEditRemark = (remark) => {
    setEditingRemark(remark);
    setIsRemarkModalOpen(true);
  };

  const handleDeleteRemark = (remarkId) => {
    deleteRemark(remarkId);
  };

  const geoRadius = emp?.officeLocation?.radiusMeters ?? officeSettings?.geoFence?.radiusMeters ?? 20;
  const casualLeave = emp?.leaveBalance?.casual ?? 12;
  const sickLeave = emp?.leaveBalance?.sick ?? 8;
  const annualLeave = emp?.leaveBalance?.annual ?? 15;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Button>
        {activeRole === 'ADMIN' && (
          <Button onClick={handleOpenAddRemark} size="sm">
            <Plus className="w-4 h-4" /> Write Performance Remark
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <EmployeeAvatar
              style={emp?.avatarStyle}
              seed={emp?.avatarSeed || emp?.employeeId || emp?.id}
              src={emp?.avatar}
              name={emp?.name || 'Employee'}
              size="xl"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">{emp?.name || 'Employee Profile'}</h2>
                <Badge variant="outline" className="font-mono text-xs">{emp?.role || 'EMPLOYEE'}</Badge>
              </div>
              <p className="text-xs font-medium text-neutral-500">{emp?.designation || 'Staff'} • {emp?.department || 'Engineering'}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1 font-mono">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {emp?.email || '--'}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {emp?.phone || '--'}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {emp?.joiningDate || '--'}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1 shrink-0">
            <span className="text-[10px] uppercase font-mono font-medium text-neutral-400">Reporting Structure</span>
            <p className="font-semibold text-neutral-900 dark:text-white">Manager: {emp?.manager || 'Sardar Sadiq'}</p>
            <p className="text-neutral-500">Office Geo Radius: {geoRadius}m</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <Card className="h-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Leave Summary</CardTitle>
            <CardDescription>Available leave quota for 2026</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-2 text-center my-auto">
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">Casual</span>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{casualLeave}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">Sick</span>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{sickLeave}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">Annual</span>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{annualLeave}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 h-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Attendance Log &amp; SLA Compliance</CardTitle>
            <CardDescription>Recorded check-in logs for current period</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 uppercase text-[10px] font-mono tracking-wider">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Check In</th>
                    <th className="py-2.5 px-4">Check Out</th>
                    <th className="py-2.5 px-4">Hours</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                  {empAttendance.length > 0 ? (
                    empAttendance.map(att => (
                      <tr key={att.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                        <td className="py-2.5 px-4 font-medium text-neutral-900 dark:text-white">{att.date}</td>
                        <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-300 font-mono">{att.checkIn || '--'}</td>
                        <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-300 font-mono">{att.checkOut || '--'}</td>
                        <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-300 font-mono">{att.workingHours} hrs</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={att.status === 'PRESENT' ? 'success' : att.status === 'LATE' ? 'warning' : 'error'}>
                            {att.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-neutral-400">No attendance entries recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4 text-neutral-400" /> Performance Remarks Timeline
              </CardTitle>
              <CardDescription>
                {activeRole === 'ADMIN' ? 'Admin feedback ledger (Admin writes and edits, Employee reads)' : 'Your official manager performance remarks log (Read-Only)'}
              </CardDescription>
            </div>
            {activeRole === 'ADMIN' && (
              <Button onClick={handleOpenAddRemark} size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5" /> Add Remark ({empRemarks.length}/2)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {empRemarks.length > 0 ? (
              empRemarks.map(r => (
                <div key={r.id} className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {r.category}
                      </Badge>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Written by: {r.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400">{new Date(r.createdAt).toLocaleString()}</span>
                      {activeRole === 'ADMIN' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditRemark(r)}
                            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                            title="Edit Remark"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRemark(r.id)}
                            className="p-1 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete Remark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    "{r.content}"
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-neutral-400">No performance remarks recorded yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddRemarkModal
        isOpen={isRemarkModalOpen}
        onClose={() => setIsRemarkModalOpen(false)}
        employeeId={emp?.employeeId || ''}
        employeeName={emp?.name || ''}
        editingRemark={editingRemark}
      />
    </div>
  );
};
