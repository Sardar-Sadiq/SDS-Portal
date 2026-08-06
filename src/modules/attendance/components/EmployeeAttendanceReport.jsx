import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Clock, Calendar, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export const EmployeeAttendanceReport = ({
  weeklyCheckInLogs = [],
  monthlyGraphData = [],
  weeklyAvgStats = { avgCheckIn: '08:52 AM', avgCheckOut: '06:12 PM', avgHours: 9.3 },
  leaveCountThisWeek = 0
}) => {
  return (
    <div className="space-y-6">
      {/* Weekly Check-In & Check-Out Timings Table + Live Weekly Reset Ledger */}
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                <Clock className="w-4 h-4 text-emerald-500" /> Current Week Attendance Timings
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 mt-0.5">
                Real-time check-in & check-out records for the current week. (Restarts automatically every week)
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[11px] w-fit">
              Week Auto-Reset Mode
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 text-neutral-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-2.5 px-4 font-normal">Day & Date</th>
                  <th className="py-2.5 px-4 font-normal">Check In</th>
                  <th className="py-2.5 px-4 font-normal">Check Out</th>
                  <th className="py-2.5 px-4 font-normal">Total Hours</th>
                  <th className="py-2.5 px-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                {weeklyCheckInLogs.length > 0 ? (
                  weeklyCheckInLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="py-3 px-4 text-neutral-900 dark:text-white font-semibold">
                        {log.day} <span className="text-neutral-400 font-mono text-[11px] font-normal">({log.date})</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                        {log.checkIn ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-3 h-3" /> {log.checkIn}
                          </span>
                        ) : (
                          <span className="text-neutral-400">--:--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                        {log.checkOut ? (
                          <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <CheckCircle className="w-3 h-3" /> {log.checkOut}
                          </span>
                        ) : (
                          <span className="text-neutral-400">--:--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                        {log.workingHours ? `${log.workingHours} hrs` : '0 hrs'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            log.status === 'PRESENT'
                              ? 'success'
                              : log.status === 'LATE'
                              ? 'warning'
                              : log.status === 'ON_LEAVE'
                              ? 'secondary'
                              : 'neutral'
                          }
                        >
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-neutral-400">
                      No check-in entries recorded for this week yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Current Week Summary & Leave Display Below Week Table */}
          <div className="p-4 bg-neutral-50/70 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-mono">Current Week Average:</span>
              <span className="font-semibold font-mono text-neutral-900 dark:text-white">
                Check-In: {weeklyAvgStats.avgCheckIn} | Check-Out: {weeklyAvgStats.avgCheckOut} ({weeklyAvgStats.avgHours} hrs/day)
              </span>
            </div>

            {/* If employee takes leave, show below that week */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-mono">Leaves This Week:</span>
              {leaveCountThisWeek > 0 ? (
                <Badge variant="warning" className="font-mono text-[11px] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {leaveCountThisWeek} {leaveCountThisWeek > 1 ? 'Leaves Taken' : 'Leave Taken'}
                </Badge>
              ) : (
                <Badge variant="outline" className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  0 Leaves Taken
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Graph of Month Check-In & Check-Out Visuals */}
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                <FileText className="w-4 h-4 text-blue-500" /> Monthly Check-In & Check-Out Visual Graph
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 mt-0.5">
                Visual analysis showing weekly average check-in & check-out timings with week numbers & leave counts listed below.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px]">
              Visual Employee Analytics
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyGraphData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[8, 19.5]}
                  ticks={[
                    8.0, 8.5, 9.0, 9.5, 10.0, 10.5,
                    16.5, 17.0, 17.5, 18.0, 18.5, 19.0
                  ]}
                  tickFormatter={val => {
                    const h = Math.floor(val);
                    const m = Math.round((val - h) * 60);
                    const formattedM = m < 10 ? `0${m}` : m;
                    const displayH = h > 12 ? h - 12 : h;
                    const period = h >= 12 ? 'PM' : 'AM';
                    return `${displayH}:${formattedM} ${period}`;
                  }}
                  tick={{ fontSize: 10 }}
                  width={65}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const h = Math.floor(value);
                    const m = Math.round((value - h) * 60);
                    const formattedM = m < 10 ? `0${m}` : m;
                    const period = h >= 12 ? 'PM' : 'AM';
                    const displayH = h > 12 ? h - 12 : h;
                    return [`${displayH}:${formattedM} ${period}`, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: '1px solid #27272a'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                <Line
                  type="natural"
                  dataKey="avgCheckInDecimal"
                  name="Avg Check-In Time"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="natural"
                  dataKey="avgCheckOutDecimal"
                  name="Avg Check-Out Time"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#3b82f6' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Week Cards with Week Number & Number of Leaves Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {monthlyGraphData.map((weekItem, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                      {weekItem.weekLabel}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">Week #{weekItem.weekNumber}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Avg Check-In:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {weekItem.avgCheckIn}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Avg Check-Out:</span>
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {weekItem.avgCheckOut}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Avg Working Hrs:</span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {weekItem.avgHours} hrs/day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Below that week (number of leave) leave */}
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-mono">Week Leaves:</span>
                  {weekItem.leavesCount > 0 ? (
                    <Badge variant="warning" className="font-mono text-[10px]">
                      {weekItem.leavesCount} {weekItem.leavesCount > 1 ? 'leaves' : 'leave'}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-mono">0 leaves</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
