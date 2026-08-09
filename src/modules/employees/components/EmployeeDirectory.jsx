'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Search, UserPlus, ChevronRight, MoreVertical, Trash2, User, BarChart2 } from 'lucide-react';

export const EmployeeDirectory = ({ onSelectEmployee, onOpenAddModal }) => {
  const { employees, attendanceRecords, activeRole, deleteEmployee } = useStore();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [activeMenuEmpId, setActiveMenuEmpId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, emp }

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (emp.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (emp.employeeId || '').toLowerCase().includes(search.toLowerCase()) ||
                          (emp.designation || '').toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    const matchesRole = selectedRole === 'ALL' || emp.role === selectedRole;
    return matchesSearch && matchesDept && matchesRole;
  });

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const handleContextMenu = (e, emp) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      emp
    });
  };

  const handleDelete = (emp) => {
    if (window.confirm(`Are you sure you want to delete ${emp.name} (${emp.email}) from the database?`)) {
      deleteEmployee(emp.id || emp.employeeId);
    }
    setContextMenu(null);
    setActiveMenuEmpId(null);
  };

  return (
    <div className="space-y-6 relative" onClick={() => setContextMenu(null)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Employee Directory</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Manage Spirit Data Solutions staff roster, roles, and profiles (Right-click row for actions)</p>
        </div>
        {activeRole === 'ADMIN' && (
          <Button onClick={onOpenAddModal} className="text-xs">
            <UserPlus className="w-4 h-4" /> Add Employee
          </Button>
        )}
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none transition-colors text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 text-neutral-800 dark:text-neutral-200"
          >
            <option value="ALL">All Departments ({employees.length})</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 text-neutral-800 dark:text-neutral-200"
          >
            <option value="ALL">All System Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 text-neutral-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Employee</th>
                  <th className="py-3.5 px-4 font-semibold">Department &amp; Title</th>
                  <th className="py-3.5 px-4 font-semibold">System Role</th>
                  <th className="py-3.5 px-4 font-semibold">Today's Check-In</th>
                  <th className="py-3.5 px-4 font-semibold">Leave Balance</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const todayAtt = attendanceRecords.find(a => a.employeeId === emp.employeeId && a.date === todayStr);
                    const isMenuOpen = activeMenuEmpId === emp.id;

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => onSelectEmployee(emp.id)}
                        onContextMenu={(e) => handleContextMenu(e, emp)}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60 cursor-pointer transition-colors group relative"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={emp.avatar} name={emp.name} size="md" />
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                {emp.name}
                                <span className="text-[10px] font-mono text-neutral-400 font-normal">({emp.employeeId})</span>
                              </p>
                              <p className="text-[11px] text-neutral-400">{emp.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-neutral-800 dark:text-neutral-200">{emp.designation}</p>
                          <p className="text-[10px] text-neutral-400">{emp.department}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={emp.role === 'ADMIN' ? 'accent' : 'neutral'}>
                            {emp.role}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          {todayAtt?.checkIn ? (
                            <div>
                              <span className="font-mono text-neutral-800 dark:text-neutral-200 font-semibold">{todayAtt.checkIn}</span>
                              <Badge variant={todayAtt.isLate ? 'warning' : 'success'} className="ml-2 text-[9px]">
                                {todayAtt.status}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Not logged</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {(emp.leaveBalance?.casual || 12) + (emp.leaveBalance?.sick || 8) + (emp.leaveBalance?.annual || 15)} days
                          </span>
                          <span className="text-[10px] text-neutral-400 block">({emp.leaveBalance?.annual || 15} annual)</span>
                        </td>

                        <td className="py-3.5 px-4 text-right relative">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSelectEmployee(emp.id)}
                              className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white text-xs"
                            >
                              View <ChevronRight className="w-4 h-4 ml-0.5" />
                            </Button>

                            {activeRole === 'ADMIN' && (
                              <button
                                onClick={() => setActiveMenuEmpId(isMenuOpen ? null : emp.id)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Action Dropdown Menu */}
                          {isMenuOpen && activeRole === 'ADMIN' && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-4 top-12 z-50 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1 text-xs text-left"
                            >
                              <button
                                onClick={() => {
                                  onSelectEmployee(emp.id);
                                  setActiveMenuEmpId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 font-medium"
                              >
                                <User className="w-3.5 h-3.5 text-blue-500" /> View Profile
                              </button>
                              <button
                                onClick={() => {
                                  onSelectEmployee(emp.id);
                                  setActiveMenuEmpId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 font-medium"
                              >
                                <BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> Attendance Report
                              </button>
                              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                              <button
                                onClick={() => handleDelete(emp)}
                                className="w-full px-3 py-2 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Profile
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No employee records found in SDS_Employees.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Right-Click Context Menu */}
      {contextMenu && activeRole === 'ADMIN' && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl py-1 text-xs text-left"
        >
          <div className="px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 font-bold text-neutral-900 dark:text-white truncate">
            {contextMenu.emp.name}
          </div>
          <button
            onClick={() => {
              onSelectEmployee(contextMenu.emp.id);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 font-medium"
          >
            <User className="w-3.5 h-3.5 text-blue-500" /> View Profile
          </button>
          <button
            onClick={() => {
              onSelectEmployee(contextMenu.emp.id);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 font-medium"
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> Attendance Report
          </button>
          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
          <button
            onClick={() => handleDelete(contextMenu.emp)}
            className="w-full px-3 py-2 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Profile
          </button>
        </div>
      )}
    </div>
  );
};
