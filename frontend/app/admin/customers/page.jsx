'use client';

import { useEffect, useState } from 'react';
import { customerAPI } from '@/lib/api';
import { Search, Eye, Ban, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customerId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';

    try {
      await customerAPI.updateStatus(customerId, { status: newStatus });
      toast.success(`Customer ${newStatus === 'blocked' ? 'blocked' : 'activated'} successfully`);
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to update customer status');
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customers</h1>
          <p className="text-xs text-slate-600 mt-0.5">Manage your customer accounts</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Total Customers</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {customers.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Active Customers</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {customers.filter((c) => c.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Blocked Customers</div>
          <div className="text-xl font-bold text-red-600 mt-1">
            {customers.filter((c) => c.status === 'blocked').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No customers found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Customer accounts will appear here once they register'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Contact</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Joined Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Last Login</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="h-9 w-9 flex-shrink-0">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {customer.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-slate-900">{customer.name || 'N/A'}</div>
                        <div className="text-xs text-slate-500">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{customer.phone || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-900">
                      {customer.created_at ? format(new Date(customer.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-900">
                      {customer.last_login ? format(new Date(customer.last_login), 'MMM dd, yyyy') : 'Never'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {customer.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(customer.id, customer.status || 'active')}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                        customer.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={customer.status === 'active' ? 'Active - Click to block' : 'Blocked - Click to activate'}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform rounded-full bg-white transition-transform ${
                          customer.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
