'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingUp, Package, Clock, Star, ShoppingBag, Truck, Shield, Headphones, Tag, Percent } from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import ProductCard from '@/components/user/ProductCard';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [dealOfTheDay, setDealOfTheDay] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
    fetchCategories();
    fetchDeals();
  }, []);

  // Countdown timer for Deal of the Day
  useEffect(() => {
    if (!dealOfTheDay || !dealOfTheDay.end_date) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endDate = new Date(dealOfTheDay.end_date).getTime();
      const difference = endDate - now;

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeRemaining({ hours, minutes, seconds });
      } else {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [dealOfTheDay]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/categories`);

      if (!response.ok) {
        console.warn(`Categories API returned status: ${response.status}. Using fallback categories.`);
        setCategories([
          { id: 1, name: 'Electronics', slug: 'electronics' },
          { id: 2, name: 'Fashion', slug: 'fashion' },
          { id: 3, name: 'Home & Living', slug: 'home-living' },
          { id: 4, name: 'Sports', slug: 'sports' },
        ]);
        setCategoriesLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setCategories(result.data || []);
      } else {
        console.warn('Categories API response format unexpected. Using fallback categories.');
        setCategories([
          { id: 1, name: 'Electronics', slug: 'electronics' },
          { id: 2, name: 'Fashion', slug: 'fashion' },
          { id: 3, name: 'Home & Living', slug: 'home-living' },
          { id: 4, name: 'Sports', slug: 'sports' },
        ]);
      }
    } catch (error) {
      console.warn('Failed to fetch categories. Using fallback categories.');
      setCategories([
        { id: 1, name: 'Electronics', slug: 'electronics' },
        { id: 2, name: 'Fashion', slug: 'fashion' },
        { id: 3, name: 'Home & Living', slug: 'home-living' },
        { id: 4, name: 'Sports', slug: 'sports' },
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/deals/featured?limit=3`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const dealsData = result.data || [];
          setDeals(dealsData);

          // Set deal of the day (highest discount)
          if (dealsData.length > 0) {
            const bestDeal = dealsData.reduce((prev, current) =>
              (prev.discount_percentage > current.discount_percentage) ? prev : current
            );
            setDealOfTheDay(bestDeal);
          }
        }
      } else {
        console.warn('Deals API not available. Showing empty list.');
      }
    } catch (error) {
      console.warn('Error fetching deals. API may not be available.');
    } finally {
      setDealsLoading(false);
    }
  };

  const fetchHomeData = async () => {
    try {
      // Fetch featured products
      const featuredResponse = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/products/featured?limit=8`);
      if (featuredResponse.ok) {
        const featuredResult = await featuredResponse.json();
        if (featuredResult.success) {
          setFeaturedProducts(featuredResult.data || []);
        }
      } else {
        console.warn('Featured products API not available. Showing empty list.');
      }

      // Fetch new arrivals
      const newArrivalsResponse = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/products/new-arrivals?limit=8`);
      if (newArrivalsResponse.ok) {
        const newArrivalsResult = await newArrivalsResponse.json();
        if (newArrivalsResult.success) {
          setNewArrivals(newArrivalsResult.data || []);
        }
      } else {
        console.warn('New arrivals API not available. Showing empty list.');
      }

      setLoading(false);
    } catch (error) {
      console.warn('Error fetching home data. API may not be available.');
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders above ₹999',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Shield,
      title: '100% Secure',
      description: 'Safe & secure payments',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Package,
      title: 'Easy Returns',
      description: '7 days return policy',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated support',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showNavigation={true} />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Welcome to ShopHub
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Discover amazing products at unbeatable prices
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
                >
                  Shop Now
                </Link>
                <Link
                  href="/deals"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-center"
                >
                  View Deals
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-8 bg-white border-b border-slate-200">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className={`p-3 rounded-lg ${feature.bg}`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Shop by Category
                </h2>
                <p className="text-slate-600 mt-1">Browse our wide range of categories</p>
              </div>
            </div>

            {categoriesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-200 rounded-2xl h-48"></div>
                  </div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="group relative"
                  >
                    <div className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-slate-100">
                      <div className="aspect-[4/3] relative bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300x225/f1f5f9/64748b?text=' + encodeURIComponent(category.name);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                            <div className="text-center">
                              <span className="text-5xl opacity-40">📦</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-3 text-center bg-white relative">
                        <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-block p-6 bg-slate-100 rounded-full mb-4">
                  <Package className="w-16 h-16 text-slate-400" />
                </div>
                <p className="text-slate-600 text-lg">No categories available at the moment</p>
              </div>
            )}
          </div>
        </section>

        {/* Hot Deals */}
        {!dealsLoading && deals.length > 0 && (
          <section className="py-12 bg-gradient-to-br from-orange-50 to-red-50">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center space-x-2">
                    <Tag className="w-8 h-8 text-orange-600" />
                    <span>Hot Deals & Offers</span>
                  </h2>
                  <p className="text-slate-600 mt-1">Limited time offers - Don't miss out!</p>
                </div>
                <Link
                  href="/deals"
                  className="text-orange-600 hover:text-orange-700 font-semibold flex items-center space-x-1 text-sm"
                >
                  <span>View All Deals</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Deal Banner */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-500 to-red-500">
                      {deal.banner_image ? (
                        <img
                          src={deal.banner_image}
                          alt={deal.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag className="w-20 h-20 text-white opacity-50" />
                        </div>
                      )}

                      {/* Discount Badge */}
                      <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-full font-bold text-lg shadow-lg flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        {deal.discount_percentage}% OFF
                      </div>
                    </div>

                    {/* Deal Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {deal.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                        {deal.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Ends: {new Date(deal.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-orange-600 font-semibold text-sm flex items-center gap-1">
                          Shop Now
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Deal of the Day */}
        {dealOfTheDay && (
          <section className="py-12 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-6 h-6" />
                    <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                      Limited Time Offer
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Deal of the Day
                  </h2>
                  <p className="text-lg mb-2 font-semibold">{dealOfTheDay.title}</p>
                  <p className="text-xl mb-6">
                    Get up to <span className="text-4xl font-bold">{dealOfTheDay.discount_percentage}% OFF</span> on selected items
                  </p>
                  <Link
                    href={`/deals/${dealOfTheDay.id}`}
                    className="inline-block px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
                <div className="flex space-x-4 text-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 w-20">
                    <div className="text-3xl font-bold">{String(timeRemaining.hours).padStart(2, '0')}</div>
                    <div className="text-xs">Hours</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 w-20">
                    <div className="text-3xl font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                    <div className="text-xs">Mins</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 w-20">
                    <div className="text-3xl font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                    <div className="text-xs">Secs</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center space-x-2">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                  <span>Featured Products</span>
                </h2>
                <p className="text-slate-600 mt-1">Hand-picked products just for you</p>
              </div>
              <Link
                href="/products?featured=true"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 text-sm"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-200 rounded-xl aspect-square mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block p-6 bg-slate-100 rounded-full mb-4">
                  <ShoppingBag className="w-16 h-16 text-slate-400" />
                </div>
                <p className="text-slate-600">No featured products available</p>
              </div>
            )}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                  <span>New Arrivals</span>
                </h2>
                <p className="text-slate-600 mt-1">Check out our latest products</p>
              </div>
              <Link
                href="/products?sort=newest"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 text-sm"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-200 rounded-xl aspect-square mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : newArrivals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block p-6 bg-slate-100 rounded-full mb-4">
                  <ShoppingBag className="w-16 h-16 text-slate-400" />
                </div>
                <p className="text-slate-600">No new arrivals available</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
