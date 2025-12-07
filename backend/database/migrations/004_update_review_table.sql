-- Migration: Update existing review table for user review functionality
-- Created: 2025-12-07
-- Description: Adds missing columns and tables for review functionality

-- Add missing columns to existing review table
ALTER TABLE review
ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Create review_images table if not exists
CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create helpful_reviews table (for users marking reviews as helpful)
CREATE TABLE IF NOT EXISTS helpful_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_product_id ON review(product_id);
CREATE INDEX IF NOT EXISTS idx_review_user_id ON review(user_id);
CREATE INDEX IF NOT EXISTS idx_review_rating ON review(rating);
CREATE INDEX IF NOT EXISTS idx_review_created_at ON review(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_reviews_review_id ON helpful_reviews(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_reviews_user_id ON helpful_reviews(user_id);

-- Add average_rating and review_count to products table if not exists
ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create function to update product rating (handles 'review' table name)
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

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_product_rating_on_review_change ON review;

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

-- Comments
COMMENT ON COLUMN review.verified_purchase IS 'True if review is from verified purchase';
COMMENT ON COLUMN review.helpful_count IS 'Number of users who found this review helpful';
COMMENT ON TABLE review_images IS 'Images uploaded with product reviews';
COMMENT ON TABLE helpful_reviews IS 'Tracks which users found reviews helpful';
