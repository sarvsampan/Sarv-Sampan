'use client';

import { useEffect, useState } from 'react';
import { productAPI } from '@/lib/api';
import { AlertTriangle, XCircle, Package, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [products, setProducts] = useState({ lowStock: [], outOfStock: [], criticalStock: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('low');

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const response = await productAPI.getLowStock();
      setProducts(response.data || { lowStock: [], outOfStock: [], criticalStock: [] });
    } catch (error) {
      toast.error('Failed to fetch inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  const getStockColor = (quantity) => {
    if (quantity === 0) return 'text-red-600';
    if (quantity <= 5) return 'text-orange-600';
    return 'text-amber-600';
  };

  const getStockPercentage = (current, threshold) => {
    if (!threshold) return 0;
    return Math.min((current / threshold) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  const currentProducts =
    activeTab === 'low' ? products.lowStock :
    activeTab === 'out' ? products.outOfStock :
    products.criticalStock;

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Alerts</h1>
          <p className="text-xs text-slate-600 mt-0.5">Monitor low stock and out of stock products</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-amber-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-amber-600">Low Stock</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{products.lowStock?.length || 0}</div>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-red-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-red-600">Out of Stock</div>
              <div className="text-2xl font-bold text-red-700 mt-1">{products.outOfStock?.length || 0}</div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-orange-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-orange-600">Critical Stock</div>
              <div className="text-2xl font-bold text-orange-700 mt-1">{products.criticalStock?.length || 0}</div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('low')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'low'
              ? 'text-amber-700 border-b-2 border-amber-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Low Stock ({products.lowStock?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('out')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'out'
              ? 'text-red-700 border-b-2 border-red-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Out of Stock ({products.outOfStock?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('critical')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'critical'
              ? 'text-orange-700 border-b-2 border-orange-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Critical ({products.criticalStock?.length || 0})
        </button>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {currentProducts?.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <Package className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">All good!</h3>
            <p className="text-xs text-slate-500">No products in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentProducts?.map((product) => (
              <div key={product.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{product.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-slate-500">SKU: {product.sku || 'N/A'}</span>
                          {product.category && (
                            <>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{product.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">Current Stock</div>
                      <div className={`text-2xl font-bold ${getStockColor(product.stock_quantity)}`}>
                        {product.stock_quantity}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">Threshold</div>
                      <div className="text-lg font-semibold text-slate-700">
                        {product.low_stock_threshold || 10}
                      </div>
                    </div>

                    <div className="w-32">
                      <div className="text-xs text-slate-500 mb-1">Stock Level</div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            product.stock_quantity === 0
                              ? 'bg-red-600'
                              : product.stock_quantity <= 5
                              ? 'bg-orange-600'
                              : 'bg-amber-600'
                          }`}
                          style={{
                            width: `${getStockPercentage(product.stock_quantity, product.low_stock_threshold)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 text-center">
                        {Math.round(getStockPercentage(product.stock_quantity, product.low_stock_threshold))}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
