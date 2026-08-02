'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Search, Clock } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/motion/theme-toggle';

export const TopNav = ({
  darkMode,
  setDarkMode,
  collapsed,
  onOpenCheckIn,
  onNavigateTab
}) => {
  const { currentUser, attendanceRecords } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayAttendance = attendanceRecords.find(a => a.employeeId === currentUser?.employeeId && a.date === todayStr);

  return (
    <header className={`fixed top-0 right-0 z-30 h-14 bg-card/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-all duration-200 ease-in-out flex items-center justify-between px-4 sm:px-6 ${
      collapsed ? 'left-16' : 'left-64'
    }`}>
      {/* Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search employees, policies, leaves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none transition-colors text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Check-In CTA */}
        <button
          onClick={onOpenCheckIn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium transition-all active:scale-95 shadow-sm"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{userTodayAttendance?.checkIn ? 'Check Out / Status' : 'GPS Check In'}</span>
        </button>

        {/* BEUI Circle Blur Theme Toggle */}
        <ThemeToggle
          variant="circle-blur"
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* User Profile Pill */}
        <button
          onClick={() => onNavigateTab('profile')}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-none">{currentUser?.name}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">{currentUser?.designation}</p>
          </div>
          <Avatar src={currentUser?.avatar} name={currentUser?.name || 'User'} size="md" />
        </button>
      </div>
    </header>
  );
};
