'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Eye, Star, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductCard({ product, viewMode = 'grid' }) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if product is in wishlist on mount
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const isInWishlist = wishlist.some(item => item.id === product.id);
    setIsWishlisted(isInWishlist);
  }, [product.id]);

  const handleAddToCart = (e) => {
    e.preventDefault();

    if (product.stock_quantity === 0) {
      toast.error('Product is out of stock');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      toast.error('Item already in cart');
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.sale_price || product.regular_price,
      image: product.images && product.images.length > 0 ? product.images[0].image_url : null,
      quantity: 1,
    };

    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Added to cart!');
  };

  const handleBuyNow = (e) => {
    e.preventDefault();

    if (product.stock_quantity === 0) {
      toast.error('Product is out of stock');
      return;
    }

    handleAddToCart(e);
    setTimeout(() => {
      router.push('/checkout');
    }, 300);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();

    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const existingIndex = wishlist.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      // Remove from wishlist
      wishlist.splice(existingIndex, 1);
      setIsWishlisted(false);
      toast.success('Removed from wishlist');
    } else {
      // Add to wishlist
      const wishlistItem = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        image: product.images && product.images.length > 0 ? product.images[0].image_url : null,
      };
      wishlist.push(wishlistItem);
      setIsWishlisted(true);
      toast.success('Added to wishlist');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const getImageUrl = () => {
    if (product.images && product.images.length > 0 && product.images[0].image_url) {
      return product.images[0].image_url;
    }
    return '/placeholder-product.png';
  };

  const calculateDiscount = () => {
    if (product.sale_price && product.regular_price) {
      const discount = ((product.regular_price - product.sale_price) / product.regular_price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discount = calculateDiscount();
  const finalPrice = product.sale_price || product.regular_price;
  const hasDiscount = product.sale_price && product.sale_price < product.regular_price;

  // List view layout
  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-row">
        {/* Image Container - Better size and aspect ratio */}
        <Link href={`/product/${product.slug}`} className="relative w-56 h-56 flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          {!imageError ? (
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl()}
                alt={product.name}
                fill
                className="object-contain group-hover:scale-110 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-slate-300" />
            </div>
          )}

          {/* Badges - Better positioning */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                {discount}% OFF
              </span>
            )}
            {product.stock_quantity === 0 && (
              <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                Out of Stock
              </span>
            )}
          </div>

          {/* Wishlist button on hover */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg ${
              isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-slate-700'
            } hover:scale-110`}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </Link>

        {/* Product Info - Better layout and spacing */}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          {/* Top Section */}
          <div>
            <Link href={`/product/${product.slug}`}>
              <h3 className="text-lg font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors mb-2 leading-snug">
                {product.name}
              </h3>
            </Link>

            {/* Rating & Reviews - Enhanced design */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-bold px-2.5 py-1 rounded-md shadow-sm">
                <span>{product.average_rating || 4}</span>
                <Star className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {product.review_count || 0} ratings
              </span>
            </div>

            {/* Price Section - More prominent */}
            <div className="mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-slate-900">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-slate-400 line-through font-medium">
                      ₹{product.regular_price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  You save ₹{(product.regular_price - finalPrice).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Stock Status */}
            {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
              <p className="text-sm text-orange-600 font-semibold mb-2">
                Only {product.stock_quantity} left in stock - order soon!
              </p>
            )}
          </div>

          {/* Bottom Section - Actions */}
          <div className="flex items-center gap-2.5 mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                product.stock_quantity === 0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-95'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock_quantity === 0}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                product.stock_quantity === 0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg active:scale-95'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view layout (default)
  return (
    <div className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Image Container */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        {!imageError ? (
          <Image
            src={getImageUrl()}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <ShoppingBag className="w-12 h-12 text-slate-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {discount}% OFF
            </span>
          )}
          {product.stock_quantity === 0 && (
            <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleWishlist}
            className={`p-1.5 rounded-full ${
              isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-slate-700'
            } hover:scale-110 transition-transform shadow-md`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/product/${product.slug}`;
            }}
            className="p-1.5 bg-white text-slate-700 rounded-full hover:scale-110 transition-transform shadow-md"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3">
        {/* Product Name */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors h-10">
            {product.name}
          </h3>
        </Link>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex items-center gap-0.5 bg-green-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            <span>{product.average_rating || 4}</span>
            <Star className="w-2.5 h-2.5 fill-white" />
          </div>
          <span className="text-xs text-slate-500">({product.review_count || 0})</span>
        </div>

        {/* Price */}
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.regular_price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-green-600 font-semibold">
                  {discount}% off
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            className={`flex-1 py-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
              product.stock_quantity === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{product.stock_quantity === 0 ? 'Out of Stock' : 'Cart'}</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={product.stock_quantity === 0}
            className={`flex-1 py-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
              product.stock_quantity === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
