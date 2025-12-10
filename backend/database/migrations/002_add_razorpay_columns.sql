-- ============================================
-- ADD RAZORPAY PAYMENT COLUMNS TO ORDERS TABLE
-- ============================================

-- Add Razorpay order tracking
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255) UNIQUE;

-- Add Razorpay payment tracking
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);

-- Add Razorpay signature for verification
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(512);

-- Add payment timestamp
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add payment details (stores card/UPI/netbanking info)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Add refund columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'razorpay_order_id',
  'razorpay_payment_id',
  'razorpay_signature',
  'paid_at',
  'payment_details',
  'refund_id',
  'refund_amount',
  'refund_reason',
  'refunded_at'
)
ORDER BY column_name;
