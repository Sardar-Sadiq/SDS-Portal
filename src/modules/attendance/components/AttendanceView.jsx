'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Clock, Search, MapPin, Download, Filter, BarChart2, Table } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/animated-number';
import { EmployeeAttendanceReport } from './EmployeeAttendanceReport';

export const AttendanceView = ({ onOpenCheckIn }) => {
  const { attendanceRecords, currentUser, activeRole, exportAttendanceExcel, leaveRequests } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState('REPORT'); // 'REPORT' or 'LEDGER'

  const isAdmin = activeRole === 'ADMIN';

  // Filter records by employee ID if non-admin user
  const roleAttendanceRecords = isAdmin
    ? attendanceRecords
    : attendanceRecords.filter(a => a.employeeId === currentUser?.employeeId);

  // Generate Current Week Attendance Timings (Mon-Fri)
  const currentWeekCheckInLogs = [
    { day: 'Monday', date: '2026-08-03', checkIn: '09:22 AM', checkOut: '05:35 PM', workingHours: 8.2, status: 'PRESENT' },
    { day: 'Tuesday', date: '2026-08-04', checkIn: '09:18 AM', checkOut: '05:42 PM', workingHours: 8.4, status: 'PRESENT' },
    { day: 'Wednesday', date: '2026-08-05', checkIn: '09:48 AM', checkOut: '06:00 PM', workingHours: 8.2, status: 'LATE' },
    { day: 'Thursday', date: '2026-08-06', checkIn: '09:25 AM', checkOut: '05:30 PM', workingHours: 8.1, status: 'PRESENT' },
    { day: 'Friday', date: '2026-08-07', checkIn: '--:--', checkOut: '--:--', workingHours: 0, status: 'ON_LEAVE' },
  ];

  // Monthly Line Graph Data (Weekly Averages + Week Numbers + Leaves count)
  // Added variation in check-in (9:15 - 9:45 AM) and check-out (5:20 - 5:50 PM) for visual curves
  const monthlyGraphData = [
    { weekNumber: 29, weekLabel: 'Week 1 (Jul 6 - Jul 10)', avgCheckIn: '09:15 AM', avgCheckInDecimal: 9.25, avgCheckOut: '05:45 PM', avgCheckOutDecimal: 17.75, avgHours: 8.5, leavesCount: 0 },
    { weekNumber: 30, weekLabel: 'Week 2 (Jul 13 - Jul 17)', avgCheckIn: '09:35 AM', avgCheckInDecimal: 9.58, avgCheckOut: '05:25 PM', avgCheckOutDecimal: 17.42, avgHours: 7.8, leavesCount: 1 },
    { weekNumber: 31, weekLabel: 'Week 3 (Jul 20 - Jul 24)', avgCheckIn: '09:12 AM', avgCheckInDecimal: 9.20, avgCheckOut: '05:50 PM', avgCheckOutDecimal: 17.83, avgHours: 8.6, leavesCount: 0 },
    { weekNumber: 32, weekLabel: 'Week 4 (Jul 27 - Jul 31)', avgCheckIn: '09:42 AM', avgCheckInDecimal: 9.70, avgCheckOut: '05:20 PM', avgCheckOutDecimal: 17.33, avgHours: 7.6, leavesCount: 2 },
    { weekNumber: 33, weekLabel: 'Week 5 (Aug 3 - Aug 7)', avgCheckIn: '09:23 AM', avgCheckInDecimal: 9.38, avgCheckOut: '05:35 PM', avgCheckOutDecimal: 17.58, avgHours: 8.3, leavesCount: 1 },
  ];

  const departments = Array.from(new Set(roleAttendanceRecords.map(a => a.department)));

  const filteredRecords = roleAttendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.date.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    const matchesDept = departmentFilter === 'ALL' || record.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {isAdmin ? 'Attendance Audit Ledger' : 'My Attendance & Weekly Report'}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isAdmin 
              ? 'Location-verified check-in logs and SLA compliance records' 
              : 'Weekly check-in/out timings, monthly trends, and daily logs'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isAdmin && (
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs mr-2">
              <button
                onClick={() => setActiveSubTab('REPORT')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeSubTab === 'REPORT'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Weekly & Monthly Report
              </button>
              <button
                onClick={() => setActiveSubTab('LEDGER')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeSubTab === 'LEDGER'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" /> Full Attendance Logs
              </button>
            </div>
          )}

          <Button onClick={exportAttendanceExcel} variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5" /> Export Excel (.csv)
          </Button>
          <Button onClick={onOpenCheckIn} size="sm" className="text-xs">
            <Clock className="w-3.5 h-3.5" /> GPS Check In
          </Button>
        </div>
      </div>

      {!isAdmin && activeSubTab === 'REPORT' ? (
        <EmployeeAttendanceReport
          weeklyCheckInLogs={currentWeekCheckInLogs}
          monthlyGraphData={monthlyGraphData}
          weeklyAvgStats={{ avgCheckIn: '09:21 AM', avgCheckOut: '05:36 PM', avgHours: 8.3 }}
          leaveCountThisWeek={1}
        />
      ) : (
        <>
          <Card className="p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder={isAdmin ? "Filter by name, ID or date..." : "Filter by date..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <Filter className="w-3.5 h-3.5" />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                </select>

                {isAdmin && (
                  <select
                    value={departmentFilter}
                    onChange={e => setDepartmentFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Log Table</CardTitle>
                  <CardDescription>Showing <AnimatedNumber value={filteredRecords.length} /> recorded entries</CardDescription>
                </div>
                <Button onClick={exportAttendanceExcel} variant="ghost" size="sm" className="text-xs">
                  <Download className="w-3.5 h-3.5" /> Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 text-neutral-400 uppercase text-[10px] font-mono tracking-wider">
                      <th className="py-3 px-4 font-normal">Employee</th>
                      <th className="py-3 px-4 font-normal">Date</th>
                      <th className="py-3 px-4 font-normal">Check In</th>
                      <th className="py-3 px-4 font-normal">Check Out</th>
                      <th className="py-3 px-4 font-normal">Hours</th>
                      <th className="py-3 px-4 font-normal">GPS Distance</th>
                      <th className="py-3 px-4 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map(record => (
                        <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={record.avatar} name={record.employeeName} size="md" />
                              <div>
                                <p className="font-semibold text-neutral-900 dark:text-white">{record.employeeName}</p>
                                <p className="text-[10px] text-neutral-400 font-mono">{record.employeeId} • {record.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{record.date}</td>
                          <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-300">{record.checkIn || '--'}</td>
                          <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-300">{record.checkOut || '--'}</td>
                          <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-300">{record.workingHours} hrs</td>
                          <td className="py-3 px-4">
                            {record.locationVerified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                                <MapPin className="w-3 h-3" /> {record.distanceFromOfficeMeters ?? 0}m (Verified)
                              </span>
                            ) : (
                              <span className="text-[11px] text-neutral-400">Unverified / Remote</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'LATE' ? 'warning' : 'neutral'}>
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-neutral-400">No attendance records match your filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
