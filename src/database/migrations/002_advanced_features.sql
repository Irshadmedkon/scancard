-- Advanced Features Migration
-- Adds soft delete, audit trail, and other advanced features

-- Add soft delete columns to existing tables
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS deleted_by INT NULL;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS deleted_by INT NULL;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS deleted_by INT NULL,
ADD COLUMN IF NOT EXISTS is_archived TINYINT(1) DEFAULT 0;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS deleted_by INT NULL,
ADD COLUMN IF NOT EXISTS is_archived TINYINT(1) DEFAULT 0;

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS deleted_by INT NULL;

ALTER TABLE product_catalog 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS deleted_by INT NULL;

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INT NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create analytics daily aggregation table
CREATE TABLE IF NOT EXISTS analytics_daily (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL UNIQUE,
  total_views INT DEFAULT 0,
  total_leads INT DEFAULT 0,
  total_users INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create analytics events table for tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  event_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  profile_id INT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_profile_id (profile_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add email preferences to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_preferences VARCHAR(255) DEFAULT 'daily_report,lead_notifications';

-- Add indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_leads_deleted ON leads(is_deleted);
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(is_archived);
CREATE INDEX IF NOT EXISTS idx_bookings_deleted ON bookings(is_deleted);
CREATE INDEX IF NOT EXISTS idx_bookings_archived ON bookings(is_archived);

-- Create batch operations log table
CREATE TABLE IF NOT EXISTS batch_operations (
  batch_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  records_affected INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create job queue table (for persistent jobs)
CREATE TABLE IF NOT EXISTS job_queue (
  job_id INT PRIMARY KEY AUTO_INCREMENT,
  job_type VARCHAR(50) NOT NULL,
  job_data JSON NOT NULL,
  priority INT DEFAULT 0,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT NULL,
  scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_scheduled_at (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add created_by and updated_by to tables that don't have them
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_by INT NULL,
ADD COLUMN IF NOT EXISTS updated_by INT NULL;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS created_by INT NULL,
ADD COLUMN IF NOT EXISTS updated_by INT NULL;

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS created_by INT NULL,
ADD COLUMN IF NOT EXISTS updated_by INT NULL;

ALTER TABLE product_catalog 
ADD COLUMN IF NOT EXISTS created_by INT NULL,
ADD COLUMN IF NOT EXISTS updated_by INT NULL;

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  setting_id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) DEFAULT 'string',
  description TEXT NULL,
  is_public TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key),
  INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode', 1),
('max_profiles_per_user', '10', 'number', 'Maximum profiles per user', 0),
('max_file_size_mb', '10', 'number', 'Maximum file upload size in MB', 0),
('enable_analytics', 'true', 'boolean', 'Enable analytics tracking', 0),
('enable_webhooks', 'true', 'boolean', 'Enable webhook triggers', 0);

-- Migration complete
SELECT 'Advanced features migration completed successfully' AS status;
