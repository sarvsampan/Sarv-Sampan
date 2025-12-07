'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Package, Heart, Settings } from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      toast.error('Please login to view profile');
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData({
      name: parsedUser.name || '',
      email: parsedUser.email || '',
      phone: parsedUser.phone || '',
      address: parsedUser.address || '',
      city: parsedUser.city || '',
      state: parsedUser.state || '',
      pincode: parsedUser.pincode || '',
    });
  }, [router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditing(false);
        toast.success('Profile updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error('Failed to update profile');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              {/* User Info */}
              <div className="text-center pb-4 border-b border-slate-200">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900">{user.name}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              {/* Navigation */}
              <nav className="mt-4 space-y-1">
                <Link
                  href="/account/profile"
                  className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium"
                >
                  <Package className="w-4 h-4" />
                  <span>My Orders</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium"
                >
                  <Heart className="w-4 h-4" />
                  <span>My Wishlist</span>
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Profile Information</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {/* Form */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-lg">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{user.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address *
                    </label>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{user.email}</span>
                      </div>
                      {user.email_verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Verified</span>
                      )}
                      {!user.email_verified && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Not Verified</span>
                      )}
                    </div>
                    {editing && (
                      <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+91 1234567890"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-lg">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{user.phone || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Street Address
                    </label>
                    {editing ? (
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="House No., Building Name, Street Name"
                      />
                    ) : (
                      <div className="flex items-start space-x-2 px-3 py-2 bg-slate-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <span className="text-sm text-slate-900">{user.address || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      City
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter city"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{user.city || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      State
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter state"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{user.state || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pincode
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter pincode"
                        maxLength={6}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">{user.pincode || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {editing && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          address: user.address || '',
                          city: user.city || '',
                          state: user.state || '',
                          pincode: user.pincode || '',
                        });
                      }}
                      className="px-6 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
