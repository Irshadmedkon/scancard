-- ============================================================
-- TAPONN BACKEND - COMPLETE DATABASE SETUP
-- Run this file once to setup entire database
-- ============================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS scancard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE scancard;

-- ============================================================
-- DROP EXISTING TABLES (Fresh Start)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS analytics_daily;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS batch_operations;
DROP TABLE IF EXISTS job_queue;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS profile_links;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS analytics;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menu_categories;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_catalog;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS booking_services;
DROP TABLE IF EXISTS booking_availability;
DROP TABLE IF EXISTS nfc_cards;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS webhooks;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS payment_orders;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS uploads;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================

CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email_verified TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME,
  email_preferences VARCHAR(255) DEFAULT 'daily_report,lead_notifications',
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME NULL,
  deleted_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_is_active (is_active),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. PROFILES TABLE
-- ============================================================

CREATE TABLE profiles (
  profile_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  profile_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE,
  bio TEXT,
  profile_picture VARCHAR(255),
  cover_image VARCHAR(255),
  company VARCHAR(100),
  designation VARCHAR(100),
  website VARCHAR(255),
  location VARCHAR(100),
  is_public TINYINT(1) DEFAULT 1,
  qr_code VARCHAR(255),
  view_count INT DEFAULT 0,
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_username (username),
  INDEX idx_is_public (is_public),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. PROFILE LINKS TABLE
-- ============================================================

CREATE TABLE profile_links (
  link_id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  icon VARCHAR(50),
  display_order INT DEFAULT 0,
  click_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. LEADS TABLE
-- ============================================================

CREATE TABLE leads (
  lead_id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(100),
  message TEXT,
  source VARCHAR(50),
  status VARCHAR(20) DEFAULT 'new',
  notes TEXT,
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME NULL,
  deleted_by INT NULL,
  is_archived TINYINT(1) DEFAULT 0,
  created_by INT NULL,
  updated_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_is_archived (is_archived)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. ANALYTICS TABLE
-- ============================================================

CREATE TABLE analytics (
  analytics_id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. MENU CATEGORIES TABLE
-- ============================================================

CREATE TABLE menu_categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. MENU ITEMS TABLE
-- ============================================================

CREATE TABLE menu_items (
  item_id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  image_url VARCHAR(255),
  is_veg TINYINT(1) DEFAULT 1,
  is_available TINYINT(1) DEFAULT 1,
  preparation_time INT,
  calories INT,
  tags VARCHAR(200),
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(category_id) ON DELETE CASCADE,
  INDEX idx_category_id (category_id),
  INDEX idx_is_available (is_available),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. PRODUCT CATALOG TABLE
-- ============================================================

CREATE TABLE product_catalog (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  stock_quantity INT DEFAULT 0,
  category VARCHAR(100),
  brand VARCHAR(100),
  tags VARCHAR(200),
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME NULL,
  deleted_by INT NULL,
  created_by INT NULL,
  updated_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_sku (sku),
  INDEX idx_is_active (is_active),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. PRODUCT IMAGES TABLE
-- ============================================================

CREATE TABLE product_images (
  image_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product_catalog(product_id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. BOOKING SERVICES TABLE
-- ============================================================

CREATE TABLE booking_services (
  service_id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  buffer_time INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. BOOKINGS TABLE
-- ============================================================

CREATE TABLE bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME NULL,
  deleted_by INT NULL,
  is_archived TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES booking_services(service_id) ON DELETE CASCADE,
  INDEX idx_service_id (service_id),
  INDEX idx_booking_date (booking_date),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_is_archived (is_archived)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. BOOKING AVAILABILITY TABLE
-- ============================================================

CREATE TABLE booking_availability (
  availability_id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL,
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. NFC CARDS TABLE
-- ============================================================

CREATE TABLE nfc_cards (
  card_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  profile_id INT,
  card_uid VARCHAR(100) UNIQUE NOT NULL,
  card_name VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  tap_count INT DEFAULT 0,
  last_tapped DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_card_uid (card_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. TEAMS TABLE
-- ============================================================

CREATE TABLE teams (
  team_id INT PRIMARY KEY AUTO_INCREMENT,
  owner_user_id INT NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_owner_user_id (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. TEAM MEMBERS TABLE
-- ============================================================

CREATE TABLE team_members (
  member_id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  member_user_id INT NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
  FOREIGN KEY (member_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_team_id (team_id),
  INDEX idx_member_user_id (member_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  action_url VARCHAR(500),
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. WEBHOOKS TABLE
-- ============================================================

CREATE TABLE webhooks (
  webhook_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  secret_key VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. API KEYS TABLE
-- ============================================================

CREATE TABLE api_keys (
  key_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(100) UNIQUE NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  expires_at DATETIME,
  last_used DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_api_key (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. SUBSCRIPTIONS TABLE
-- ============================================================

CREATE TABLE subscriptions (
  subscription_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  plan_name VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. PAYMENT ORDERS TABLE
-- ============================================================

CREATE TABLE payment_orders (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_reference VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_gateway VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_id VARCHAR(100),
  payment_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_order_reference (order_reference),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. UPLOADS TABLE
-- ============================================================

CREATE TABLE uploads (
  upload_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. REFRESH TOKENS TABLE
-- ============================================================

CREATE TABLE refresh_tokens (
  token_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_revoked TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token(255)),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22.5 PASSWORD RESETS TABLE
-- ============================================================

CREATE TABLE password_resets (
  reset_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token(255)),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. AUDIT LOGS TABLE (Advanced Feature)
-- ============================================================

CREATE TABLE audit_logs (
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

-- ============================================================
-- 24. ANALYTICS DAILY TABLE (Advanced Feature)
-- ============================================================

CREATE TABLE analytics_daily (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL UNIQUE,
  total_views INT DEFAULT 0,
  total_leads INT DEFAULT 0,
  total_users INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. ANALYTICS EVENTS TABLE (Advanced Feature)
-- ============================================================

CREATE TABLE analytics_events (
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

-- ============================================================
-- 26. BATCH OPERATIONS TABLE (Advanced Feature)
-- ============================================================

CREATE TABLE batch_operations (
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

-- ============================================================
-- 27. JOB QUEUE TABLE (Advanced Feature)
-- ============================================================

CREATE TABLE job_queue (
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

-- ============================================================
-- 28. SYSTEM SETTINGS TABLE (Advanced Feature)
-- ============================================================

CREATE TABLE system_settings (
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

-- ============================================================
-- INSERT DEFAULT DATA
-- ============================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode', 1),
('max_profiles_per_user', '10', 'number', 'Maximum profiles per user', 0),
('max_file_size_mb', '10', 'number', 'Maximum file upload size in MB', 0),
('enable_analytics', 'true', 'boolean', 'Enable analytics tracking', 0),
('enable_webhooks', 'true', 'boolean', 'Enable webhook triggers', 0);

-- Insert test user (password: password123)
-- Password hash generated using bcrypt with 10 rounds
INSERT INTO users (email, password, full_name, phone, email_verified, is_active) VALUES
('test@taponn.com', '$2a$10$0v9qgBdKGYlRUG1jNaPNMufYJR7U40yPl3Hol1RnLN1a118mKwfjW', 'Test User', '9876543210', 1, 1);

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================

SELECT 'Database setup completed successfully!' AS status;
SELECT 'Total tables created: 29' AS info;
SELECT 'Test user: test@taponn.com / password123' AS credentials;
