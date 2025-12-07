-- Migration: Product Reviews and Ratings
-- Created: 2025-12-07
-- Description: Adds product review functionality with ratings and image uploads

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, user_id, order_id)
);

-- Create review_images table
CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create helpful_reviews table (for users marking reviews as helpful)
CREATE TABLE IF NOT EXISTS helpful_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_reviews_review_id ON helpful_reviews(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_reviews_user_id ON helpful_reviews(user_id);

-- Add updated_at trigger for reviews
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();

-- Add average_rating and review_count to products table
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
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update product rating
CREATE TRIGGER update_product_rating_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- Grant permissions (adjust based on your RLS policies)
-- These are examples, adjust based on your security requirements
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpful_reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read reviews
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

-- Users can create reviews for products they've ordered
CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Review images policies
CREATE POLICY "Anyone can view review images" ON review_images
  FOR SELECT USING (true);

CREATE POLICY "Users can add images to their reviews" ON review_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_images.review_id
      AND reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their review images" ON review_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_images.review_id
      AND reviews.user_id = auth.uid()
    )
  );

-- Helpful reviews policies
CREATE POLICY "Anyone can view helpful reviews" ON helpful_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can mark reviews as helpful" ON helpful_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmark reviews as helpful" ON helpful_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create RPC functions for helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_helpful_count(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = GREATEST(helpful_count - 1, 0)
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE reviews IS 'Product reviews and ratings from customers';
COMMENT ON TABLE review_images IS 'Images uploaded with product reviews';
COMMENT ON TABLE helpful_reviews IS 'Tracks which users found reviews helpful';
COMMENT ON COLUMN reviews.verified_purchase IS 'True if review is from verified purchase';
COMMENT ON COLUMN reviews.helpful_count IS 'Number of users who found this review helpful';
