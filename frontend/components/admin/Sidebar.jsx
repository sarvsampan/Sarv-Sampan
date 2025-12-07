'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  RefreshCw,
  Repeat,
  CreditCard,
  Ticket,
  Tag,
  AlertTriangle,
  Settings,
  LogOut,
  Store,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: FolderTree, label: 'Categories', path: '/admin/categories' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
  { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
  { icon: Tag, label: 'Deals', path: '/admin/deals' },
  { icon: RefreshCw, label: 'Returns', path: '/admin/returns' },
  { icon: Repeat, label: 'Replacements', path: '/admin/replacements' },
  { icon: AlertTriangle, label: 'Inventory', path: '/admin/inventory' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="h-16 px-5 flex items-center border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-slate-400">E-Commerce</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto sidebar-scrollbar">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-3 px-3">Menu</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-all text-sm font-medium cursor-pointer"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: rgb(15 23 42);
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(15 23 42);
          border-radius: 3px;
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(30 41 59);
        }

        .sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(15 23 42) rgb(15 23 42);
        }
      `}</style>
    </div>
  );
}
