-- Migration: Recreate review system for user-only reviews
-- Created: 2025-12-07
-- Description: Drops existing review table and creates new user-focused review system

-- Drop existing review table and related objects
-- Note: CASCADE will automatically drop all dependent triggers, functions, and constraints
DROP TABLE IF EXISTS helpful_reviews CASCADE;
DROP TABLE IF EXISTS review_images CASCADE;
DROP TABLE IF EXISTS review CASCADE;

-- Drop functions separately (they might exist from previous migrations)
DROP FUNCTION IF EXISTS update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS update_review_updated_at() CASCADE;
DROP FUNCTION IF EXISTS increment_helpful_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS decrement_helpful_count(UUID) CASCADE;

-- Create new review table (user-focused, no admin moderation)
CREATE TABLE review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, user_id, order_id)
);

-- Create review_images table
CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create helpful_reviews table (for users marking reviews as helpful)
CREATE TABLE helpful_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_review_product_id ON review(product_id);
CREATE INDEX idx_review_user_id ON review(user_id);
CREATE INDEX idx_review_rating ON review(rating);
CREATE INDEX idx_review_created_at ON review(created_at DESC);
CREATE INDEX idx_review_helpful_count ON review(helpful_count DESC);
CREATE INDEX idx_review_images_review_id ON review_images(review_id);
CREATE INDEX idx_helpful_reviews_review_id ON helpful_reviews(review_id);
CREATE INDEX idx_helpful_reviews_user_id ON helpful_reviews(user_id);

-- Add updated_at trigger for review table
CREATE OR REPLACE FUNCTION update_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_updated_at
BEFORE UPDATE ON review
FOR EACH ROW
EXECUTE FUNCTION update_review_updated_at();

-- Add average_rating and review_count to products table if not exists
ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create function to update product rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM review
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM review
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update product rating
-- (Previous trigger was already dropped via CASCADE when dropping the table)
CREATE TRIGGER update_product_rating_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON review
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- Create RPC functions for helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE review
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_helpful_count(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE review
  SET helpful_count = GREATEST(helpful_count - 1, 0)
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE review IS 'User product reviews and ratings';
COMMENT ON TABLE review_images IS 'Images uploaded with product reviews (max 5 per review)';
COMMENT ON TABLE helpful_reviews IS 'Tracks which users found reviews helpful';
COMMENT ON COLUMN review.verified_purchase IS 'True if review is from verified purchase (user bought this product)';
COMMENT ON COLUMN review.helpful_count IS 'Number of users who found this review helpful';
COMMENT ON COLUMN review.rating IS 'Product rating from 1 to 5 stars';
