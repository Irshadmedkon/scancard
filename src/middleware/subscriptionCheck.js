const { query, queryOne } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const { STATUS_CODES, ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Check if user's subscription plan allows a specific feature
 */
const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.user_id;

      // Get user's profile to check feature enablement
      const profile = await queryOne(
        `SELECT menu_enabled, catalog_enabled, booking_enabled 
         FROM profiles 
         WHERE profile_id = ? AND user_id = ?`,
        [req.params.profileId, userId]
      );

      if (!profile) {
        return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
          false,
          null,
          '',
          {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Profile not found'
          }
        ));
      }

      // Check feature-specific access
      const featureMap = {
        'menu': 'menu_enabled',
        'catalog': 'catalog_enabled',
        'booking': 'booking_enabled'
      };

      const featureColumn = featureMap[feature];
      
      if (!featureColumn || !profile[featureColumn]) {
        return res.status(STATUS_CODES.FORBIDDEN).json(formatResponse(
          false,
          null,
          '',
          {
            code: 'FEATURE_NOT_ENABLED',
            message: `${feature.toUpperCase()} feature is not enabled for this profile`,
            upgrade_required: true
          }
        ));
      }

      next();
    } catch (error) {
      logger.error('Feature access check error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to verify feature access'
        }
      ));
    }
  };
};

/**
 * Check if user has reached their plan limit for a feature
 */
const checkLimit = (feature, maxLimit = 100) => {
  return async (req, res, next) => {
    try {
      const profileId = req.params.profileId;

      let currentCount = 0;
      let limitMessage = '';

      // Check based on feature type
      switch (feature) {
        case 'menu_items':
          const menuCount = await queryOne(
            `SELECT COUNT(*) as count FROM menu_items mi
             JOIN menu_categories mc ON mi.category_id = mc.category_id
             WHERE mc.profile_id = ?`,
            [profileId]
          );
          currentCount = menuCount ? menuCount.count : 0;
          limitMessage = 'menu items';
          break;

        case 'catalog_products':
          const catalogCount = await queryOne(
            'SELECT COUNT(*) as count FROM product_catalog WHERE profile_id = ?',
            [profileId]
          );
          currentCount = catalogCount ? catalogCount.count : 0;
          limitMessage = 'catalog products';
          break;

        case 'bookings':
          const bookingCount = await queryOne(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE profile_id = ? 
             AND MONTH(created_at) = MONTH(CURRENT_DATE())
             AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
            [profileId]
          );
          currentCount = bookingCount ? bookingCount.count : 0;
          limitMessage = 'bookings this month';
          break;
      }

      // Check if limit exceeded
      if (maxLimit > 0 && currentCount >= maxLimit) {
        return res.status(STATUS_CODES.FORBIDDEN).json(formatResponse(
          false,
          null,
          '',
          {
            code: 'LIMIT_EXCEEDED',
            message: `You have reached your plan limit of ${maxLimit} ${limitMessage}`,
            current: currentCount,
            limit: maxLimit,
            upgrade_required: true
          }
        ));
      }

      next();
    } catch (error) {
      logger.error('Limit check error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to verify limits'
        }
      ));
    }
  };
};

module.exports = {
  checkFeatureAccess,
  checkLimit
};
