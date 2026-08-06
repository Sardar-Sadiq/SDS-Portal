import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/context/store-context';
import { LoginView } from '@/modules/auth/components/LoginView';
import { AuthCallback } from '@/modules/auth/components/AuthCallback';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { AdminRoute } from '@/modules/auth/components/AdminRoute';
import { useInactivityTimeout } from '@/modules/auth/useInactivityTimeout';

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

// Authenticated Main Layout Wrapper
const PortalLayout = () => {
  const {
    currentUser,
    activeRole,
    selectedEmployeeId,
    setSelectedEmployeeId,
    toasts,
    dismissToast,
    notifications,
    dismissNotification,
    logout
  } = useStore();

  const navigate = useNavigate();
  const location = useLocation();

  // Inactivity auto sign-out (default 8 hours)
  useInactivityTimeout(() => {
    logout();
    navigate('/login', { replace: true });
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  // Mobile sidebar drawer state — separate from desktop collapsed state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);

  // Map route path to activeTab string for Sidebar highlight compatibility
  const getActiveTabFromPath = (path) => {
    if (path.includes('/employees') || path.includes('/admin/employees')) return 'employees';
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/leave')) return 'leave';
    if (path.includes('/analytics') || path.includes('/admin/analytics')) return 'analytics';
    if (path.includes('/settings') || path.includes('/admin/settings')) return 'settings';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/employee-details')) return 'employee-details';
    return 'dashboard';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleSetActiveTab = (tabId) => {
    const roleUpper = (activeRole || currentUser?.role || '').toUpperCase();

    switch (tabId) {
      case 'dashboard':
        navigate(roleUpper === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
        break;
      case 'employees':
        navigate('/employees');
        break;
      case 'attendance':
        navigate('/attendance');
        break;
      case 'leave':
        navigate('/leave');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleSelectEmployee = (empId) => {
    setSelectedEmployeeId(empId);
    navigate('/employee-details');
  };

  const notificationItems = notifications.map(n => ({
    id: n.id,
    title: n.title,
    description: n.message,
    trailing: n.time
  }));

  const handleNotificationClick = (item) => {
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('leave')) {
      handleSetActiveTab('leave');
    } else if (titleLower.includes('check-in') || titleLower.includes('attendance') || titleLower.includes('geo-fence')) {
      handleSetActiveTab('attendance');
    } else if (titleLower.includes('employee') || titleLower.includes('staff')) {
      handleSetActiveTab('employees');
    } else {
      handleSetActiveTab('dashboard');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Mobile backdrop — tapping it closes the sidebar drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
      />

      <TopNav
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        collapsed={sidebarCollapsed}
        onOpenCheckIn={() => setIsCheckInModalOpen(true)}
        onNavigateTab={handleSetActiveTab}
        onToggleMobileNav={() => setMobileNavOpen(v => !v)}
      />

      {/* Main content
          Mobile:  no left margin (sidebar is an overlay, not inline)
          Desktop: margin matches sidebar width (collapsed 16 / expanded 64)
      */}
      <main
        className={`flex-1 pt-20 pb-10 px-4 sm:px-6 md:px-8 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <Routes>
            {/* Employee Dashboard */}
            <Route
              path="/dashboard"
              element={
                <EmployeeDashboard
                  onNavigateTab={handleSetActiveTab}
                  onOpenCheckIn={() => setIsCheckInModalOpen(true)}
                  onOpenApplyLeave={() => setIsApplyLeaveModalOpen(true)}
                />
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard
                    onNavigateTab={handleSetActiveTab}
                    onOpenAddEmployee={() => setIsAddEmployeeModalOpen(true)}
                    onSelectEmployee={handleSelectEmployee}
                  />
                </AdminRoute>
              }
            />

            {/* Shared Protected Routes */}
            <Route
              path="/attendance"
              element={<AttendanceView onOpenCheckIn={() => setIsCheckInModalOpen(true)} />}
            />
            <Route path="/leave" element={<LeaveManagementView />} />
            <Route path="/profile" element={<ProfileView />} />

            {/* Admin Protected Routes */}
            <Route
              path="/employees"
              element={
                <AdminRoute>
                  <EmployeeDirectory
                    onSelectEmployee={handleSelectEmployee}
                    onOpenAddModal={() => setIsAddEmployeeModalOpen(true)}
                  />
                </AdminRoute>
              }
            />
            <Route
              path="/employee-details"
              element={
                <AdminRoute>
                  <EmployeeDetailsView
                    employeeId={selectedEmployeeId || 'emp-002'}
                    onBack={() => handleSetActiveTab('employees')}
                  />
                </AdminRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <AdminRoute>
                  <AnalyticsView />
                </AdminRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AdminRoute>
                  <SettingsView />
                </AdminRoute>
              }
            />

            {/* Fallback redirect */}
            <Route
              path="*"
              element={
                <Navigate
                  to={(activeRole || '').toUpperCase() === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                  replace
                />
              }
            />
          </Routes>
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

      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <NotificationStack
          items={notificationItems}
          onDismiss={dismissNotification}
          onItemClick={handleNotificationClick}
          onViewAll={() => handleSetActiveTab(activeRole === 'ADMIN' ? 'leave' : 'attendance')}
          collapsedLabel={`${notificationItems.length} Notifications`}
          expandedLabel={activeRole === 'ADMIN' ? "Review Requests" : "View Logs"}
        />
      </div>

      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
        fixed
      />
    </div>
  );
};

export function App() {
  const { currentUser, authLoading } = useStore();

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs animate-pulse">
            SDS
          </div>
          <span className="text-xs font-medium text-muted-foreground">Initializing SDS EMS...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected Portal Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
