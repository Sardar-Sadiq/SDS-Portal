import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/context/store-context';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, authLoading } = useStore();

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

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
