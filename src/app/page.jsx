'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/store-context';
import { LoginView } from '@/modules/auth/components/LoginView';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { EmployeeDashboard } from '@/modules/dashboard/components/EmployeeDashboard';
import { AdminDashboard } from '@/modules/dashboard/components/AdminDashboard';
import { EmployeeDirectory } from '@/modules/employees/components/EmployeeDirectory';
import { EmployeeDetailsView } from '@/modules/employees/components/EmployeeDetailsView';
import { AttendanceView } from '@/modules/attendance/components/AttendanceView';
import { LeaveManagementView } from '@/modules/leave/components/LeaveManagementView';
import { SettingsView } from '@/modules/settings/components/SettingsView';
import { AnalyticsView } from '@/modules/analytics/components/AnalyticsView';
import { ProfileView } from '@/modules/profile/components/ProfileView';

import { GeoCheckInModal } from '@/modules/attendance/components/GeoCheckInModal';
import { AddEmployeeModal } from '@/modules/employees/components/AddEmployeeModal';
import { ApplyLeaveModal } from '@/modules/leave/components/ApplyLeaveModal';

export default function Home() {
  const { currentUser, activeRole, selectedEmployeeId, setSelectedEmployeeId } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!currentUser) {
    return <LoginView />;
  }

  const handleSelectEmployee = (empId) => {
    setSelectedEmployeeId(empId);
    setActiveTab('employee-details');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return activeRole === 'ADMIN' ? (
          <AdminDashboard
            onNavigateTab={setActiveTab}
            onOpenAddEmployee={() => setIsAddEmployeeModalOpen(true)}
            onSelectEmployee={handleSelectEmployee}
          />
        ) : (
          <EmployeeDashboard
            onNavigateTab={setActiveTab}
            onOpenCheckIn={() => setIsCheckInModalOpen(true)}
            onOpenApplyLeave={() => setIsApplyLeaveModalOpen(true)}
          />
        );

      case 'employees':
        return (
          <EmployeeDirectory
            onSelectEmployee={handleSelectEmployee}
            onOpenAddModal={() => setIsAddEmployeeModalOpen(true)}
          />
        );

      case 'employee-details':
        return (
          <EmployeeDetailsView
            employeeId={selectedEmployeeId || 'emp-002'}
            onBack={() => setActiveTab('employees')}
          />
        );

      case 'attendance':
        return (
          <AttendanceView
            onOpenCheckIn={() => setIsCheckInModalOpen(true)}
          />
        );

      case 'leave':
        return <LeaveManagementView />;

      case 'analytics':
        return <AnalyticsView />;

      case 'settings':
        return <SettingsView />;

      case 'profile':
        return <ProfileView />;

      default:
        return (
          <EmployeeDashboard
            onNavigateTab={setActiveTab}
            onOpenCheckIn={() => setIsCheckInModalOpen(true)}
            onOpenApplyLeave={() => setIsApplyLeaveModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <TopNav
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        collapsed={sidebarCollapsed}
        onOpenCheckIn={() => setIsCheckInModalOpen(true)}
        onNavigateTab={setActiveTab}
      />

      {/* Main container with pt-20 (80px) to clear fixed h-14 (56px) TopNav header */}
      <main
        className={`flex-1 pt-20 pb-10 px-4 sm:px-6 md:px-8 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {renderActiveView()}
        </div>
      </main>

      <GeoCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />

      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
      />

      <ApplyLeaveModal
        isOpen={isApplyLeaveModalOpen}
        onClose={() => setIsApplyLeaveModalOpen(false)}
      />
    </div>
  );
}
