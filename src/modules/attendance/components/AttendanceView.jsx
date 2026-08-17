'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmployeeAvatar } from '@/modules/profile/components/EmployeeAvatar';
import { Clock, Search, MapPin, Download, Filter, BarChart2, Table, UserCheck, Users, Calendar as CalendarIcon, RotateCcw, X } from 'lucide-react';
import { AnimatedNumber } from '@/components/motion/animated-number';
import { EmployeeAttendanceReport } from './EmployeeAttendanceReport';
import { Calendar } from '@/components/ui/calendar';

export const AttendanceView = ({ onOpenCheckIn }) => {
  const { attendanceRecords = [], employees = [], currentUser, activeRole, exportAttendanceExcel, leaveRequests = [], updateAttendanceStatus } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [adminViewMode, setAdminViewMode] = useState('ALL_STAFF'); // 'ALL_STAFF' or 'MY_ATTENDANCE'
  const [employeeSubTab, setEmployeeSubTab] = useState('REPORT'); // 'REPORT' or 'LEDGER'

  // Calendar date picker state: defaults strictly to Today's date (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);

  const isAdmin = activeRole === 'ADMIN';

  // Compute My Personal Attendance Logs for currentUser dynamically
  const myRecords = attendanceRecords.filter(a => a.employeeId === currentUser?.employeeId);

  // Compute Current Week Mon-Fri logs dynamically for currentUser
  const now = new Date();
  const currentDayIdx = now.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMon = currentDayIdx === 0 ? -6 : 1 - currentDayIdx;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() + distanceToMon);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const myWeeklyLogs = dayNames.map((dName, idx) => {
    const dObj = new Date(mondayDate);
    dObj.setDate(mondayDate.getDate() + idx);
    const dateStr = dObj.toISOString().split('T')[0];

    const matchedRec = myRecords.find(r => r.date === dateStr);
    const matchedLeave = leaveRequests.find(l => 
      l.employeeId === currentUser?.employeeId && 
      l.status === 'APPROVED' &&
      l.startDate <= dateStr &&
      l.endDate >= dateStr
    );

    let status = matchedRec?.status || (matchedLeave ? 'ON_LEAVE' : null);
    const isToday = dObj.toDateString() === now.toDateString();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const isPast1030Cutoff = isToday ? currentMins >= 630 : dObj < new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!matchedRec && !matchedLeave) {
      if (isPast1030Cutoff) {
        status = 'ABSENT';
      } else if (isToday) {
        status = 'NOT_LOGGED';
      } else {
        status = 'PENDING';
      }
    }

    return {
      day: dName,
      date: dateStr,
      checkIn: matchedRec?.checkIn || null,
      checkOut: matchedRec?.checkOut || null,
      workingHours: matchedRec?.workingHours || 0,
      status: status,
      isLate: matchedRec?.isLate || false
    };
  });

  // Calculate my current week stats
  const myCheckIns = myWeeklyLogs.filter(l => l.checkIn);
  const myCheckOuts = myWeeklyLogs.filter(l => l.checkOut);

  // Filter records for All Staff Attendance table
  const roleAttendanceRecords = isAdmin
    ? attendanceRecords
    : myRecords;

  const departments = Array.from(new Set(roleAttendanceRecords.map(a => a.department).filter(Boolean)));

  const filteredRecords = roleAttendanceRecords.filter(record => {
    const matchesDate = showAllDates || !selectedDate || record.date === selectedDate;
    const matchesSearch = (record.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (record.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (record.date || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    const matchesDept = departmentFilter === 'ALL' || record.department === departmentFilter;

    return matchesDate && matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {isAdmin 
              ? (adminViewMode === 'ALL_STAFF' ? 'Attendance Audit Ledger' : 'My Personal Attendance & Weekly Report')
              : 'My Attendance & Weekly Report'}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isAdmin 
              ? (adminViewMode === 'ALL_STAFF' ? 'Location-verified check-in logs and SLA compliance records for all staff' : 'Your personal check-in/out timings and weekly analytics')
              : 'Weekly check-in/out timings, monthly trends, and daily logs'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Switch View: Toggle between All Staff Attendance and My Personal Attendance */}
          {isAdmin ? (
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
              <button
                onClick={() => setAdminViewMode('ALL_STAFF')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  adminViewMode === 'ALL_STAFF'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> All Staff Attendance
              </button>
              <button
                onClick={() => setAdminViewMode('MY_ATTENDANCE')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  adminViewMode === 'MY_ATTENDANCE'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> My Personal Attendance Track
              </button>
            </div>
          ) : (
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
              <button
                onClick={() => setEmployeeSubTab('REPORT')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  employeeSubTab === 'REPORT'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Weekly &amp; Monthly Report
              </button>
              <button
                onClick={() => setEmployeeSubTab('LEDGER')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  employeeSubTab === 'LEDGER'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" /> Full Attendance Logs
              </button>
            </div>
          )}

          {isAdmin && (
            <Button onClick={exportAttendanceExcel} variant="outline" size="sm" className="text-xs">
              <Download className="w-3.5 h-3.5" /> Export Excel (.csv)
            </Button>
          )}
          <Button onClick={onOpenCheckIn} size="sm" className="text-xs">
            <Clock className="w-3.5 h-3.5" /> GPS Check In
          </Button>
        </div>
      </div>

      {/* Render My Personal Attendance Report if Employee OR if Admin selected MY_ATTENDANCE */}
      {(!isAdmin && employeeSubTab === 'REPORT') || (isAdmin && adminViewMode === 'MY_ATTENDANCE') ? (
        <EmployeeAttendanceReport
          weeklyCheckInLogs={myWeeklyLogs}
          monthlyGraphData={[
            { weekNumber: 32, weekLabel: 'Current Week', avgCheckIn: myCheckIns.length > 0 ? myCheckIns[0].checkIn : '--:--', avgCheckInDecimal: 9.3, avgCheckOut: myCheckOuts.length > 0 ? myCheckOuts[0].checkOut : '--:--', avgCheckOutDecimal: 17.5, avgHours: 8.2, leavesCount: 0 }
          ]}
          weeklyAvgStats={{
            avgCheckIn: myCheckIns.length > 0 ? myCheckIns[0].checkIn : '--:--',
            avgCheckOut: myCheckOuts.length > 0 ? myCheckOuts[0].checkOut : '--:--',
            avgHours: 8.2
          }}
          leaveCountThisWeek={0}
        />
      ) : (
        <>
          <Card className="p-4 space-y-3 relative">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={isAdmin ? "Filter by name, ID..." : "Filter employee..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none"
                  />
                </div>

                {/* Calendar Date Picker Popover Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 shadow-sm ${
                      !showAllDates && selectedDate
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      {showAllDates
                        ? 'All Active Month Dates'
                        : selectedDate === todayStr
                        ? `Today (${selectedDate})`
                        : selectedDate}
                    </span>
                  </button>

                  {/* Floating Shadcn Calendar Modal / Popover */}
                  {isCalendarOpen && (
                    <div className="absolute left-0 top-full mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="relative">
                        <Calendar
                          selectedDate={selectedDate}
                          onSelect={(dStr) => {
                            setSelectedDate(dStr);
                            setShowAllDates(false);
                            setIsCalendarOpen(false);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Today Button */}
                {(!selectedDate || selectedDate !== todayStr || showAllDates) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setShowAllDates(false);
                      setIsCalendarOpen(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1"
                    title="Jump to Today's Attendance"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-500" /> Today
                  </button>
                )}

                {/* View All Month Records Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAllDates(!showAllDates);
                    setIsCalendarOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                    showAllDates
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {showAllDates ? 'Filtering: Single Day' : 'View All Month Logs'}
                </button>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Attendance Log Table</CardTitle>
                    <Badge variant="outline" className="font-mono text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      {showAllDates ? 'Full Month View' : `Date: ${selectedDate}`}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Showing <AnimatedNumber value={filteredRecords.length} /> recorded entries for {showAllDates ? 'active month' : selectedDate === todayStr ? "today's date" : selectedDate}
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button onClick={exportAttendanceExcel} variant="ghost" size="sm" className="text-xs">
                    <Download className="w-3.5 h-3.5" /> Export Data
                  </Button>
                )}
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
                      filteredRecords.map(record => {
                        const emp = employees.find(e => 
                          e.employeeId === record.employeeId || 
                          e.id === record.employeeId || 
                          (e.name || '').toLowerCase() === (record.employeeName || '').toLowerCase()
                        );
                        const avatarSrc = emp?.card_image || emp?.avatar || record.avatar;

                        return (
                          <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <EmployeeAvatar
                                  src={avatarSrc}
                                  name={record.employeeName}
                                  employee={emp}
                                  size="md"
                                />
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
                            {isAdmin ? (
                              <select
                                value={record.status}
                                onChange={(e) => updateAttendanceStatus(record.id || record.employeeId, e.target.value, record.date)}
                                className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-background focus:outline-none cursor-pointer text-foreground shadow-sm"
                              >
                                <option value="PRESENT">PRESENT</option>
                                <option value="LATE">LATE</option>
                                <option value="ABSENT">ABSENT</option>
                                <option value="ON_LEAVE">ON LEAVE</option>
                              </select>
                            ) : (
                              <Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'LATE' ? 'warning' : 'neutral'}>
                                {record.status}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
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
