'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import ProductCard from '@/components/user/ProductCard';
import { dealAPI } from '@/lib/userApi';
import toast from 'react-hot-toast';
import { Tag, ArrowLeft, Clock, Package, Percent } from 'lucide-react';

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchDeal();
    }
  }, [params.id]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealAPI.getDealById(params.id);
      setDeal(response.data);
    } catch (error) {
      toast.error('Failed to load deal');
      router.push('/deals');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading deal...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center">
            <Tag className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Deal Not Found</h2>
            <p className="text-slate-600 mb-6">This deal may have expired or been removed.</p>
            <button
              onClick={() => router.push('/deals')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Deals
            </button>
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
        {/* Back Button */}
        <button
          onClick={() => router.push('/deals')}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to All Deals
        </button>

        {/* Deal Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <Tag className="w-5 h-5" />
                <span className="text-sm font-semibold">SPECIAL OFFER</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-lg">
                {deal.title}
              </h1>
              <p className="text-lg text-orange-100 mb-4">
                {deal.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Valid until {formatDate(deal.end_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{deal.products?.length || 0} products available</span>
                </div>
              </div>
            </div>

            {/* Discount Badge */}
            <div className="bg-yellow-400 text-slate-900 rounded-2xl p-6 shadow-2xl">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Percent className="w-8 h-8" />
                  <span className="text-5xl font-bold">{deal.discount_percentage}</span>
                </div>
                <span className="text-lg font-bold">OFF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {deal.products && deal.products.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Products in this Deal
                <span className="text-slate-500 text-lg ml-2">({deal.products.length})</span>
              </h2>
              <p className="text-slate-600 mt-1">
                All products shown below are at special deal prices!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {deal.products.map((product) => (
                <ProductCard key={product.id} product={product} viewMode="grid" />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <Package className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Products Available</h3>
            <p className="text-slate-600 mb-6">
              This deal doesn't have any products yet. Check back soon!
            </p>
            <button
              onClick={() => router.push('/deals')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Browse Other Deals
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
