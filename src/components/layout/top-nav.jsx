'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Search, Clock, Menu } from 'lucide-react';
import { EmployeeAvatar } from '@/modules/profile/components/EmployeeAvatar';
import { ThemeToggle } from '@/components/motion/theme-toggle';

export const TopNav = ({
  darkMode,
  setDarkMode,
  collapsed,
  onOpenCheckIn,
  onNavigateTab,
  onToggleMobileNav, // new: opens the mobile sidebar drawer
}) => {
  const { currentUser, attendanceRecords } = useStore();
  const [searchFocused, setSearchFocused] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayAttendance = attendanceRecords.find(
    (a) => a.employeeId === currentUser?.employeeId && a.date === todayStr
  );
  const hasCheckedIn = Boolean(userTodayAttendance?.checkIn);

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-14
        bg-card/80 backdrop-blur-md
        border-b border-neutral-200 dark:border-neutral-800
        transition-all duration-200 ease-in-out
        flex items-center justify-between px-3 sm:px-5 gap-2
        /* Mobile: always full-width (sidebar is overlay, not inline) */
        left-0
        /* Desktop: account for fixed sidebar width */
        ${collapsed ? 'md:left-16' : 'md:left-64'}
      `}
    >
      {/* Left: Hamburger (mobile only) + Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onToggleMobileNav}
          className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar — hidden on xs to save space for action buttons */}
        <div className={`relative flex-1 min-w-0 hidden sm:block`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, leaves…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:outline-none transition-colors text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Right: Check In CTA + theme + avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* GPS Check In / Check Out button */}
        <button
          onClick={onOpenCheckIn}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm ${
            hasCheckedIn
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
              : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden xs:inline sm:inline whitespace-nowrap">
            {hasCheckedIn ? 'Check Out' : 'Check In'}
          </span>
        </button>

        {/* Theme toggle */}
        <ThemeToggle
          variant="circle-blur"
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="hidden sm:block h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

        {/* User avatar / profile button */}
        <button
          onClick={() => onNavigateTab('profile')}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Open profile"
        >
          {/* Name + designation — hidden on small screens */}
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-none truncate max-w-[120px]">
              {currentUser?.name}
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[120px]">
              {currentUser?.designation}
            </p>
          </div>
          <EmployeeAvatar
            style={currentUser?.avatarStyle}
            seed={currentUser?.avatarSeed || currentUser?.employeeId || currentUser?.id}
            src={currentUser?.card_image || currentUser?.avatar}
            name={currentUser?.name || 'User'}
            employee={currentUser}
            size="md"
          />
        </button>
      </div>
    </header>
  );
};
