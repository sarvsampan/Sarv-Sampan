-- Migration: Add images to return and replacement requests
-- Created: 2025-12-07
-- Description: Adds images field to return_requests and replacement_requests tables

-- Add images column to return_requests
ALTER TABLE return_requests
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add images column to replacement_requests
ALTER TABLE replacement_requests
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Comments
COMMENT ON COLUMN return_requests.images IS 'Array of image URLs uploaded by customer for return request';
COMMENT ON COLUMN replacement_requests.images IS 'Array of image URLs uploaded by customer for replacement request';
