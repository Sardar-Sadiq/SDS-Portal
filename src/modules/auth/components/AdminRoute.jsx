import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/context/store-context';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { currentUser, activeRole, authLoading, showToast } = useStore();
  const toastShownRef = useRef(false);

  const role = (activeRole || currentUser?.role || '').toLowerCase();
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!authLoading && currentUser && !isAdmin && !toastShownRef.current) {
      toastShownRef.current = true;
      if (showToast) {
        showToast({
          title: "Access Denied",
          description: "You don't have access to this page.",
          status: "error"
        });
      }
    }
  }, [authLoading, currentUser, isAdmin, showToast]);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;
