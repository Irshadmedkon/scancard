-- Add missing feature columns to profiles table
USE scancard;

-- Check if columns exist and add them if they don't
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'scancard' 
     AND TABLE_NAME = 'profiles' 
     AND COLUMN_NAME = 'menu_enabled') = 0,
    'ALTER TABLE profiles ADD COLUMN menu_enabled TINYINT(1) DEFAULT 0',
    'SELECT "menu_enabled column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'scancard' 
     AND TABLE_NAME = 'profiles' 
     AND COLUMN_NAME = 'catalog_enabled') = 0,
    'ALTER TABLE profiles ADD COLUMN catalog_enabled TINYINT(1) DEFAULT 0',
    'SELECT "catalog_enabled column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'scancard' 
     AND TABLE_NAME = 'profiles' 
     AND COLUMN_NAME = 'booking_enabled') = 0,
    'ALTER TABLE profiles ADD COLUMN booking_enabled TINYINT(1) DEFAULT 0',
    'SELECT "booking_enabled column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Enable all features for existing profiles
UPDATE profiles SET menu_enabled = 1, catalog_enabled = 1, booking_enabled = 1;

SELECT 'Profile table updated successfully!' AS status;