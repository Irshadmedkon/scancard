-- ============================================
-- Migration: Add Payment Orders Table
-- Date: January 25, 2026
-- Description: Adds payment_orders table for payment integration
-- ============================================

USE scancard;

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS payment_orders (
  payment_order_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  payment_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_gateway ENUM('razorpay', 'stripe') NOT NULL,
  plan_type ENUM('premium', 'professional', 'enterprise') NOT NULL,
  status ENUM('created', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'created',
  metadata JSON,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_order_id (order_id),
  INDEX idx_payment_id (payment_id),
  INDEX idx_status (status),
  INDEX idx_payment_gateway (payment_gateway),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table was created
SELECT 'payment_orders table created successfully!' as message;

-- Show table structure
DESCRIBE payment_orders;
