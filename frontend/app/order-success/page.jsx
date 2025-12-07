'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Package, Home, ShoppingBag, Sparkles } from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';

export default function OrderSuccessPage() {
  const [orderNumber] = useState(() => 'ORD' + Date.now().toString().slice(-8));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-4 py-16 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-20 right-20 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 right-1/3 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          {/* Success Icon with Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full animate-ping opacity-20"></div>
              <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-2xl animate-bounce">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 animate-spin-slow">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 animate-fade-in">
              Order Placed Successfully! 🎉
            </h1>
            <p className="text-lg text-slate-600 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-slate-900">#{orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 mb-1">Order Date</p>
                <p className="text-lg font-semibold text-slate-900">
                  {new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                      <span>Order confirmation email sent to your inbox</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                      <span>We'll prepare your items for shipment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                      <span>You'll receive tracking details once shipped</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                      <span>Estimated delivery: 3-5 business days</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">PAYMENT METHOD</p>
                <p className="text-sm font-bold text-slate-900">Cash on Delivery</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">DELIVERY STATUS</p>
                <p className="text-sm font-bold text-emerald-600">Processing</p>
              </div>
            </div>

            {/* Track Order Button */}
            <Link
              href="/account/orders"
              className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Track Your Order
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/products"
              className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 mb-2">
              Need help with your order?
            </p>
            <Link
              href="/support"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Contact Customer Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
