'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminAuthCheck({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      toast.error('Please login as admin to access this page');
      router.replace('/admin/login');
      return;
    }

    // Verify it's admin token (you can add more checks here)
    // For now, just checking if admin token exists

  }, [router]);

  return <>{children}</>;
}
