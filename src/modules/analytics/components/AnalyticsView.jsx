'use client';

import React from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { AnimatedNumber } from '@/components/motion/animated-number';

export const AnalyticsView = () => {
  const { attendanceRecords = [], leaveRequests = [] } = useStore();

  // 1. Calculate Average Check-In Time from real attendanceRecords
  const checkInTimes = attendanceRecords
    .filter(r => r.checkIn)
    .map(r => {
      const match = r.checkIn.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    })
    .filter(t => t !== null);

  const avgCheckInMinutes = checkInTimes.length > 0
    ? Math.round(checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length)
    : null;

  const formatMinutesToTime = (totalMin) => {
    if (totalMin === null) return '--:--';
    const h24 = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const formattedM = m < 10 ? `0${m}` : m;
    const formattedH = h12 < 10 ? `0${h12}` : h12;
    return `${formattedH}:${formattedM} ${period}`;
  };

  const avgCheckInDisplay = formatMinutesToTime(avgCheckInMinutes);

  // 2. Calculate Average Check-Out Time
  const checkOutTimes = attendanceRecords
    .filter(r => r.checkOut)
    .map(r => {
      const match = r.checkOut.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    })
    .filter(t => t !== null);

  const avgCheckOutMinutes = checkOutTimes.length > 0
    ? Math.round(checkOutTimes.reduce((a, b) => a + b, 0) / checkOutTimes.length)
    : null;

  const avgCheckOutDisplay = formatMinutesToTime(avgCheckOutMinutes);

  // 3. Monthly Attendance SLA Rate (% of PRESENT / on-time vs total)
  const totalAttLogs = attendanceRecords.length;
  const onTimeLogs = attendanceRecords.filter(r => r.status === 'PRESENT').length;
  const slaRatePct = totalAttLogs > 0 ? ((onTimeLogs / totalAttLogs) * 100) : 100;

  // 4. Total Leave Days Granted
  const approvedLeaves = leaveRequests.filter(r => r.status === 'APPROVED');
  const totalLeaveDaysGranted = approvedLeaves.reduce((acc, r) => acc + (Number(r.totalDays) || 1), 0);
  const pendingApprovalsCount = leaveRequests.filter(r => r.status === 'PENDING').length;

  // 5. Dynamic Monthly Breakdown Data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();

  // Create monthly metrics from real records
  const monthlyMetricsMap = {};
  for (let i = Math.max(0, currentMonthIdx - 4); i <= currentMonthIdx; i++) {
    const mName = monthNames[i];
    monthlyMetricsMap[mName] = { total: 0, onTime: 0, late: 0, totalHours: 0 };
  }

  attendanceRecords.forEach(r => {
    if (!r.date) return;
    const d = new Date(r.date);
    const mName = monthNames[d.getMonth()];
    if (monthlyMetricsMap[mName]) {
      monthlyMetricsMap[mName].total += 1;
      if (r.status === 'LATE') monthlyMetricsMap[mName].late += 1;
      else monthlyMetricsMap[mName].onTime += 1;
      monthlyMetricsMap[mName].totalHours += (Number(r.workingHours) || 0);
    }
  });

  const monthlyAttendanceData = Object.keys(monthlyMetricsMap).map(mName => {
    const data = monthlyMetricsMap[mName];
    const total = data.total || 1;
    return {
      month: mName,
      presentPct: data.total > 0 ? Math.round((data.onTime / total) * 100) : 100,
      latePct: data.total > 0 ? Math.round((data.late / total) * 100) : 0,
      avgHours: data.total > 0 ? Number((data.totalHours / total).toFixed(1)) : 8.5
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Workforce Analytics &amp; Intelligence</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Live operational insights derived from Supabase attendance and leave records</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">Real-Time Data Mode</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase block">Average Check-In Time</span>
          <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">{avgCheckInDisplay}</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
            {avgCheckInMinutes !== null ? (avgCheckInMinutes <= 570 ? 'On-Time Average' : 'Includes Late Arrivals') : 'No Check-Ins Yet'}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase block">Average Check-Out Time</span>
          <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">{avgCheckOutDisplay}</p>
          <span className="text-[10px] text-neutral-400 font-mono">
            {avgCheckOutMinutes !== null ? 'Live Database Average' : 'Awaiting Check-Out Logs'}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase block">Monthly Attendance SLA Rate</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            <AnimatedNumber value={slaRatePct} decimals={1} />%
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Based on {totalAttLogs} total log entries</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase block">Total Leave Days Granted</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
            <AnimatedNumber value={totalLeaveDaysGranted} /> Days
          </p>
          <span className="text-[10px] text-neutral-400 font-mono">{pendingApprovalsCount} pending approvals</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Attendance SLA % Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly Attendance SLA % Breakdown</CardTitle>
                <CardDescription>Live trend of on-time attendance vs late check-ins from database logs</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> On Time</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Late</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', fontSize: '11px', border: '1px solid #27272a' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                  <Bar dataKey="presentPct" fill="#10b981" name="On Time %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="latePct" fill="#f59e0b" name="Late Arrival %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Average Working Hours Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Average Daily Productive Hours</CardTitle>
                <CardDescription>Calculated average daily working hours per employee</CardDescription>
              </div>
              <span className="text-xs font-mono text-blue-500 font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Hours Worked
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[6, 12]} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', fontSize: '11px', border: '1px solid #27272a' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="avgHours" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} name="Average Hours Worked" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
