'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const isNewUser = searchParams.get('isNewUser') === 'true';
    const error = searchParams.get('error');

    if (error) {
      const message = searchParams.get('message') || 'Google authentication failed';
      toast.error(message);
      router.push('/login');
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));

        // Store auth data
        localStorage.setItem('userToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Show success message
        if (isNewUser) {
          toast.success('Account created successfully! Welcome!');
        } else {
          toast.success('Login successful! Welcome back!');
        }

        // Check if user came from checkout
        const returnToCheckout = localStorage.getItem('returnToCheckout');
        if (returnToCheckout === 'true') {
          localStorage.removeItem('returnToCheckout');
          router.push('/checkout');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        toast.error('Authentication failed. Please try again.');
        router.push('/login');
      }
    } else {
      toast.error('Invalid authentication response');
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Completing Sign In...</h2>
        <p className="text-sm text-slate-600">Please wait while we authenticate your account.</p>
      </div>
    </div>
  );
}
