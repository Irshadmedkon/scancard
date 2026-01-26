-- ============================================
-- BUSINESS FEATURE TABLES (Menu, Catalog, Booking)
-- Version: 2.0
-- Date: January 26, 2026
-- Database: scancard
-- ============================================

USE scancard;

-- ============================================
-- 1. MENU CATEGORIES TABLE (Restaurant/Cafe)
-- ============================================
CREATE TABLE IF NOT EXISTS menu_categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id INT UNSIGNED NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    category_description TEXT,
    category_image VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    INDEX idx_profile_active (profile_id, is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
    item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    profile_id INT UNSIGNED NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    item_image VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'INR',
    is_veg BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time INT COMMENT 'In minutes',
    calories INT,
    tags JSON COMMENT '["spicy", "gluten-free"]',
    display_order INT DEFAULT 0,
    view_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES menu_categories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    INDEX idx_category_available (category_id, is_available),
    INDEX idx_profile (profile_id),
    FULLTEXT idx_search_item (item_name, item_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. PRODUCT CATALOG TABLE (E-commerce/Shop)
-- ============================================
CREATE TABLE IF NOT EXISTS product_catalog (
    product_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id INT UNSIGNED NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    sku VARCHAR(100) UNIQUE COMMENT 'Stock Keeping Unit',
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'INR',
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    is_in_stock BOOLEAN DEFAULT TRUE,
    category VARCHAR(100),
    brand VARCHAR(100),
    weight DECIMAL(10,2) COMMENT 'In kg',
    dimensions VARCHAR(50) COMMENT 'LxWxH in cm',
    tags JSON COMMENT '["new", "bestseller"]',
    display_order INT DEFAULT 0,
    view_count INT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    INDEX idx_profile_stock (profile_id, is_in_stock),
    INDEX idx_category (category),
    INDEX idx_sku (sku),
    FULLTEXT idx_search_product (product_name, product_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. PRODUCT IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
    image_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES product_catalog(product_id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_primary (product_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. BOOKING SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS booking_services (
    service_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id INT UNSIGNED NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,
    service_image VARCHAR(500),
    duration_minutes INT NOT NULL COMMENT 'Service duration',
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    buffer_time_minutes INT DEFAULT 0 COMMENT 'Gap between bookings',
    max_bookings_per_slot INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    INDEX idx_profile_active (profile_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    booking_end_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    confirmation_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES booking_services(service_id),
    INDEX idx_profile_date (profile_id, booking_date, status),
    INDEX idx_status (status),
    INDEX idx_confirmation (confirmation_code),
    UNIQUE KEY unique_slot (profile_id, service_id, booking_date, booking_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. BOOKING AVAILABILITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS booking_availability (
    availability_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id INT UNSIGNED NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE CASCADE,
    INDEX idx_profile_day (profile_id, day_of_week, is_available),
    UNIQUE KEY unique_profile_day (profile_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- UPDATE PROFILES TABLE - Add Business Feature Flags
-- ============================================

-- Check and add menu_enabled column
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'scancard' 
    AND TABLE_NAME = 'profiles' 
    AND COLUMN_NAME = 'menu_enabled'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE profiles ADD COLUMN menu_enabled BOOLEAN DEFAULT FALSE AFTER is_public',
    'SELECT "Column menu_enabled already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add catalog_enabled column
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'scancard' 
    AND TABLE_NAME = 'profiles' 
    AND COLUMN_NAME = 'catalog_enabled'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE profiles ADD COLUMN catalog_enabled BOOLEAN DEFAULT FALSE AFTER menu_enabled',
    'SELECT "Column catalog_enabled already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add booking_enabled column
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'scancard' 
    AND TABLE_NAME = 'profiles' 
    AND COLUMN_NAME = 'booking_enabled'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE profiles ADD COLUMN booking_enabled BOOLEAN DEFAULT FALSE AFTER catalog_enabled',
    'SELECT "Column booking_enabled already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ Business Features Migration Completed Successfully!' AS Status;
SELECT 'Total New Tables: 7 (menu_categories, menu_items, product_catalog, product_images, booking_services, bookings, booking_availability)' AS Info;
SELECT 'Profile columns added: menu_enabled, catalog_enabled, booking_enabled' AS ProfileUpdates;
