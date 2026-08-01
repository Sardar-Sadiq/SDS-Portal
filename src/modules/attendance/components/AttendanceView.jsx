'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Clock, Search, MapPin, Download, Filter } from 'lucide-react';

export const AttendanceView = ({ onOpenCheckIn }) => {
  const { attendanceRecords, activeRole, exportAttendanceExcel } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const departments = Array.from(new Set(attendanceRecords.map(a => a.department)));

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    const matchesDept = departmentFilter === 'ALL' || record.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Attendance Audit Ledger</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Location-verified check-in logs and SLA compliance records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportAttendanceExcel} variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5" /> Export Attendance Excel (.csv)
          </Button>
          <Button onClick={onOpenCheckIn} size="sm" className="text-xs">
            <Clock className="w-3.5 h-3.5" /> GPS Check In
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter by name or employee ID..."
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
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Log Table</CardTitle>
              <CardDescription>Showing {filteredRecords.length} recorded entries</CardDescription>
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
    </div>
  );
};
