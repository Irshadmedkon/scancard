const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { checkFeatureAccess } = require('../../middleware/subscriptionCheck');
const validateRequest = require('../../middleware/validateRequest');

// PUBLIC ROUTES
router.get('/:profileId/services', bookingController.getServices);
router.post('/:profileId/book', validateRequest('booking'), bookingController.createBooking);

// PROTECTED ROUTES
router.post('/:profileId/services', authMiddleware, checkFeatureAccess('booking'), validateRequest('bookingService'), bookingController.createService);
router.get('/:profileId/bookings', authMiddleware, checkFeatureAccess('booking'), bookingController.getBookings);
router.patch('/:profileId/bookings/:bookingId/status', authMiddleware, checkFeatureAccess('booking'), bookingController.updateBookingStatus);
router.post('/:profileId/availability', authMiddleware, checkFeatureAccess('booking'), validateRequest('availability'), bookingController.setAvailability);
router.get('/:profileId/availability', authMiddleware, checkFeatureAccess('booking'), bookingController.getAvailability);

module.exports = router;
