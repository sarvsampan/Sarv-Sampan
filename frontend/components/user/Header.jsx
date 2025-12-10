'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Phone,
  Mail,
  ChevronDown,
  UserCircle,
  Package,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cartAPI, wishlistAPI } from '@/lib/userApi';

export default function Header({ showNavigation = false }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const [categories, setCategories] = useState([]);

  // Check login status and fetch categories on mount
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }

    // Fetch categories
    fetchCategories();

    // Update cart and wishlist counts
    updateCounts();

    // Listen for storage changes to update counts
    window.addEventListener('storage', updateCounts);
    window.addEventListener('cartUpdated', updateCounts);
    window.addEventListener('wishlistUpdated', updateCounts);

    // Scroll detection for navigation
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('cartUpdated', updateCounts);
      window.removeEventListener('wishlistUpdated', updateCounts);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const updateCounts = async () => {
    // Get cart count from database
    try {
      const cartResponse = await cartAPI.getCart();
      if (cartResponse.success && cartResponse.data) {
        setCartCount(cartResponse.data.count || 0);
      }
    } catch (error) {
      // If error, set to 0
      setCartCount(0);
    }

    // Get wishlist count from database (only if logged in)
    const token = localStorage.getItem('userToken');
    if (token) {
      try {
        const wishlistResponse = await wishlistAPI.getWishlist();
        if (wishlistResponse.success && wishlistResponse.data) {
          setWishlistCount(wishlistResponse.data.count || 0);
        }
      } catch (error) {
        // If error or not logged in, set to 0
        setWishlistCount(0);
      }
    } else {
      setWishlistCount(0);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/categories');

      if (!response.ok) {
        console.warn(`Categories API returned status: ${response.status}. Using fallback categories.`);
        setCategories([
          { name: 'Electronics', slug: 'electronics' },
          { name: 'Fashion', slug: 'fashion' },
          { name: 'Home & Living', slug: 'home-living' },
          { name: 'Sports', slug: 'sports' },
        ]);
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Already filtered to active categories by backend
        const categories = data.data
          .slice(0, 5)
          .map(cat => ({
            name: cat.name,
            slug: cat.slug
          }));

        setCategories(categories);

        if (categories.length === 0) {
          console.warn('No active categories found! Using fallback...');
          setCategories([
            { name: 'Electronics', slug: 'electronics' },
            { name: 'Fashion', slug: 'fashion' },
            { name: 'Home & Living', slug: 'home-living' },
            { name: 'Sports', slug: 'sports' },
          ]);
        }
      } else {
        console.warn('API response format unexpected. Using fallback categories.');
        setCategories([
          { name: 'Electronics', slug: 'electronics' },
          { name: 'Fashion', slug: 'fashion' },
          { name: 'Home & Living', slug: 'home-living' },
          { name: 'Sports', slug: 'sports' },
        ]);
      }
    } catch (error) {
      console.warn('Failed to fetch categories. Using fallback categories.');
      // Fallback to default categories if API fails
      setCategories([
        { name: 'Electronics', slug: 'electronics' },
        { name: 'Fashion', slug: 'fashion' },
        { name: 'Home & Living', slug: 'home-living' },
        { name: 'Sports', slug: 'sports' },
      ]);
    }
  };

  // Debounce search
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        fetchSearchSuggestions(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery]);

  const fetchSearchSuggestions = async (query) => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_USER_API_URL}/products?search=${encodeURIComponent(query)}&limit=5`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.products) {
          setSearchResults(result.data.products);
          setShowSearchDropdown(true);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchResultClick = (slug) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    router.push(`/product/${slug}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/SSE Logo Icon Without BG.png"
              alt="Sarv Sampan Enterprises"
              className="w-14 h-14 object-contain"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-slate-900">Sarv Sampan</h1>
              <p className="text-xs text-slate-500">Your Trusted Shopping Partner</p>
            </div>
          </Link>

          {/* Search Bar with Autocomplete */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
            <div className="relative search-container">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs font-semibold text-slate-600 px-2">
                          Found {searchResults.length} product{searchResults.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleSearchResultClick(product.slug)}
                          className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                        >
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 truncate mb-1">
                              {product.name}
                            </h4>
                            {product.category && (
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {product.category.name}
                              </span>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-base font-bold text-blue-600">
                                ₹{(product.sale_price || product.regular_price).toLocaleString('en-IN')}
                              </span>
                              {product.sale_price && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{product.regular_price.toLocaleString('en-IN')}
                                </span>
                              )}
                              {product.sale_price && (
                                <span className="text-xs font-semibold text-green-600">
                                  {Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)}% off
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stock Badge */}
                          {product.stock_quantity > 0 ? (
                            <span className="text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 font-semibold px-2 py-1 bg-red-50 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      ))}

                      {/* View All Results Button */}
                      <div className="p-2 bg-slate-50 border-t border-slate-200">
                        <button
                          type="submit"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
                          }}
                          className="w-full py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        >
                          View All Results for "{searchQuery}"
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm text-slate-500">No products found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors hidden md:block"
            >
              <Heart className="w-6 h-6 text-slate-700" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-slate-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account */}
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-700 hidden md:block" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email || ''}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/account/profile"
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      <span className="font-medium">My Profile</span>
                    </Link>
                    <Link
                      href="/account/orders"
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span className="font-medium">My Orders</span>
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">My Wishlist</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline">Login</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-700" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search with Autocomplete */}
        <form onSubmit={handleSearch} className="mt-4 md:hidden">
          <div className="relative search-container">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSearchResultClick(product.slug)}
                        className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">
                            {product.name}
                          </h4>
                          <span className="text-xs font-bold text-blue-600">
                            ₹{(product.sale_price || product.regular_price).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 border-t border-slate-100 bg-slate-50">
                      <button
                        onClick={handleSearch}
                        className="w-full text-center text-xs font-semibold text-blue-600 py-2"
                      >
                        View all results
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-slate-500">No products found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Navigation */}
      {showNavigation && (
        <nav className={`bg-slate-50 border-t border-slate-200 hidden md:block transition-all duration-300 ease-in-out overflow-hidden ${
          isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
        }`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-1 py-2">
              <Link
                href="/products"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
              >
                All Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/deals"
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-white rounded-lg transition-colors"
              >
                🔥 Deals
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Menu */}
      {showNavigation && mobileMenuOpen && (
        <div className={`md:hidden bg-white border-t border-slate-200 transition-all duration-300 ease-in-out overflow-hidden ${
          isScrolled ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
        }`}>
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link
              href="/products"
              className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              All Products
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            <Link
              href="/deals"
              className="block px-4 py-2 text-sm font-medium text-red-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              🔥 Deals
            </Link>
            <Link
              href="/wishlist"
              className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Wishlist ({wishlistCount})
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
