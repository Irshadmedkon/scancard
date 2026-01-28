const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { checkFeatureAccess } = require('../../middleware/subscriptionCheck');
const validateRequest = require('../../middleware/validateRequest');

// PUBLIC ROUTES
router.get('/:profileId/services', bookingController.getServices);
router.get('/:profileId/services/:serviceId', bookingController.getService);
router.post('/:profileId/book', validateRequest('booking'), bookingController.createBooking);
router.get('/:profileId/availability', bookingController.getAvailability); // Public availability check

// PROTECTED ROUTES
router.post('/:profileId/services', authMiddleware, validateRequest('bookingService'), bookingController.createService);
router.put('/:profileId/services/:serviceId', authMiddleware, validateRequest('bookingService'), bookingController.updateService);
router.delete('/:profileId/services/:serviceId', authMiddleware, bookingController.deleteService);
router.get('/:profileId/bookings', authMiddleware, bookingController.getBookings);
router.get('/:profileId/bookings/:bookingId', authMiddleware, bookingController.getBooking);
router.put('/:profileId/bookings/:bookingId/status', authMiddleware, bookingController.updateBookingStatus);
router.post('/:profileId/availability', authMiddleware, bookingController.setAvailability);

module.exports = router;
