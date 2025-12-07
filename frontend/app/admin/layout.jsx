'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) {
      setIsChecking(false);
      setIsAuthorized(true);
      return;
    }

    // Check authentication
    const checkAuth = () => {
      const adminToken = localStorage.getItem('adminToken');
      const userToken = localStorage.getItem('userToken');

      // If user token exists, it means user is logged in (not admin)
      if (userToken) {
        toast.error('Access denied. This area is for administrators only.');
        router.replace('/');
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      // If no admin token, redirect to admin login
      if (!adminToken) {
        toast.error('Please login as admin');
        router.replace('/admin/login');
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      // Admin is authenticated
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router, isLoginPage]);

  if (isLoginPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <AuthProvider>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
