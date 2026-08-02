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
import { NotificationStack } from '@/components/motion/notification-stack';
import { AnimatedToastStack } from '@/components/motion/animated-toast-stack';

export function App() {
  const { currentUser, activeRole, selectedEmployeeId, setSelectedEmployeeId, toasts, dismissToast, notifications, dismissNotification } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);

  const notificationItems = notifications.map(n => ({
    id: n.id,
    title: n.title,
    description: n.message,
    trailing: n.time
  }));

  const handleNotificationClick = (item) => {
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('leave')) {
      setActiveTab('leave');
    } else if (titleLower.includes('check-in') || titleLower.includes('attendance') || titleLower.includes('geo-fence')) {
      setActiveTab('attendance');
    } else if (titleLower.includes('employee') || titleLower.includes('staff')) {
      setActiveTab('employees');
    } else {
      setActiveTab('dashboard');
    }
  };

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
    <div className="min-h-screen bg-background text-foreground flex font-sans">
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

      {/* Main container with pt-20 to clear fixed header */}
      <main
        className={`flex-1 pt-20 pb-10 px-4 sm:px-6 md:px-8 transition-all duration-200 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'
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

      {/* BEUI Notification Stack (Fixed at Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <NotificationStack
          items={notificationItems}
          onDismiss={dismissNotification}
          onItemClick={handleNotificationClick}
          onViewAll={() => setActiveTab(activeRole === 'ADMIN' ? 'leave' : 'attendance')}
          collapsedLabel={`${notificationItems.length} Notifications`}
          expandedLabel={activeRole === 'ADMIN' ? "Review Requests" : "View Logs"}
        />
      </div>

      {/* BEUI Animated Toast Stack */}
      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
        fixed
      />
    </div>
  );
}

export default App;
