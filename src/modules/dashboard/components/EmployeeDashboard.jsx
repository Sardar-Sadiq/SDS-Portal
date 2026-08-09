'use client';

import React from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Award, User, ChevronRight } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/animated-number';

import { isRemarkForEmployee } from '@/modules/remarks/services/remarkService';

export const EmployeeDashboard = ({
  onNavigateTab,
  onOpenCheckIn,
  onOpenApplyLeave
}) => {
  const { currentUser, attendanceRecords, remarks } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(a => a.employeeId === currentUser?.employeeId && a.date === todayStr);

  const myRecentAttendance = attendanceRecords
    .filter(a => a.employeeId === currentUser?.employeeId)
    .slice(0, 5);

  const myRemarks = remarks.filter(r => isRemarkForEmployee(r, currentUser)).slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="bg-card border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                {currentUser?.employeeId}
              </Badge>
              <span className="text-xs text-neutral-500">{currentUser?.department} Department</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Welcome back, {currentUser?.name}
            </h2>
            <p className="text-xs text-neutral-500">
              {currentUser?.designation}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={onOpenCheckIn} size="sm" className="text-xs">
              <Clock className="w-3.5 h-3.5" />
              {todayRecord?.checkIn ? 'Check Out / Status' : 'GPS Check In'}
            </Button>
            <Button onClick={onOpenApplyLeave} variant="outline" size="sm" className="text-xs">
              <Calendar className="w-3.5 h-3.5" />
              Apply Leave
            </Button>
          </div>
        </div>
      </Card>

      {/* Top 3 Equal Height KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <Card className="h-full flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase text-neutral-500 font-mono tracking-wider">Today's Attendance</CardTitle>
              <Clock className="w-4 h-4 text-neutral-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                {todayRecord?.checkIn || '00:00'}
              </span>
              <Badge variant={todayRecord?.isLate ? 'warning' : todayRecord?.checkIn ? 'success' : 'neutral'}>
                {todayRecord?.status || 'NOT CHECKED IN'}
              </Badge>
            </div>
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 grid grid-cols-2 text-xs text-neutral-500">
              <div>
                <span>Check Out:</span>
                <p className="font-medium text-neutral-800 dark:text-neutral-200 font-mono">{todayRecord?.checkOut || '--:--'}</p>
              </div>
              <div>
                <span>Hours Worked:</span>
                <p className="font-medium text-neutral-800 dark:text-neutral-200 font-mono">{todayRecord?.workingHours || 0} hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase text-neutral-500 font-mono tracking-wider">Leave Quotas</CardTitle>
              <Calendar className="w-4 h-4 text-neutral-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-2 text-center my-auto">
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">Casual</span>
                <p className="text-lg font-bold text-neutral-900 dark:text-white"><AnimatedNumber value={currentUser?.leaveBalance?.casual ?? 12} /></p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">Sick</span>
                <p className="text-lg font-bold text-neutral-900 dark:text-white"><AnimatedNumber value={currentUser?.leaveBalance?.sick ?? 8} /></p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">Annual</span>
                <p className="text-lg font-bold text-neutral-900 dark:text-white"><AnimatedNumber value={currentUser?.leaveBalance?.annual ?? 15} /></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase text-neutral-500 font-mono tracking-wider">Performance Remark</CardTitle>
              <Award className="w-4 h-4 text-neutral-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            {myRemarks.length > 0 ? (
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/80 my-auto">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <Badge variant="outline">
                    {myRemarks[0].category}
                  </Badge>
                  <span className="text-neutral-400 text-[10px]">{new Date(myRemarks[0].createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                  "{myRemarks[0].content}"
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-neutral-400 my-auto">No performance remarks recorded.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid for Table & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <Card className="lg:col-span-2 h-full flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Attendance Logs</CardTitle>
                <CardDescription>Your check-in history for past working days</CardDescription>
              </div>
              <Button onClick={() => onNavigateTab('attendance')} variant="ghost" size="sm" className="text-xs">
                View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 uppercase text-[10px] font-mono tracking-wider">
                    <th className="py-2.5 px-4 font-normal">Date</th>
                    <th className="py-2.5 px-4 font-normal">Check In</th>
                    <th className="py-2.5 px-4 font-normal">Check Out</th>
                    <th className="py-2.5 px-4 font-normal">Hours</th>
                    <th className="py-2.5 px-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                  {myRecentAttendance.map(record => (
                    <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{record.date}</td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300 font-mono">{record.checkIn || '--'}</td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300 font-mono">{record.checkOut || '--'}</td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300 font-mono">{record.workingHours} hrs</td>
                      <td className="py-3 px-4">
                        <Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'LATE' ? 'warning' : 'error'}>
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Portal Actions</CardTitle>
            <CardDescription>Direct employee utilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 flex flex-col justify-center">
            <button
              onClick={onOpenApplyLeave}
              className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Apply for Leave</p>
                  <p className="text-[10px] text-neutral-400">Submit leave application</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('attendance')}
              className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">View Attendance Record</p>
                  <p className="text-[10px] text-neutral-400">Monthly check-in history</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('profile')}
              className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">My Employee Profile</p>
                  <p className="text-[10px] text-neutral-400">Personal &amp; employment info</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
