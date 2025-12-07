'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();

  // Get first letter from name or email
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'A';
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-end">
      <div className="flex items-center space-x-3 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-900">{user?.name || 'Admin'}</p>
          <p className="text-[10px] text-slate-500">{user?.email || 'admin@example.com'}</p>
        </div>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">
            {getInitial()}
          </span>
        </div>
      </div>
    </header>
  );
}
