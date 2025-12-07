'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import toast from 'react-hot-toast';
import { cartAPI } from '@/lib/userApi';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await cartAPI.getCart();
      if (response.success && response.data) {
        // Transform cart items to match expected format
        const items = response.data.items.map(item => ({
          id: item.id,
          productId: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.sale_price || item.product.regular_price,
          quantity: item.quantity,
          image: item.product.product_images?.find(img => img.is_primary)?.image_url ||
                 item.product.product_images?.[0]?.image_url || '',
          sku: item.product.sku || 'N/A',
          stock: item.product.stock_quantity
        }));
        setCartItems(items);
        // Trigger event to update header count
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: items.length } }));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    // Find the item to check stock
    const item = cartItems.find(i => i.id === cartItemId);
    if (item && newQuantity > item.stock) {
      toast.error(`Only ${item.stock} items available in stock`);
      return;
    }

    try {
      await cartAPI.updateQuantity(cartItemId, newQuantity);
      await loadCart(); // Reload cart to get updated data
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(error?.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      await loadCart(); // Reload cart to get updated data
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      await loadCart(); // Reload cart to get updated data
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading cart...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-16 h-16 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
            <p className="text-slate-600 mb-8">Add some products to get started!</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Continue Shopping
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Shopping Cart
          </h1>
          <Link
            href="/products"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-slate-200 p-3"
              >
                <div className="flex gap-3">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-20 h-20 bg-slate-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <Link
                          href={`/product/${item.slug}`}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-1">SKU: {item.sku}</p>
                        {item.stock < 10 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Only {item.stock} left in stock
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 border border-slate-300 rounded hover:bg-slate-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            updateQuantity(item.id, value);
                          }}
                          min="1"
                          max={item.stock}
                          className="w-12 h-7 text-center text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-7 h-7 border border-slate-300 rounded hover:bg-slate-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-slate-500">
                          ₹{item.price.toLocaleString('en-IN')} each
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <button
              onClick={clearCart}
              className="w-full py-3 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-semibold transition-colors"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 sticky top-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                <div className="flex justify-between text-sm text-slate-700">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-700">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-emerald-600 font-semibold">FREE</span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-xl font-bold text-slate-900">
                  ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Free Shipping Notice */}
              {shipping > 0 && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for FREE shipping!
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="block w-full py-3 bg-emerald-600 text-white text-center rounded-lg font-semibold hover:bg-emerald-700 transition-colors mb-2"
              >
                Proceed to Checkout
              </Link>

              <p className="text-xs text-slate-500 text-center">
                Secure checkout with SSL encryption
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
