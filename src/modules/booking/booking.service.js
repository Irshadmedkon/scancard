const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const { generateRandomString } = require('../../utils/helpers');
const logger = require('../../utils/logger');

class BookingService {
  async getServices(profileId) {
    return await query(
      'SELECT * FROM booking_services WHERE profile_id = ? AND is_active = TRUE ORDER BY created_at DESC',
      [profileId]
    );
  }

  async createService(profileId, userId, serviceData) {
    const { service_name, description, duration_minutes, price, buffer_time } = serviceData;

    const result = await query(
      `INSERT INTO booking_services (profile_id, service_name, description, duration_minutes, price, buffer_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [profileId, service_name, description || null, duration_minutes, price, buffer_time || 0]
    );

    return await queryOne('SELECT * FROM booking_services WHERE service_id = ?', [result.insertId]);
  }

  async createBooking(profileId, bookingData) {
    const { service_id, booking_date, booking_time, customer_name, customer_email, customer_phone, notes } = bookingData;

    // Generate confirmation code
    const confirmation_code = generateRandomString(8).toUpperCase();

    const result = await query(
      `INSERT INTO bookings (profile_id, service_id, booking_date, booking_time, customer_name, customer_email, customer_phone, notes, confirmation_code, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [profileId, service_id, booking_date, booking_time, customer_name, customer_email || null, customer_phone, notes || null, confirmation_code]
    );

    return await queryOne('SELECT * FROM bookings WHERE booking_id = ?', [result.insertId]);
  }

  async getBookings(profileId, userId, filters = {}) {
    const { status, date, customer_phone } = filters;

    let sql = 'SELECT * FROM bookings WHERE profile_id = ?';
    const params = [profileId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (date) {
      sql += ' AND booking_date = ?';
      params.push(date);
    }

    if (customer_phone) {
      sql += ' AND customer_phone = ?';
      params.push(customer_phone);
    }

    sql += ' ORDER BY booking_date DESC, booking_time DESC';

    return await query(sql, params);
  }

  async updateBookingStatus(profileId, bookingId, userId, status) {
    const booking = await queryOne(
      'SELECT * FROM bookings WHERE booking_id = ? AND profile_id = ?',
      [bookingId, profileId]
    );

    if (!booking) {
      throw new Error('Booking not found');
    }

    await query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE booking_id = ?',
      [status, bookingId]
    );

    return await queryOne('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
  }

  async setAvailability(profileId, userId, availabilityData) {
    const { day_of_week, start_time, end_time, is_available } = availabilityData;

    // Check if availability exists
    const existing = await queryOne(
      'SELECT * FROM booking_availability WHERE profile_id = ? AND day_of_week = ?',
      [profileId, day_of_week]
    );

    if (existing) {
      await query(
        'UPDATE booking_availability SET start_time = ?, end_time = ?, is_available = ?, updated_at = NOW() WHERE availability_id = ?',
        [start_time, end_time, is_available !== false, existing.availability_id]
      );
    } else {
      await query(
        'INSERT INTO booking_availability (profile_id, day_of_week, start_time, end_time, is_available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [profileId, day_of_week, start_time, end_time, is_available !== false]
      );
    }

    return await query(
      'SELECT * FROM booking_availability WHERE profile_id = ? ORDER BY day_of_week',
      [profileId]
    );
  }

  async getAvailability(profileId, userId) {
    return await query(
      'SELECT * FROM booking_availability WHERE profile_id = ? ORDER BY day_of_week',
      [profileId]
    );
  }
}

module.exports = new BookingService();
