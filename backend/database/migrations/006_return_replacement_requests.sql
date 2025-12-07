-- Migration: Return and Replacement Requests
-- Created: 2025-12-07
-- Description: Creates tables for return and replacement requests

-- Return Requests Table
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed
  admin_notes TEXT,
  refund_amount DECIMAL(10, 2),
  refund_method VARCHAR(50), -- original_payment, store_credit, bank_transfer
  processed_by UUID REFERENCES admin_users(id),
  processed_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Replacement Requests Table
CREATE TABLE IF NOT EXISTS replacement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed, shipped
  admin_notes TEXT,
  new_order_id UUID REFERENCES orders(id),
  processed_by UUID REFERENCES admin_users(id),
  processed_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX idx_return_requests_user_id ON return_requests(user_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);
CREATE INDEX idx_return_requests_created_at ON return_requests(created_at DESC);

CREATE INDEX idx_replacement_requests_order_id ON replacement_requests(order_id);
CREATE INDEX idx_replacement_requests_user_id ON replacement_requests(user_id);
CREATE INDEX idx_replacement_requests_status ON replacement_requests(status);
CREATE INDEX idx_replacement_requests_created_at ON replacement_requests(created_at DESC);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_return_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER return_requests_updated_at
BEFORE UPDATE ON return_requests
FOR EACH ROW
EXECUTE FUNCTION update_return_requests_updated_at();

CREATE OR REPLACE FUNCTION update_replacement_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER replacement_requests_updated_at
BEFORE UPDATE ON replacement_requests
FOR EACH ROW
EXECUTE FUNCTION update_replacement_requests_updated_at();

-- Comments
COMMENT ON TABLE return_requests IS 'Customer return/refund requests';
COMMENT ON TABLE replacement_requests IS 'Customer product replacement requests';
COMMENT ON COLUMN return_requests.status IS 'Request status: pending, approved, rejected, completed';
COMMENT ON COLUMN replacement_requests.status IS 'Request status: pending, approved, rejected, completed, shipped';
