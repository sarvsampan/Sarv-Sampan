'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  XCircle,
  AlertTriangle,
  RefreshCw,
  Home,
  ShoppingBag,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order');
  const reason = searchParams.get('reason') || 'unknown';
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Countdown timer for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getFailureReason = (code) => {
    const reasons = {
      'payment_failed': 'Payment could not be processed',
      'user_cancelled': 'Payment was cancelled by you',
      'timeout': 'Payment session timed out',
      'insufficient_funds': 'Insufficient funds in your account',
      'invalid_card': 'Card details were invalid',
      'network_error': 'Network connection issue',
      'bank_declined': 'Payment declined by your bank',
      'unknown': 'Payment could not be completed'
    };
    return reasons[code] || reasons['unknown'];
  };

  const handleRetryPayment = () => {
    if (orderNumber) {
      router.push(`/checkout?retry=${orderNumber}`);
    } else {
      router.push('/cart');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <Header />

      <main className="container mx-auto px-4 py-16 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-20 right-20 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-yellow-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          {/* Failure Icon with Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-full animate-ping opacity-20"></div>
              <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-2xl">
                <XCircle className="w-14 h-14 text-white animate-shake" />
              </div>
              <div className="absolute -top-2 -right-2 animate-bounce">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 animate-fade-in">
              Payment Failed
            </h1>
            <p className="text-lg text-slate-600 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {getFailureReason(reason)}
            </p>
          </div>

          {/* Error Details Card */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 mb-6">
            {/* What Happened */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-2">What happened?</h3>
                  <p className="text-sm text-slate-700 mb-3">
                    Your payment could not be completed. Don't worry, no money has been deducted from your account.
                  </p>
                  {orderNumber && (
                    <div className="bg-white/50 rounded px-3 py-2">
                      <p className="text-xs text-slate-600 mb-1">Order Number</p>
                      <p className="text-sm font-mono font-semibold text-slate-900">
                        {orderNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Common Reasons */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3">Common reasons for payment failure:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></div>
                  <span>Insufficient balance in your account</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></div>
                  <span>Incorrect card details or CVV</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></div>
                  <span>Your bank declined the transaction</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></div>
                  <span>Network or connectivity issues</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></div>
                  <span>Card limit exceeded</span>
                </li>
              </ul>
            </div>

            {/* Retry Payment Button */}
            <button
              onClick={handleRetryPayment}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg mb-3"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry Payment</span>
            </button>

            <p className="text-xs text-center text-slate-600">
              You can try a different payment method or card
            </p>
          </div>

          {/* Alternative Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

          {/* Help & Support */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 text-center">Need Help?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="tel:+911234567890"
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Call Us</span>
                <span className="text-xs text-slate-600">1800-123-4567</span>
              </a>
              <a
                href="mailto:support@example.com"
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Email Us</span>
                <span className="text-xs text-slate-600">support@store.com</span>
              </a>
              <Link
                href="/support"
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Live Chat</span>
                <span className="text-xs text-slate-600">Get instant help</span>
              </Link>
            </div>
          </div>

          {/* Auto Redirect Notice */}
          {countdown > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Redirecting to cart in <span className="font-bold text-blue-600">{countdown}</span> seconds...
              </p>
            </div>
          )}
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

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
