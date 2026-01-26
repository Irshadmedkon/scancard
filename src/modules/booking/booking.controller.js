const bookingService = require('./booking.service');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES, ERROR_CODES } = require('../../utils/constants');
const logger = require('../../utils/logger');

class BookingController {
  async createService(req, res) {
    try {
      const profileId = req.params.profileId;
      const userId = req.user.user_id;
      const result = await bookingService.createService(profileId, userId, req.body);
      res.status(STATUS_CODES.CREATED).json(formatResponse(true, result, 'Service created successfully'));
    } catch (error) {
      logger.error('Create service controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message
      }));
    }
  }

  async getServices(req, res) {
    try {
      const services = await bookingService.getServices(req.params.profileId);
      res.json(formatResponse(true, { services }, 'Services retrieved successfully'));
    } catch (error) {
      logger.error('Get services controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(false, null, '', {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to retrieve services'
      }));
    }
  }

  async createBooking(req, res) {
    try {
      const profileId = req.params.profileId;
      const result = await bookingService.createBooking(profileId, req.body);
      res.status(STATUS_CODES.CREATED).json(formatResponse(true, result, 'Booking created successfully'));
    } catch (error) {
      logger.error('Create booking controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message
      }));
    }
  }

  async getBookings(req, res) {
    try {
      const { status, date } = req.query;
      const bookings = await bookingService.getBookings(req.params.profileId, { status, date });
      res.json(formatResponse(true, { bookings }, 'Bookings retrieved successfully'));
    } catch (error) {
      logger.error('Get bookings controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(false, null, '', {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to retrieve bookings'
      }));
    }
  }

  async updateBookingStatus(req, res) {
    try {
      const { bookingId, profileId } = req.params;
      const userId = req.user.user_id;
      const { status } = req.body;
      const result = await bookingService.updateBookingStatus(bookingId, profileId, userId, status);
      res.json(formatResponse(true, result, 'Booking status updated successfully'));
    } catch (error) {
      logger.error('Update booking status controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message
      }));
    }
  }

  async setAvailability(req, res) {
    try {
      const profileId = req.params.profileId;
      const userId = req.user.user_id;
      const { day_of_week, start_time, end_time } = req.body;
      const result = await bookingService.setAvailability(profileId, userId, day_of_week, start_time, end_time);
      res.json(formatResponse(true, result, 'Availability set successfully'));
    } catch (error) {
      logger.error('Set availability controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message
      }));
    }
  }

  async getAvailability(req, res) {
    try {
      const availability = await bookingService.getAvailability(req.params.profileId);
      res.json(formatResponse(true, { availability }, 'Availability retrieved successfully'));
    } catch (error) {
      logger.error('Get availability controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(false, null, '', {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to retrieve availability'
      }));
    }
  }
}

module.exports = new BookingController();
