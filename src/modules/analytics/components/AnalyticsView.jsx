'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export const AnalyticsView = () => {
  const monthlyAttendanceData = [
    { month: 'Apr', presentPct: 94, latePct: 4, leavePct: 2 },
    { month: 'May', presentPct: 96, latePct: 2, leavePct: 2 },
    { month: 'Jun', presentPct: 91, latePct: 6, leavePct: 3 },
    { month: 'Jul', presentPct: 95, latePct: 3, leavePct: 2 },
    { month: 'Aug (YTD)', presentPct: 98, latePct: 2, leavePct: 0 },
  ];

  const avgTimeData = [
    { month: 'Apr', avgCheckIn: '08:52 AM', avgCheckOut: '06:10 PM', avgHours: 9.3 },
    { month: 'May', avgCheckIn: '08:48 AM', avgCheckOut: '06:05 PM', avgHours: 9.2 },
    { month: 'Jun', avgCheckIn: '08:55 AM', avgCheckOut: '06:15 PM', avgHours: 9.3 },
    { month: 'Jul', avgCheckIn: '08:50 AM', avgCheckOut: '06:08 PM', avgHours: 9.3 },
    { month: 'Aug', avgCheckIn: '08:51 AM', avgCheckOut: '06:12 PM', avgHours: 9.4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Workforce Analytics &amp; Intelligence</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Executive operational insights, SLA compliance metrics, and leave distribution</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">Admin Reports Mode</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase block">Average Check-In Time</span>
          <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">08:51 AM</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">9 mins before SLA limit</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase block">Average Check-Out Time</span>
          <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">06:12 PM</p>
          <span className="text-[10px] text-neutral-400 font-mono">12 mins past end SLA</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase block">Monthly Attendance SLA Rate</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">98.2%</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+1.8% vs last month</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase block">Total Leave Days Granted</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">7 Days</p>
          <span className="text-[10px] text-neutral-400 font-mono">0 pending approvals</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Attendance SLA % Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly Attendance SLA % Breakdown</CardTitle>
                <CardDescription>Historical trend of on-time attendance vs late check-ins</CardDescription>
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
                <CardDescription>Recorded daily working hours per employee</CardDescription>
              </div>
              <span className="text-xs font-mono text-blue-500 font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Hours Worked
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[8, 10]} />
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
