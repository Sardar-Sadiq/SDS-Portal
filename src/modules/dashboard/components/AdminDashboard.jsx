'use client';

import React from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmployeeAvatar } from '@/modules/profile/components/EmployeeAvatar';
import { Users, UserCheck, UserX, Clock, CalendarOff, AlertTriangle, UserPlus, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AnimatedNumber } from '@/components/motion/animated-number';

export const AdminDashboard = ({
  onNavigateTab,
  onOpenAddEmployee,
  onSelectEmployee
}) => {
  const { employees, attendanceRecords, leaveRequests } = useStore();

  const totalEmployees = employees.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(a => a.date === todayStr);

  const presentToday = todayRecords.filter(a => a.status === 'PRESENT').length;
  const lateToday = todayRecords.filter(a => a.status === 'LATE').length;
  const onLeaveToday = todayRecords.filter(a => a.status === 'ON_LEAVE').length;
  const absentToday = totalEmployees - (presentToday + lateToday + onLeaveToday);

  const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');

  const dailyTrendData = [
    { day: 'Mon', present: 5, late: 0, leave: 0 },
    { day: 'Tue', present: 4, late: 1, leave: 0 },
    { day: 'Wed', present: 5, late: 0, leave: 0 },
    { day: 'Thu', present: 3, late: 1, leave: 1 },
    { day: 'Fri', present: 4, late: 0, leave: 1 },
    { day: 'Today', present: presentToday, late: lateToday, leave: onLeaveToday }
  ];

  const departmentData = [
    { name: 'Engineering', count: employees.filter(e => e.department === 'Engineering').length },
    { name: 'Data Science', count: employees.filter(e => e.department === 'Data Science').length },
    { name: 'DevOps', count: employees.filter(e => e.department.includes('DevOps')).length },
    { name: 'Product', count: employees.filter(e => e.department.includes('Product')).length },
    { name: 'HR', count: employees.filter(e => e.department.includes('Human')).length },
  ];

  // Distinct palette for departments
  const DEPARTMENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Admin Command Center</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Real-time workforce metrics and attendance SLA logs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onOpenAddEmployee} size="sm" className="text-xs">
            <UserPlus className="w-3.5 h-3.5" /> Add Employee
          </Button>
          <Button onClick={() => onNavigateTab('leave')} variant="outline" size="sm" className="text-xs">
            <CalendarOff className="w-3.5 h-3.5" /> Review Leaves ({pendingLeaves.length})
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase">Total Staff</span>
            <Users className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-white"><AnimatedNumber value={totalEmployees} /></p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase">Present Today</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400"><AnimatedNumber value={presentToday} /></p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase">Late Arrivals</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400"><AnimatedNumber value={lateToday} /></p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase">On Leave</span>
            <CalendarOff className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400"><AnimatedNumber value={onLeaveToday} /></p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase">Absent</span>
            <UserX className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400"><AnimatedNumber value={absentToday} /></p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase">Pending Leaves</span>
            <AlertTriangle className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400"><AnimatedNumber value={pendingLeaves.length} /></p>
        </Card>
      </div>

      {/* Visual Charts Grid with Distinct Colors & Legends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <Card className="lg:col-span-2 h-full flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attendance Trends (Weekly SLA)</CardTitle>
                <CardDescription>Daily breakdown of Present, Late, and On Leave counts</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Late</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> On Leave</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', fontSize: '11px', border: '1px solid #27272a' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="present" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.4} name="Present (On Time)" />
                  <Area type="monotone" dataKey="late" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} name="Late Check-in" />
                  <Area type="monotone" dataKey="leave" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name="Approved Leave" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Staff Distribution</CardTitle>
            <CardDescription>Headcount breakdown by department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="h-44 w-full flex items-center justify-center my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="count">
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', fontSize: '11px', border: '1px solid #27272a' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {departmentData.map((dept, i) => (
                <div key={dept.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length] }} />
                  <span className="text-neutral-700 dark:text-neutral-300 truncate font-medium">{dept.name} ({dept.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Live Check-In Feed</CardTitle>
                <CardDescription>Real-time location verified check-in log</CardDescription>
              </div>
              <Button onClick={() => onNavigateTab('attendance')} variant="ghost" size="sm" className="text-xs">
                View Log <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayRecords.length > 0 ? (
                todayRecords.map(record => (
                  <div
                    key={record.id}
                    onClick={() => {
                      const emp = employees.find(e => e.employeeId === record.employeeId);
                      if (emp) onSelectEmployee(emp.id);
                    }}
                    className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar
                        style={record.avatarStyle}
                        seed={record.avatarSeed || record.employeeId}
                        src={record.avatar}
                        name={record.employeeName}
                        size="md"
                      />
                      <div>
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white">{record.employeeName}</p>
                        <p className="text-[10px] text-neutral-400">{record.department} • {record.checkIn || 'No Log'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'LATE' ? 'warning' : 'neutral'}>
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-neutral-400">No attendance entries recorded today.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Leave Action Center</CardTitle>
                <CardDescription>Leave requests awaiting admin decision</CardDescription>
              </div>
              <Button onClick={() => onNavigateTab('leave')} variant="ghost" size="sm" className="text-xs">
                Manage All <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingLeaves.length > 0 ? (
                pendingLeaves.map(leave => (
                  <div key={leave.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <EmployeeAvatar
                          style={leave.avatarStyle}
                          seed={leave.avatarSeed || leave.employeeId}
                          src={leave.avatar}
                          name={leave.employeeName}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white">{leave.employeeName}</p>
                          <p className="text-[10px] text-neutral-400">{leave.leaveType} • {leave.totalDays} Days</p>
                        </div>
                      </div>
                      <Badge variant="outline">PENDING</Badge>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 italic">"{leave.reason}"</p>
                    <div className="pt-1 flex justify-end gap-2">
                      <Button onClick={() => onNavigateTab('leave')} size="sm" className="text-xs py-1">
                        Review Request
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-neutral-400">No pending leave applications.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
