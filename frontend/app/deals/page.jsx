'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import { dealAPI } from '@/lib/userApi';
import toast from 'react-hot-toast';
import { Tag, Clock, TrendingUp, Percent, Calendar, Sparkles, Zap, ArrowRight, Timer } from 'lucide-react';

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await dealAPI.getActiveDeals();
      setDeals(response.data || []);
    } catch (error) {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getTimeRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-pulse">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-semibold">LIVE DEALS</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
                Hot Deals & Offers
              </h1>
              <p className="text-xl md:text-2xl text-orange-100 mb-2">
                Save up to <span className="text-5xl font-bold text-yellow-300">80%</span>
              </p>
              <p className="text-lg text-orange-100">
                Limited time offers - Grab them before they're gone!
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Loading amazing deals...</p>
              </div>
            </div>
          ) : deals.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-6">
                <Tag className="w-12 h-12 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No Active Deals</h3>
              <p className="text-slate-600 text-lg mb-6">Check back soon for exciting offers!</p>
              <button
                onClick={() => router.push('/products')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
              >
                Browse All Products
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* Deals Grid */
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
                  <Sparkles className="w-8 h-8 text-orange-500" />
                  <span>Active Deals</span>
                  <Sparkles className="w-8 h-8 text-orange-500" />
                </h2>
                <p className="text-slate-600">
                  {deals.length} amazing {deals.length === 1 ? 'deal' : 'deals'} waiting for you
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {deals.map((deal, index) => {
                  const timeLeft = getTimeRemaining(deal.end_date);
                  const isExpiringSoon = getDaysRemaining(deal.end_date) <= 3;

                  return (
                    <div
                      key={deal.id}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Deal Banner */}
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
                        {deal.banner_image ? (
                          <img
                            src={deal.banner_image}
                            alt={deal.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="w-32 h-32 text-white opacity-30" />
                          </div>
                        )}

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                        {/* Discount Badge */}
                        <div className="absolute top-3 right-3 bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-xl font-bold text-lg shadow-lg transform group-hover:scale-105 transition-transform">
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4" />
                            <span>{deal.discount_percentage}%</span>
                          </div>
                        </div>

                        {/* Expiring Soon Badge */}
                        {isExpiringSoon && (
                          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            Ending Soon!
                          </div>
                        )}

                        {/* Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-1">
                            {deal.title}
                          </h3>
                        </div>
                      </div>

                      {/* Deal Content */}
                      <div className="p-4">
                        <p className="text-slate-600 mb-4 line-clamp-2 text-sm">
                          {deal.description}
                        </p>

                        {/* Countdown Timer */}
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-semibold">Time Left:</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-2 text-center border border-orange-200">
                              <div className="text-lg font-bold text-orange-600">{timeLeft.days}</div>
                              <div className="text-[10px] text-slate-600 font-medium">Days</div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-2 text-center border border-orange-200">
                              <div className="text-lg font-bold text-orange-600">{timeLeft.hours}</div>
                              <div className="text-[10px] text-slate-600 font-medium">Hours</div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-2 text-center border border-orange-200">
                              <div className="text-lg font-bold text-orange-600">{timeLeft.minutes}</div>
                              <div className="text-[10px] text-slate-600 font-medium">Mins</div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-2 text-center border border-orange-200">
                              <div className="text-lg font-bold text-orange-600">{timeLeft.seconds}</div>
                              <div className="text-[10px] text-slate-600 font-medium">Secs</div>
                            </div>
                          </div>
                        </div>

                        {/* Deal Info */}
                        <div className="space-y-2 mb-4 bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-600">
                              <span className="font-semibold text-slate-900">Starts:</span> {new Date(deal.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-600">
                              <span className="font-semibold text-slate-900">Ends:</span> {new Date(deal.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={() => router.push(`/deals/${deal.id}`)}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                        >
                          <span>View Products</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Banner */}
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <TrendingUp className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-2">Don't Miss Out!</h3>
                      <p className="text-orange-100 text-lg">
                        These incredible deals won't last forever. Shop now and save big!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/products')}
                    className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors shadow-xl whitespace-nowrap flex items-center gap-2"
                  >
                    Browse All Products
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
