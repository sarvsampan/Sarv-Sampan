'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import ProductCard from '@/components/user/ProductCard';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlistItems(wishlist);
    setLoading(false);
  };

  const saveWishlist = (items) => {
    localStorage.setItem('wishlist', JSON.stringify(items));
    setWishlistItems(items);
    // Trigger event to update header count
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const clearWishlist = () => {
    saveWishlist([]);
    toast.success('Wishlist cleared');
  };

  // Listen for wishlist updates from ProductCard component
  useEffect(() => {
    const handleWishlistUpdate = () => {
      loadWishlist();
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading wishlist...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-16 h-16 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Wishlist is Empty</h2>
            <p className="text-slate-600 mb-8">Save your favorite items here!</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Browse Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center space-x-2">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              <span>My Wishlist</span>
            </h1>
            <p className="text-slate-600 mt-1">{wishlistItems.length} items saved</p>
          </div>
          <Link
            href="/products"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {wishlistItems.map((item) => {
            // Transform wishlist item to match ProductCard's expected product structure
            const product = {
              id: item.id,
              name: item.name,
              slug: item.slug,
              sku: item.sku,
              regular_price: item.regular_price,
              sale_price: item.sale_price,
              stock_quantity: item.stock_quantity,
              images: item.image ? [{ image_url: item.image }] : [],
              average_rating: item.average_rating || 4,
              review_count: item.review_count || 0,
            };

            return (
              <ProductCard key={item.id} product={product} viewMode="grid" />
            );
          })}
        </div>

        {/* Clear Wishlist Button */}
        <div className="flex justify-center">
          <button
            onClick={clearWishlist}
            className="px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-semibold transition-colors"
          >
            Clear Wishlist
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

