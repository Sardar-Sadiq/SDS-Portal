import React from 'react';
import { useStore } from '@/context/store-context';
import {
  LayoutDashboard,
  Clock,
  CalendarOff,
  Users,
  Settings,
  UserCircle,
  LogOut,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AnimatedSidebar as BEUISidebar,
  AnimatedSidebarHeader,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuButton,
  useAnimatedSidebar,
} from '@/components/motion/animated-sidebar';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  // Mobile-specific props
  mobileOpen,
  setMobileOpen,
}) => {
  const { activeRole, logout, leaveRequests } = useStore();
  const pendingLeavesCount = leaveRequests.filter(l => l.status === 'PENDING').length;

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave Management', icon: CalendarOff, badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Purge', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
  ];

  const employeeNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'My Attendance', icon: Clock },
    { id: 'leave', label: 'Leave Management', icon: CalendarOff },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
  ];

  const navItems = activeRole === 'ADMIN' ? adminNavItems : employeeNavItems;

  // When a nav item is tapped on mobile, close the drawer immediately
  const handleNavSelect = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 flex flex-col
        bg-card border-r border-neutral-200 dark:border-neutral-800
        transition-all duration-300 ease-out
        /* Mobile: overlay drawer — slides in from left, always full-width */
        z-50 w-72
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        /* Desktop: fixed sidebar, responds to collapsed state */
        md:translate-x-0 md:z-40
        ${collapsed ? 'md:w-16' : 'md:w-64'}
      `}
    >
      {/* Brand Header */}
      <div className={`h-14 flex items-center border-b border-neutral-100 dark:border-neutral-800/80 px-3 ${
        collapsed ? 'md:justify-center justify-between' : 'justify-between'
      }`}>
        {/* On mobile: always show expanded brand */}
        <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? 'md:hidden' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            SDS
          </div>
          <div className="flex flex-col truncate">
            <span className="font-semibold text-xs text-neutral-900 dark:text-white tracking-tight leading-none">SDS EMS</span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono truncate">{activeRole}</span>
          </div>
        </div>

        {/* Desktop collapsed: show expand icon */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden md:flex w-9 h-9 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 items-center justify-center font-bold text-xs shadow-sm hover:opacity-90 transition-opacity"
            title="Expand Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Desktop expanded: show collapse icon */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}

        {/* Mobile: close drawer button */}
        <button
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="md:hidden flex w-8 h-8 rounded-lg items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Close Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <AnimatedSidebarGroup>
          {/* Show label always on mobile (drawer is always expanded), on desktop only when not collapsed */}
          <span className={`${collapsed ? 'md:hidden' : ''}`}>
            <AnimatedSidebarGroupLabel>Navigation</AnimatedSidebarGroupLabel>
          </span>
          <AnimatedSidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <AnimatedSidebarMenuItem key={item.id}>
                  <AnimatedSidebarMenuButton
                    isActive={isActive}
                    icon={<Icon className="w-4 h-4" />}
                    badge={item.badge}
                    onSelect={() => handleNavSelect(item.id)}
                  >
                    {/* Mobile: always show label (drawer is full-width) */}
                    {/* Desktop: hide label when collapsed */}
                    <span className={collapsed ? 'md:hidden' : ''}>
                      {item.label}
                    </span>
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              );
            })}
          </AnimatedSidebarMenu>
        </AnimatedSidebarGroup>
      </div>

      {/* Footer Log Out */}
      <div className="p-2 border-t border-neutral-100 dark:border-neutral-800/80">
        <button
          onClick={() => { logout(); if (setMobileOpen) setMobileOpen(false); }}
          title={collapsed ? 'Log out' : undefined}
          className={`w-full flex items-center rounded-lg text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors gap-3 px-3 py-2.5 ${
            collapsed ? 'md:justify-center md:w-10 md:h-10 md:mx-auto md:px-0' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>Log out</span>
        </button>
      </div>
    </aside>
  );
};
