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
  PanelLeft
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
  setCollapsed
}) => {
  const { activeRole, logout, leaveRequests } = useStore();
  const pendingLeavesCount = leaveRequests.filter(l => l.status === 'PENDING').length;

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave Management', icon: CalendarOff, badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
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

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-card border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 ease-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-14 flex items-center border-b border-neutral-100 dark:border-neutral-800/80 px-3 ${
        collapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                SDS
              </div>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-xs text-neutral-900 dark:text-white tracking-tight leading-none">SDS EMS</span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono truncate">{activeRole}</span>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="w-9 h-9 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-sm hover:opacity-90 transition-opacity"
            title="Expand Sidebar"
          >
            <PanelLeft />
          </button>
        )}
      </div>

      {/* Navigation Items with BEUI Shared Layout Hover */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <AnimatedSidebarGroup>
          {!collapsed && (
            <AnimatedSidebarGroupLabel>Navigation</AnimatedSidebarGroupLabel>
          )}
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
                    onSelect={() => setActiveTab(item.id)}
                  >
                    {!collapsed ? item.label : undefined}
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
          onClick={logout}
          title={collapsed ? "Log out" : undefined}
          className={`w-full flex items-center rounded-lg text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors ${
            collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Log out</span>}
        </button>
      </div>
    </aside>
  );
};
