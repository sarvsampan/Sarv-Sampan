'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Truck,
  RotateCcw,
  Shield,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import ProductCard from '@/components/user/ProductCard';
import ProductReviews from '@/components/user/ProductReviews';
import toast from 'react-hot-toast';
import { cartAPI, wishlistAPI } from '@/lib/userApi';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/products/${params.slug}`);

      if (!response.ok) {
        throw new Error('Product not found');
      }

      const result = await response.json();

      if (result.success) {
        setProduct(result.data);

        // Fetch related products from the same category
        if (result.data.category_id) {
          fetchRelatedProducts(result.data.category_id, result.data.id);
        }
      } else {
        toast.error('Product not found');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (categoryId, currentProductId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_USER_API_URL}/products?category=${categoryId}&limit=4`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Filter out current product from related products
          const related = result.data.products.filter(p => p.id !== currentProductId).slice(0, 4);
          setRelatedProducts(related);
        }
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  useEffect(() => {
    if (product) {
      checkWishlistStatus();
    }
  }, [product]);

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setIsWishlisted(false);
        return;
      }

      const response = await wishlistAPI.checkWishlist(product.id);
      if (response.success) {
        setIsWishlisted(response.data.isInWishlist);
      }
    } catch (error) {
      setIsWishlisted(false);
    }
  };

  const handleAddToCart = async () => {
    if (product.stock_quantity === 0) {
      toast.error('Product is out of stock');
      return;
    }

    try {
      await cartAPI.addToCart(product.id, quantity);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success(`Added ${quantity} item(s) to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error?.message?.includes('already in cart') || error?.message?.includes('already exists')) {
        // Item exists, try updating quantity instead
        try {
          const cartResponse = await cartAPI.getCart();
          if (cartResponse.success) {
            const existingItem = cartResponse.data.items.find(item => item.product.id === product.id);
            if (existingItem) {
              const newQuantity = Math.min(existingItem.quantity + quantity, product.stock_quantity);
              await cartAPI.updateQuantity(existingItem.id, newQuantity);
              window.dispatchEvent(new CustomEvent('cartUpdated'));
              toast.success('Cart updated!');
              return;
            }
          }
        } catch (updateError) {
          console.error('Error updating cart:', updateError);
        }
        toast.error('Item already in cart');
      } else {
        toast.error(error?.message || 'Failed to add to cart');
      }
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    setTimeout(() => {
      router.push('/cart');
    }, 500);
  };

  const handleToggleWishlist = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      toast.error('Please login to add to wishlist');
      router.push('/login');
      return;
    }

    try {
      if (isWishlisted) {
        // Remove from wishlist
        const wishlistResponse = await wishlistAPI.getWishlist();
        if (wishlistResponse.success) {
          const item = wishlistResponse.data.items.find(i => i.product.id === product.id);
          if (item) {
            await wishlistAPI.removeFromWishlist(item.id);
            setIsWishlisted(false);
            toast.success('Removed from wishlist');
          }
        }
      } else {
        // Add to wishlist
        await wishlistAPI.addToWishlist(product.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      if (error?.message?.includes('already in wishlist')) {
        toast.error('Item already in wishlist');
        setIsWishlisted(true);
      } else {
        toast.error(error?.message || 'Failed to update wishlist');
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading product...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
          <p className="text-slate-600 mb-6">The product you're looking for doesn't exist</p>
          <Link href="/products" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Browse Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = product.sale_price
    ? Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)
    : 0;
  const finalPrice = product.sale_price || product.regular_price;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
              <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[selectedImage]?.image_url || product.images[0].image_url}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto bg-slate-200 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart className="w-16 h-16 text-slate-400" />
                    </div>
                    <p className="text-slate-500">No image available</p>
                  </div>
                )}
              </div>
            </div>
            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                      selectedImage === i ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <Image
                      src={img.image_url}
                      alt={`${product.name} - ${i + 1}`}
                      width={150}
                      height={150}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= product.average_rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600">
                  {product.average_rating || 0} ({product.review_count || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-bold text-slate-900">
                    ₹{finalPrice.toLocaleString('en-IN')}
                  </span>
                  {product.sale_price && (
                    <>
                      <span className="text-xl text-slate-500 line-through">
                        ₹{product.regular_price.toLocaleString('en-IN')}
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                {product.sale_price && (
                  <p className="text-sm text-emerald-600 font-semibold mt-2">
                    You save ₹{(product.regular_price - product.sale_price).toLocaleString('en-IN')}!
                  </p>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-slate-700 mb-6">{product.short_description}</p>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">
                      In Stock ({product.stock_quantity} available)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <span className="font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                    className="w-16 h-10 text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="w-10 h-10 border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>

              {/* Wishlist & Share */}
              <div className="flex gap-3">
                <button
                  onClick={handleToggleWishlist}
                  className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 border-2 transition-colors ${
                    isWishlisted
                      ? 'border-red-500 text-red-500 bg-red-50'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-xs text-slate-600">Free Delivery</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs text-slate-600">7 Days Return</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-xs text-slate-600">Warranty</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-12">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-200 mb-6">
            {['description', 'specifications', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'description' && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Product Description</h3>
                <p className="text-slate-700 mb-6 whitespace-pre-line">{product.description || 'No description available.'}</p>
                {product.features && product.features.length > 0 && (
                  <>
                    <h4 className="font-semibold text-slate-900 mb-3">Key Features:</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Specifications</h3>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, value], index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{key}</td>
                          <td className="px-4 py-3 text-slate-700">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-8">
                    <table className="w-full">
                      <tbody>
                        {product.sku && (
                          <tr className="bg-white">
                            <td className="px-4 py-3 font-semibold text-slate-900">SKU</td>
                            <td className="px-4 py-3 text-slate-700">{product.sku}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="px-4 py-3 font-semibold text-slate-900">Availability</td>
                          <td className="px-4 py-3 text-slate-700">
                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                          </td>
                        </tr>
                        {product.category && (
                          <tr className="bg-white">
                            <td className="px-4 py-3 font-semibold text-slate-900">Category</td>
                            <td className="px-4 py-3 text-slate-700">{product.category.name}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <ProductReviews productId={product.id} productName={product.name} />
            )}
          </div>
        </div>

        {/* Related Products */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
