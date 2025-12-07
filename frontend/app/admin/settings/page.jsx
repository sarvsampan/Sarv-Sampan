'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Store, Settings as SettingsIcon, Lock, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Store settings form
  const [storeForm, setStoreForm] = useState({
    storeName: 'My E-commerce Store',
    storeEmail: 'store@example.com',
    storePhone: '+1 (555) 123-4567',
    storeAddress: '123 Main Street, City, State 12345',
    currency: 'INR',
    taxRate: '18'
  });

  // General settings form
  const [generalForm, setGeneralForm] = useState({
    itemsPerPage: '20',
    dateFormat: 'MMM dd, yyyy',
    timeZone: 'Asia/Kolkata',
    maintenanceMode: false
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setAdmin(response.data);
      setProfileForm({
        name: response.data.name || ''
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(profileForm);
      updateUser(profileForm); // Update AuthContext and localStorage
      toast.success('Profile updated successfully');
      fetchAdminProfile();
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Store settings update API call would go here
      toast.success('Store settings updated successfully');
    } catch (error) {
      toast.error('Failed to update store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // General settings update API call would go here
      toast.success('General settings updated successfully');
    } catch (error) {
      toast.error('Failed to update general settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'store', label: 'Store Settings', icon: Store },
    { id: 'general', label: 'General', icon: SettingsIcon }
  ];

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-xs text-slate-600 mt-0.5">Manage your account and application settings</p>
      </div>

      <div className="flex gap-4">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white rounded-lg border border-slate-200 shadow-sm p-2 h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Profile Information</h2>
              <p className="text-sm text-slate-600 mb-6">Update your personal information</p>

              <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={admin?.email || ''}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Change Password</h2>
              <p className="text-sm text-slate-600 mb-6">Update your password to keep your account secure</p>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters long</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Store Settings Tab */}
          {activeTab === 'store' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Store Settings</h2>
              <p className="text-sm text-slate-600 mb-6">Configure your store information and preferences</p>

              <form onSubmit={handleStoreUpdate} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Store Email
                  </label>
                  <input
                    type="email"
                    required
                    value={storeForm.storeEmail}
                    onChange={(e) => setStoreForm({ ...storeForm, storeEmail: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Store Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={storeForm.storePhone}
                    onChange={(e) => setStoreForm({ ...storeForm, storePhone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Store Address
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={storeForm.storeAddress}
                    onChange={(e) => setStoreForm({ ...storeForm, storeAddress: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={storeForm.currency}
                      onChange={(e) => setStoreForm({ ...storeForm, currency: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={storeForm.taxRate}
                      onChange={(e) => setStoreForm({ ...storeForm, taxRate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">General Settings</h2>
              <p className="text-sm text-slate-600 mb-6">Configure general application settings</p>

              <form onSubmit={handleGeneralUpdate} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Items Per Page
                  </label>
                  <select
                    value={generalForm.itemsPerPage}
                    onChange={(e) => setGeneralForm({ ...generalForm, itemsPerPage: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={generalForm.dateFormat}
                    onChange={(e) => setGeneralForm({ ...generalForm, dateFormat: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MMM dd, yyyy">MMM dd, yyyy (Jan 01, 2024)</option>
                    <option value="dd/MM/yyyy">dd/MM/yyyy (01/01/2024)</option>
                    <option value="MM/dd/yyyy">MM/dd/yyyy (01/01/2024)</option>
                    <option value="yyyy-MM-dd">yyyy-MM-dd (2024-01-01)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Time Zone
                  </label>
                  <select
                    value={generalForm.timeZone}
                    onChange={(e) => setGeneralForm({ ...generalForm, timeZone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Maintenance Mode</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Enable maintenance mode to temporarily disable the store
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generalForm.maintenanceMode}
                        onChange={(e) => setGeneralForm({ ...generalForm, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
