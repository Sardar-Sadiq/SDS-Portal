'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Search, Bell, Clock, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/motion/theme-toggle';

export const TopNav = ({
  darkMode,
  setDarkMode,
  collapsed,
  onOpenCheckIn,
  onNavigateTab
}) => {
  const { currentUser, notifications, markNotificationAsRead, dismissNotification, attendanceRecords } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadNotifs = notifications.filter(n => !n.read);
  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayAttendance = attendanceRecords.find(a => a.employeeId === currentUser?.employeeId && a.date === todayStr);

  const handleNotificationClick = (n) => {
    markNotificationAsRead(n.id);
    setShowNotifications(false);
    const titleLower = n.title.toLowerCase();
    if (titleLower.includes('leave')) {
      onNavigateTab('leave');
    } else if (titleLower.includes('check-in') || titleLower.includes('attendance') || titleLower.includes('geo-fence')) {
      onNavigateTab('attendance');
    } else if (titleLower.includes('employee') || titleLower.includes('staff')) {
      onNavigateTab('employees');
    } else {
      onNavigateTab('dashboard');
    }
  };

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

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white ring-2 ring-card" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-card border border-neutral-200 dark:border-neutral-800 shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white">Notifications</span>
                <span className="text-[10px] text-neutral-400">{unreadNotifs.length} unread</span>
              </div>
              <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors relative group/item ${
                        n.read ? 'bg-transparent text-neutral-500' : 'bg-neutral-50 dark:bg-neutral-900/80 font-medium text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 pr-5">
                        <span className="font-semibold text-neutral-900 dark:text-white group-hover/item:text-primary transition-colors">{n.title}</span>
                        <span className="text-[10px] text-neutral-400 shrink-0 font-mono">{n.time}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{n.message}</p>
                      <button
                        type="button"
                        aria-label="Dismiss notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(n.id);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-neutral-400">All caught up! No active notifications.</div>
                )}
              </div>
            </div>
          )}
        </div>

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
