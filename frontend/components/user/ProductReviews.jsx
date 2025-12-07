'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, Calendar, CheckCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { reviewAPI } from '@/lib/userApi';
import toast from 'react-hot-toast';

// Star Rating Display Component
const StarRating = ({ rating, size = 'sm', showNumber = false }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-slate-300'
          }`}
        />
      ))}
      {showNumber && (
        <span className="ml-1 text-sm font-semibold text-slate-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// Star Rating Input Component
const StarRatingInput = ({ rating, setRating, size = 'lg' }) => {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300'
            } cursor-pointer`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-slate-600">
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </span>
      )}
    </div>
  );
};

// Main Product Reviews Component
export default function ProductReviews({ productId, productName }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('recent');

  // Review form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [productId, currentPage, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getProductReviews(productId, {
        page: currentPage,
        limit: 10,
        sort: sortBy
      });
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await reviewAPI.getReviewStats(productId);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      toast.error('Please login to write a review');
      return;
    }

    try {
      setSubmitting(true);
      await reviewAPI.createReview({
        product_id: productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images
      });

      toast.success('Review submitted successfully!');

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);
      setShowReviewForm(false);

      // Reload reviews
      loadReviews();
      loadStats();
    } catch (error) {
      toast.error(error?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      toast.error('Please login to mark reviews as helpful');
      return;
    }

    try {
      await reviewAPI.markHelpful(reviewId);
      loadReviews();
    } catch (error) {
      toast.error('Failed to mark as helpful');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mt-8">
      {/* Header with Stats */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Customer Reviews
        </h2>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-slate-900 mb-1">
                  {stats.average_rating.toFixed(1)}
                </div>
                <StarRating rating={stats.average_rating} size="md" />
                <div className="text-sm text-slate-600 mt-1">
                  {stats.total_reviews} reviews
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-8">{star}★</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${(stats.rating_distribution[star] / stats.total_reviews) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-8">
                      {stats.rating_distribution[star]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write Review Button */}
            <div className="flex items-center justify-center md:justify-end">
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Write Your Review</h3>

          {/* Rating Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Your Rating *
            </label>
            <StarRatingInput rating={rating} setRating={setRating} />
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Review Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={200}
            />
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this product"
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Add Photos (Max 5)
            </label>

            <div className="grid grid-cols-5 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
                  <Image
                    src={img}
                    alt={`Review ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="aspect-square bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !rating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Sort and Filter */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          All Reviews ({stats?.total_reviews || 0})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const userName = review.user
              ? `${review.user.first_name || ''} ${review.user.last_name || ''}`.trim()
              : 'Anonymous';
            const userInitial = userName.charAt(0).toUpperCase() || 'U';

            return (
            <div key={review.id} className="border-b border-slate-200 pb-6 last:border-b-0">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {userInitial}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      {userName}
                      {review.verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-slate-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Title */}
              {review.title && (
                <h4 className="font-semibold text-slate-900 mb-2">{review.title}</h4>
              )}

              {/* Review Comment */}
              {review.comment && (
                <p className="text-slate-700 mb-3">{review.comment}</p>
              )}

              {/* Review Images */}
              {review.review_images && review.review_images.length > 0 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-3">
                  {review.review_images.map((img) => (
                    <div key={img.id} className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative">
                      <Image
                        src={img.image_url}
                        alt="Review"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Helpful Button */}
              <button
                onClick={() => handleMarkHelpful(review.id)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Helpful ({review.helpful_count || 0})</span>
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
