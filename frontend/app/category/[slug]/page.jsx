'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, Grid3x3, List, ChevronDown, X } from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import ProductCard from '@/components/user/ProductCard';
import toast from 'react-hot-toast';

export default function CategoryPage() {
  const params = useParams();
  const [products, setProducts] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchCategoryInfo();
  }, [params.slug]);

  useEffect(() => {
    if (categoryInfo) {
      fetchCategoryProducts();
    }
  }, [categoryInfo, minPrice, maxPrice, inStock, sortBy, currentPage]);

  const fetchCategoryInfo = async () => {
    setCategoryLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/categories/${params.slug}`);

      if (!response.ok) {
        throw new Error('Category not found');
      }

      const result = await response.json();

      if (result.success) {
        setCategoryInfo(result.data);
      } else {
        toast.error('Category not found');
      }

      setCategoryLoading(false);
    } catch (error) {
      console.error('Error fetching category:', error);
      toast.error('Failed to load category');
      setCategoryLoading(false);
    }
  };

  const fetchCategoryProducts = async () => {
    setLoading(true);
    try {
      const params_url = new URLSearchParams();
      params_url.append('page', currentPage);
      params_url.append('limit', '12');
      params_url.append('category', categoryInfo.id);

      if (minPrice && parseInt(minPrice) > 0) {
        params_url.append('min_price', minPrice);
      }
      if (maxPrice && parseInt(maxPrice) > 0) {
        params_url.append('max_price', maxPrice);
      }

      // Add sort
      let sortValue = sortBy;
      if (sortBy === 'price-low') sortValue = 'price_low';
      if (sortBy === 'price-high') sortValue = 'price_high';
      params_url.append('sort', sortValue);

      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/products?${params_url.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const result = await response.json();

      if (result.success) {
        let productsList = result.data.products || [];

        // Filter out of stock products if inStock filter is enabled
        if (inStock) {
          productsList = productsList.filter(p => p.stock_quantity > 0);
        }

        setProducts(productsList);
        setTotalPages(result.data.pagination.totalPages || 1);
        setTotalProducts(result.data.pagination.total || 0);
      } else {
        toast.error('Failed to load products');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setLoading(false);
    }
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
  };

  const activeFiltersCount =
    (minPrice || maxPrice ? 1 : 0) +
    (inStock ? 1 : 0);

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading products...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Category Header - Redesigned */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 mb-6 border border-blue-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left Section - Category Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {categoryInfo?.name}
              </h1>
              {categoryInfo?.description && (
                <p className="text-slate-600 text-base mb-3 max-w-2xl">
                  {categoryInfo.description}
                </p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-700">
                    {totalProducts} Products Available
                  </span>
                </div>
                <span className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-slate-900">{products.length}</span> items
                </span>
              </div>
            </div>

            {/* Right Section - Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2.5 pr-10 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white font-medium shadow-sm hover:border-blue-400 transition-colors"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex border-2 border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Grid View"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Filters Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center space-x-2 px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`${
              showFilters ? 'fixed inset-0 z-50 bg-black/50 md:relative md:bg-transparent' : 'hidden'
            } md:block md:w-64 flex-shrink-0 md:sticky md:top-24 md:self-start`}
          >
            <div
              className={`${
                showFilters ? 'absolute right-0 top-0 h-full w-80 max-w-full' : 'relative'
              } bg-white p-6 rounded-xl border border-slate-200 overflow-y-auto md:max-h-[calc(100vh-7rem)]`}
            >
              {/* Mobile Close Button */}
              <div className="flex justify-between items-center mb-6 md:hidden">
                <h3 className="font-bold text-lg">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm text-slate-700">
                      Active Filters ({activeFiltersCount})
                    </h3>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <h3 className="font-semibold text-sm text-slate-900 mb-3">Price Range</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Min</label>
                      <input
                        type="number"
                        placeholder="₹ 0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="text-slate-400 mt-5">-</div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Max</label>
                      <input
                        type="number"
                        placeholder="₹ Any"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[500, 1000, 2000, 5000].map(price => (
                      <button
                        key={price}
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice(price.toString());
                        }}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded hover:bg-slate-100 hover:border-blue-500 transition-colors"
                      >
                        ₹{price}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="font-semibold text-sm text-slate-900 mb-3">Availability</h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">In Stock Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-600 mb-6">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-12">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
